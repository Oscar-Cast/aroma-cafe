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
            `SELECT id_movimiento_fin, tipo, monto, concepto, fecha_hora, id_pedido
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

        // Movimientos manuales (sin id_pedido) para calcular efectivo
        const ingresosManuales = movimientos.rows
            .filter(m => m.tipo === 'ingreso' && !m.id_pedido)
            .reduce((sum, m) => sum + parseFloat(m.monto), 0);
        const egresosManuales = movimientos.rows
            .filter(m => m.tipo === 'egreso' && !m.id_pedido)
            .reduce((sum, m) => sum + parseFloat(m.monto), 0);

        const efectivoEsperado = parseFloat(turno.monto_inicial) + desglose.efectivo + ingresosManuales - egresosManuales;

        res.json({
            activo: true,
            turno: {
                ...turno,
                totalIngresos,
                totalEgresos,
                saldo,
                desglose,
                efectivo_esperado: efectivoEsperado,
            },
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
    const { efectivo_contado } = req.body;   // puede ser undefined si el campo quedó vacío

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Obtener turno activo
        const turnoResult = await client.query(
            `SELECT id_turno, monto_inicial, fecha_apertura FROM turnos_caja WHERE estado = 'abierto' LIMIT 1 FOR UPDATE`
        );
        if (turnoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No hay un turno abierto' });
        }
        const turno = turnoResult.rows[0];

        // 2. Totales de movimientos financieros del turno (ingresos / egresos)
        const movs = await client.query(
            `SELECT tipo, SUM(monto) AS total FROM movimientos_financieros
             WHERE id_turno = $1 GROUP BY tipo`,
            [turno.id_turno]
        );
        const totalIngresos = parseFloat(movs.rows.find((r: any) => r.tipo === 'ingreso')?.total || '0');
        const totalEgresos = parseFloat(movs.rows.find((r: any) => r.tipo === 'egreso')?.total || '0');
        const saldo = parseFloat(turno.monto_inicial) + totalIngresos - totalEgresos;

        // 3. Desglose por método de pago y propinas (de cuentas cerradas en el período del turno)
        const desgloseQuery = await client.query(`
            SELECT 
                c.metodo_pago,
                SUM(c.total) AS total_metodo,
                SUM(c.propina) AS total_propina
            FROM cuentas c
            WHERE c.pagado = TRUE
                AND c.fecha_cierre >= $1
                AND c.fecha_cierre <= CURRENT_TIMESTAMP
            GROUP BY c.metodo_pago
        `, [turno.fecha_apertura]);

        const detalleEfectivo = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'efectivo')?.total_metodo || '0');
        const detalleTarjeta = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'tarjeta')?.total_metodo || '0');
        const detalleTransferencia = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'transferencia')?.total_metodo || '0');
        const propinasEfectivo = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'efectivo')?.total_propina || '0');
        const propinasTarjeta = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'tarjeta')?.total_propina || '0');
        const propinasTransferencia = parseFloat(desgloseQuery.rows.find((r: any) => r.metodo_pago === 'transferencia')?.total_propina || '0');

        // 4. Efectivo esperado en caja (base para el arqueo)
        //    = fondo inicial + cobros en efectivo - egresos en efectivo - total de propinas
        const egresosEfectivo = movs.rows
            .filter((r: any) => r.tipo === 'egreso')
            .reduce((sum: number, r: any) => sum + parseFloat(r.total), 0);
        const propinasTotales = propinasEfectivo + propinasTarjeta + propinasTransferencia;
        const efectivoEsperado = parseFloat(turno.monto_inicial) + detalleEfectivo - egresosEfectivo - propinasTotales;

        const efectivoContado = parseFloat(efectivo_contado) || 0;
        const diferencia = efectivoContado - efectivoEsperado;

        if (efectivo_contado !== undefined && efectivo_contado !== null) {
            efectivoContado = parseFloat(efectivo_contado);
            diferencia = efectivoContado - efectivoEsperado;
        }

        // 6. Cerrar turno y guardar cierre
        await client.query(`UPDATE turnos_caja SET estado = 'cerrado' WHERE id_turno = $1`, [turno.id_turno]);

        await client.query(
            `INSERT INTO cierre_caja 
                (id_turno, total_ingresos, total_egresos, saldo, detalle_efectivo, detalle_tarjeta, detalle_transferencia,
                 propinas_efectivo, propinas_tarjeta, propinas_transferencia, efectivo_contado, diferencia, id_usuario)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [turno.id_turno, totalIngresos, totalEgresos, saldo, detalleEfectivo, detalleTarjeta, detalleTransferencia,
             propinasEfectivo, propinasTarjeta, propinasTransferencia, efectivoContado, diferencia, id_usuario]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Turno cerrado correctamente',
            cierre: {
                id_turno: turno.id_turno,
                total_ingresos: totalIngresos,
                total_egresos: totalEgresos,
                saldo,
                efectivo_contado: efectivoContado,
                diferencia
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

// Historial de cierres 
export const getHistorialCierres = async (req: Request, res: Response) => {
    try {
        const { inicio, fin } = req.query;
        let whereClause = '';
        const params: any[] = [];

        if (inicio && fin) {
            whereClause = `WHERE cc.fecha_cierre::date BETWEEN $1 AND $2`;
            params.push(inicio, fin);
        }

        const result = await pool.query(`
            SELECT cc.*, t.fecha_apertura, t.monto_inicial, u.nombre_usuario
            FROM cierre_caja cc
            JOIN turnos_caja t ON cc.id_turno = t.id_turno
            JOIN usuarios u ON cc.id_usuario = u.id_usuario
            ${whereClause}
            ORDER BY cc.fecha_cierre DESC
        `, params);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener historial de cierres' });
    }
};
