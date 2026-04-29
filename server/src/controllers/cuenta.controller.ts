// server/src/controllers/cuenta.controller.ts

import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener todas las cuentas (abiertas y cerradas)
export const getCuentas = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id_cuenta,
                c.id_mesa,
                m.numero_mesa,
                c.estado,
                c.fecha_apertura,
                c.subtotal_acumulado,
                c.propina,
                c.total,
                c.metodo_pago,
                c.pagado,
                c.fecha_cierre,
                c.id_usuario_apertura,
                ua.nombre_usuario AS usuario_apertura,
                c.id_usuario_cierre,
                uc.nombre_usuario AS usuario_cierre
            FROM cuentas c
            JOIN mesas m ON c.id_mesa = m.id_mesa
            LEFT JOIN usuarios ua ON c.id_usuario_apertura = ua.id_usuario
            LEFT JOIN usuarios uc ON c.id_usuario_cierre = uc.id_usuario
            ORDER BY c.fecha_apertura DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cuentas' });
    }
};

// Obtener cuentas abiertas (con detalle de productos)
export const getCuentasAbiertas = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id_cuenta,
                m.numero_mesa,
                c.fecha_apertura,
                COALESCE(SUM(p.monto_total), 0) AS subtotal_acumulado,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'cantidad', dp.cantidad,
                            'nombre_producto', pr.nombre_producto,
                            'precio_unitario', dp.precio_unitario,
                            'subtotal', dp.subtotal
                        )
                    ) FILTER (WHERE dp.id_detalle IS NOT NULL),
                    '[]'
                ) AS detalles
            FROM cuentas c
            INNER JOIN mesas m ON c.id_mesa = m.id_mesa
            LEFT JOIN pedidos p ON p.id_cuenta = c.id_cuenta
            LEFT JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE c.estado = 'abierta'
            GROUP BY c.id_cuenta, m.numero_mesa
            ORDER BY c.fecha_apertura DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cuentas abiertas' });
    }
};

// Cerrar cuenta (cobro)
export const cerrarCuenta = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { metodo_pago, propina } = req.body;
    const id_usuario = (req as any).user.id_usuario;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar cuenta
        const cuentaResult = await client.query(
            `SELECT id_cuenta, id_mesa, estado FROM cuentas WHERE id_cuenta = $1 FOR UPDATE`, [id]
        );
        if (cuentaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }
        const cuenta = cuentaResult.rows[0];
        if (cuenta.estado !== 'abierta') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'La cuenta ya está cerrada' });
        }

        // Calcular subtotal desde pedidos
        const pedidosResult = await client.query(
            `SELECT SUM(monto_total) AS subtotal FROM pedidos WHERE id_cuenta = $1`, [id]
        );
        const subtotal = pedidosResult.rows[0].subtotal || 0;

        const prop = propina ? parseFloat(propina) : 0;
        const total = subtotal + prop;

        // Actualizar cuenta
        await client.query(
            `UPDATE cuentas SET
                estado = 'cerrada',
                subtotal_acumulado = $2,
                propina = $3,
                total = $4,
                metodo_pago = $5,
                pagado = TRUE,
                fecha_cierre = CURRENT_TIMESTAMP,
                id_usuario_cierre = $6
             WHERE id_cuenta = $1`,
            [id, subtotal, prop, total, metodo_pago, id_usuario]
        );

        // Liberar mesa
        await client.query(
            `UPDATE mesas SET estado = 'disponible' WHERE id_mesa = $1`,
            [cuenta.id_mesa]
        );

        // Obtener turno activo – IMPORTANTE: declarar la variable antes de usarla
        const turnoActivo = await client.query(
            `SELECT id_turno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
        );
        if (turnoActivo.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No hay turno abierto para registrar el ingreso' });
        }
        // Declaración explícita de idTurno (¡aquí se crea!)
        const idTurno = turnoActivo.rows[0].id_turno;

        // Insertar movimiento financiero usando idTurno
        await client.query(
            `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto)
             VALUES ($1, 'ingreso', $2, $3)`,
            [idTurno, total, `Cierre de cuenta ${id} - Mesa ${cuenta.id_mesa}`]
        );

        await client.query('COMMIT');
        res.json({ message: 'Cuenta cerrada correctamente', subtotal, propina: prop, total, metodo_pago });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar cuenta' });
    } finally {
        client.release();
    }
};
