import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener el turno activo (con resumen de ingresos/egresos del día)
export const getTurnoActivo = async (req: Request, res: Response) => {
    try {
        const turnoResult = await pool.query(
            `SELECT id_turno, fecha_apertura, monto_inicial, estado
             FROM turnos_caja
             WHERE estado = 'abierto'
             ORDER BY fecha_apertura DESC
             LIMIT 1`
        );

        if (turnoResult.rowCount === 0) {
            return res.json({ activo: false, turno: null, movimientos: [], desglose: null });
        }

        const turno = turnoResult.rows[0];

        // Movimientos financieros del turno
        const movimientos = await pool.query(
            `SELECT id_movimiento_fin, tipo, monto, concepto, fecha_hora
             FROM movimientos_financieros
             WHERE id_turno = $1
             ORDER BY fecha_hora DESC`,
            [turno.id_turno]
        );

        // Totales generales
        const totalIngresos = movimientos.rows
            .filter((m: any) => m.tipo === 'ingreso')
            .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
        const totalEgresos = movimientos.rows
            .filter((m: any) => m.tipo === 'egreso')
            .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
        const saldo = parseFloat(turno.monto_inicial) + totalIngresos - totalEgresos;

        // Desglose por método de pago y propinas
        const desgloseQuery = await pool.query(`
            SELECT 
                c.metodo_pago,
                SUM(c.total) AS total_metodo,
                SUM(c.propina) AS total_propina
            FROM movimientos_financieros mf
            JOIN pedidos p ON mf.id_pedido = p.id_pedido
            JOIN cuentas c ON p.id_cuenta = c.id_cuenta
            WHERE mf.id_turno = $1 AND mf.tipo = 'ingreso' AND c.pagado = TRUE
            GROUP BY c.metodo_pago
        `, [turno.id_turno]);

        const desglose = {
            efectivo: 0,
            tarjeta: 0,
            transferencia: 0,
            propinas_efectivo: 0,
            propinas_tarjeta: 0,
            propinas_transferencia: 0,
        };

        desgloseQuery.rows.forEach((row: any) => {
            const metodo = row.metodo_pago;
            if (metodo) {
                desglose[metodo] = parseFloat(row.total_metodo);
                if (metodo === 'efectivo') desglose.propinas_efectivo = parseFloat(row.total_propina);
                if (metodo === 'tarjeta') desglose.propinas_tarjeta = parseFloat(row.total_propina);
                if (metodo === 'transferencia') desglose.propinas_transferencia = parseFloat(row.total_propina);
            }
        });

        res.json({
            activo: true,
            turno: { ...turno, totalIngresos, totalEgresos, saldo, desglose },
            movimientos: movimientos.rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener turno activo' });
    }
};

// Abrir nuevo turno
export const abrirTurno = async (req: Request, res: Response) => {
    const { monto_inicial } = req.body;
    const id_usuario = (req as any).user.id_usuario;

    if (monto_inicial === undefined || monto_inicial < 0) {
        return res.status(400).json({ message: 'Monto inicial requerido y debe ser >= 0' });
    }

    // Verificar que no haya un turno abierto
    const turnoAbierto = await pool.query(
        `SELECT id_turno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
    );
    if (turnoAbierto.rowCount! > 0) {
        return res.status(400).json({ message: 'Ya existe un turno abierto. Ciérralo primero.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO turnos_caja (monto_inicial, id_usuario_apertura, estado)
             VALUES ($1, $2, 'abierto') RETURNING *`,
            [monto_inicial, id_usuario]
        );
        res.status(201).json({ message: 'Turno abierto', turno: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al abrir turno' });
    }
};

// Cerrar turno
export const cerrarTurno = async (req: Request, res: Response) => {
    const id_usuario = (req as any).user.id_usuario;
    const { egresosAdicionales } = req.body; // array opcional: [{ concepto: string, monto: number }]

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener turno activo
        const turnoResult = await client.query(
            `SELECT id_turno, monto_inicial, fecha_apertura FROM turnos_caja WHERE estado = 'abierto' LIMIT 1 FOR UPDATE`
        );
        if (turnoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No hay un turno abierto' });
        }
        const turno = turnoResult.rows[0];

        // Registrar egresos adicionales si los hay
        if (egresosAdicionales && Array.isArray(egresosAdicionales)) {
            for (const egreso of egresosAdicionales) {
                if (egreso.concepto && egreso.monto > 0) {
                    await client.query(
                        `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto)
                         VALUES ($1, 'egreso', $2, $3)`,
                        [turno.id_turno, egreso.monto, egreso.concepto]
                    );
                }
            }
        }

        // Calcular totales de movimientos financieros del turno (incluyendo los recién agregados)
        const movs = await client.query(
            `SELECT tipo, SUM(monto) AS total FROM movimientos_financieros
             WHERE id_turno = $1 GROUP BY tipo`,
            [turno.id_turno]
        );
        const totalIngresos = parseFloat(movs.rows.find((r: any) => r.tipo === 'ingreso')?.total || '0');
        const totalEgresos = parseFloat(movs.rows.find((r: any) => r.tipo === 'egreso')?.total || '0');
        const saldo = parseFloat(turno.monto_inicial) + totalIngresos - totalEgresos;

        // Obtener desglose por método de pago y propinas de cuentas cerradas en el período del turno
        const desgloseQuery = await client.query(`
            SELECT 
                c.metodo_pago,
                SUM(c.total) AS total_metodo,
                SUM(c.propina) AS total_propina
            FROM cuentas c
            WHERE c.pagado = TRUE
              AND c.fecha_cierre::date BETWEEN $1::date AND CURRENT_DATE
            GROUP BY c.metodo_pago
        `, [turno.fecha_apertura]);

        const detalleEfectivo = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'efectivo')?.total_metodo || '0');
        const detalleTarjeta = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'tarjeta')?.total_metodo || '0');
        const detalleTransferencia = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'transferencia')?.total_metodo || '0');
        const propinasEfectivo = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'efectivo')?.total_propina || '0');
        const propinasTarjeta = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'tarjeta')?.total_propina || '0');
        const propinasTransferencia = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'transferencia')?.total_propina || '0');

        // Cambiar estado del turno y registrar cierre
        await client.query(`UPDATE turnos_caja SET estado = 'cerrado' WHERE id_turno = $1`, [turno.id_turno]);

        await client.query(
            `INSERT INTO cierre_caja 
                (id_turno, total_ingresos, total_egresos, saldo, detalle_efectivo, detalle_tarjeta, detalle_transferencia,
                 propinas_efectivo, propinas_tarjeta, propinas_transferencia, id_usuario)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [turno.id_turno, totalIngresos, totalEgresos, saldo, detalleEfectivo, detalleTarjeta, detalleTransferencia,
             propinasEfectivo, propinasTarjeta, propinasTransferencia, id_usuario]
        );

        await client.query('COMMIT');
        res.json({
            message: 'Turno cerrado correctamente',
            cierre: {
                id_turno: turno.id_turno,
                total_ingresos: totalIngresos,
                total_egresos: totalEgresos,
                saldo,
                detalle_efectivo: detalleEfectivo,
                detalle_tarjeta: detalleTarjeta,
                detalle_transferencia: detalleTransferencia,
                propinas_efectivo: propinasEfectivo,
                propinas_tarjeta: propinasTarjeta,
                propinas_transferencia: propinasTransferencia
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar turno' });
    } finally {
        client.release();
    }
};

// Historial de cierres (opcional: listar turnos cerrados)
export const getHistorialCierres = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT cc.*, t.fecha_apertura, t.monto_inicial, u.nombre_usuario
            FROM cierre_caja cc
            JOIN turnos_caja t ON cc.id_turno = t.id_turno
            JOIN usuarios u ON cc.id_usuario = u.id_usuario
            ORDER BY cc.fecha_cierre DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener historial de cierres' });
    }
};
