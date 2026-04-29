import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener el turno activo (si existe)
export const getTurnoActivo = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id_turno, fecha_apertura, monto_inicial, estado, id_usuario_apertura
             FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
        );
        if (result.rowCount === 0) {
            return res.json(null); // No hay turno activo
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener turno activo' });
    }
};

// Abrir un nuevo turno
export const abrirTurno = async (req: Request, res: Response) => {
    const { monto_inicial } = req.body;
    const id_usuario = (req as any).user.id_usuario;

    if (monto_inicial === undefined || monto_inicial < 0) {
        return res.status(400).json({ message: 'Monto inicial inválido' });
    }

    try {
        // Verificar que no haya un turno ya abierto
        const abierto = await pool.query(`SELECT id_turno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`);
        if (abierto.rowCount! > 0) {
            return res.status(400).json({ message: 'Ya existe un turno abierto. Ciérrelo antes de abrir uno nuevo.' });
        }

        const result = await pool.query(
            `INSERT INTO turnos_caja (monto_inicial, id_usuario_apertura, estado) VALUES ($1, $2, 'abierto') RETURNING *`,
            [monto_inicial, id_usuario]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al abrir turno' });
    }
};

// Cerrar el turno activo y generar cierre de caja
export const cerrarTurno = async (req: Request, res: Response) => {
    const id_usuario = (req as any).user.id_usuario;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Bloquear el turno activo para evitar cambios concurrentes
        const turnoResult = await client.query(
            `SELECT id_turno, monto_inicial FROM turnos_caja WHERE estado = 'abierto' LIMIT 1 FOR UPDATE`
        );
        if (turnoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No hay turno abierto para cerrar' });
        }
        const turno = turnoResult.rows[0];

        // Calcular ingresos: suma de cuentas cerradas durante este turno
        // (Las cuentas se cierran con un movimiento financiero, así que podemos sumar esos movimientos)
        const ingresosResult = await client.query(
            `SELECT COALESCE(SUM(monto), 0) AS total_ingresos
             FROM movimientos_financieros
             WHERE id_turno = $1 AND tipo = 'ingreso'`,
            [turno.id_turno]
        );
        const total_ingresos = parseFloat(ingresosResult.rows[0].total_ingresos);

        // Calcular egresos
        const egresosResult = await client.query(
            `SELECT COALESCE(SUM(monto), 0) AS total_egresos
             FROM movimientos_financieros
             WHERE id_turno = $1 AND tipo = 'egreso'`,
            [turno.id_turno]
        );
        const total_egresos = parseFloat(egresosResult.rows[0].total_egresos);

        // Desglose por método de pago (de las cuentas cerradas en este turno)
        const desgloseResult = await client.query(
            `SELECT
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS tarjeta,
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS transferencia,
                COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN propina ELSE 0 END), 0) AS propinas_efectivo,
                COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN propina ELSE 0 END), 0) AS propinas_tarjeta,
                COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN propina ELSE 0 END), 0) AS propinas_transferencia
             FROM cuentas
             WHERE id_turno = $1 AND estado = 'cerrada'`,
            [turno.id_turno]
        );
        const desglose = desgloseResult.rows[0];

        const saldo = parseFloat(turno.monto_inicial) + total_ingresos - total_egresos;

        // Insertar cierre
        const cierreResult = await client.query(
            `INSERT INTO cierre_caja
                (id_turno, total_ingresos, total_egresos, saldo,
                 detalle_efectivo, detalle_tarjeta, detalle_transferencia,
                 propinas_efectivo, propinas_tarjeta, propinas_transferencia,
                 id_usuario)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [
                turno.id_turno, total_ingresos, total_egresos, saldo,
                desglose.efectivo, desglose.tarjeta, desglose.transferencia,
                desglose.propinas_efectivo, desglose.propinas_tarjeta, desglose.propinas_transferencia,
                id_usuario
            ]
        );

        // Marcar turno como cerrado
        await client.query(`UPDATE turnos_caja SET estado = 'cerrado' WHERE id_turno = $1`, [turno.id_turno]);

        await client.query('COMMIT');
        res.json(cierreResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar turno' });
    } finally {
        client.release();
    }
};

// Obtener historial de cierres (para la vista de caja)
export const getHistorialCierres = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT cc.*, u.nombre_usuario
             FROM cierre_caja cc
             JOIN usuarios u ON cc.id_usuario = u.id_usuario
             ORDER BY cc.fecha_cierre DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
};
