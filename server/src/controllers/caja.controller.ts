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
            return res.json({ activo: false, turno: null, movimientos: [] });
        }

        const turno = turnoResult.rows[0];

        // Obtener movimientos financieros del turno (ingresos/egresos)
        const movimientos = await pool.query(
            `SELECT id_movimiento_fin, tipo, monto, concepto, fecha_hora
             FROM movimientos_financieros
             WHERE id_turno = $1
             ORDER BY fecha_hora DESC`,
            [turno.id_turno]
        );

        // Calcular totales
        const totalIngresos = movimientos.rows
            .filter((m: any) => m.tipo === 'ingreso')
            .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
        const totalEgresos = movimientos.rows
            .filter((m: any) => m.tipo === 'egreso')
            .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
        const saldo = parseFloat(turno.monto_inicial) + totalIngresos - totalEgresos;

        res.json({
            activo: true,
            turno: { ...turno, totalIngresos, totalEgresos, saldo },
            movimientos: movimientos.rows
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

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener turno activo
        const turnoResult = await client.query(
            `SELECT id_turno, monto_inicial FROM turnos_caja WHERE estado = 'abierto' LIMIT 1 FOR UPDATE`
        );
        if (turnoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No hay un turno abierto' });
        }
        const turno = turnoResult.rows[0];

        // Calcular totales de movimientos financieros del turno
        const movs = await client.query(
            `SELECT tipo, SUM(monto) AS total FROM movimientos_financieros
             WHERE id_turno = $1 GROUP BY tipo`,
            [turno.id_turno]
        );
        const totalIngresos = parseFloat(movs.rows.find((r: any) => r.tipo === 'ingreso')?.total || '0');
        const totalEgresos = parseFloat(movs.rows.find((r: any) => r.tipo === 'egreso')?.total || '0');
        const saldo = parseFloat(turno.monto_inicial) + totalIngresos - totalEgresos;

        // Obtener desglose por método de pago y propinas de las cuentas cerradas en este turno
        // (esto es posible uniendo con cuentas, pedidos, etc., o bien calculando desde movimientos)
        // Como no tenemos relación directa entre movimiento_financiero y cuenta (solo id_pedido), podemos usar las cuentas cerradas donde id_turno (falta id_turno en cuentas?) Según el init.sql v3, cuentas no tiene id_turno. Pero podemos calcular a partir de los movimientos? Necesitamos una lógica más simple: como cada cuenta cerrada genera un movimiento financiero con concepto "Cierre de cuenta...", podríamos extraer el id_cuenta del concepto y luego consultar las cuentas. Sin embargo, eso es frágil. Mejor plan: agregar columna id_turno a cuentas en el futuro. Por ahora, podemos dejar los detalles de método de pago como opcionales y calcular solo totales generales.

        // Vamos a obtener estadísticas de cuentas cerradas en el último turno? No hay relación directa. Para cerrar el turno simplemente registramos el cierre con los totales que tenemos. El arqueo detallado lo podemos implementar más adelante cuando añadas id_turno a cuentas.

        await client.query(
            `UPDATE turnos_caja SET estado = 'cerrado' WHERE id_turno = $1`,
            [turno.id_turno]
        );

        await client.query(
            `INSERT INTO cierre_caja (id_turno, total_ingresos, total_egresos, saldo, id_usuario)
             VALUES ($1, $2, $3, $4, $5)`,
            [turno.id_turno, totalIngresos, totalEgresos, saldo, id_usuario]
        );

        await client.query('COMMIT');
        res.json({
            message: 'Turno cerrado correctamente',
            cierre: { id_turno: turno.id_turno, total_ingresos: totalIngresos, total_egresos: totalEgresos, saldo }
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
