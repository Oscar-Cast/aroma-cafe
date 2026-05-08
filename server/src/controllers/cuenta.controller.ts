import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener todas las cuentas (abiertas y cerradas) – soporta ?detalle=1
export const getCuentas = async (req: Request, res: Response) => {
    const conDetalle = req.query.detalle === '1';
    try {
        let query;
        if (conDetalle) {
            query = `
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
                    COALESCE(
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'id_producto', dp.id_producto,
                                'nombre_producto', pr.nombre_producto,
                                'cantidad', dp.cantidad,
                                'precio_unitario', dp.precio_unitario,
                                'subtotal', dp.subtotal
                            ) ORDER BY dp.id_detalle
                        ) FILTER (WHERE dp.id_detalle IS NOT NULL),
                        '[]'
                    ) AS productos
                FROM cuentas c
                JOIN mesas m ON c.id_mesa = m.id_mesa
                LEFT JOIN pedidos p ON p.id_cuenta = c.id_cuenta
                LEFT JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
                LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
                WHERE c.estado = 'cerrada'
                GROUP BY c.id_cuenta, m.numero_mesa
                ORDER BY c.fecha_cierre DESC
            `;
        } else {
            query = `
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
                    c.fecha_cierre
                FROM cuentas c
                JOIN mesas m ON c.id_mesa = m.id_mesa
                ORDER BY c.fecha_apertura DESC
            `;
        }
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cuentas' });
    }
};

// Obtener cuentas abiertas (con detalle de productos e id_detalle)
export const getCuentasAbiertas = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id_cuenta,
                m.numero_mesa,
                c.fecha_apertura,
                (SELECT COALESCE(SUM(p2.monto_total), 0) FROM pedidos p2 WHERE p2.id_cuenta = c.id_cuenta) AS subtotal_acumulado,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id_detalle', dp.id_detalle,
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
            INNER JOIN pedidos p ON p.id_cuenta = c.id_cuenta
            LEFT  JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
            LEFT  JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE c.estado = 'abierta'
            GROUP BY c.id_cuenta, m.numero_mesa, c.fecha_apertura
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

        const pedidosResult = await client.query(
            `SELECT SUM(monto_total) AS subtotal FROM pedidos WHERE id_cuenta = $1`, [id]
        );
        const subtotal = parseFloat(pedidosResult.rows[0].subtotal) || 0;

        const prop = propina ? parseFloat(propina) : 0;
        const total = subtotal + prop;

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

        await client.query(
            `UPDATE mesas SET estado = 'disponible' WHERE id_mesa = $1`,
            [cuenta.id_mesa]
        );

        const turnoActivo = await client.query(
            `SELECT id_turno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
        );
        if (turnoActivo.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No hay turno abierto para registrar el ingreso' });
        }
        const idTurno = turnoActivo.rows[0].id_turno;

        const pedidoRef = await client.query(
            `SELECT id_pedido FROM pedidos WHERE id_cuenta = $1 LIMIT 1`,
            [id]
        );
        const id_pedido_ref = pedidoRef.rows[0]?.id_pedido || null;

        await client.query(
            `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto, id_pedido)
             VALUES ($1, 'ingreso', $2, $3, $4)`,
            [idTurno, total, `Cierre de cuenta ${id} - Mesa ${cuenta.id_mesa}`, id_pedido_ref]
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

// ── NUEVO: Eliminar un detalle de una cuenta abierta (solo administrador) ──
export const eliminarDetalleCuenta = async (req: Request, res: Response) => {
    const { idCuenta, idDetalle } = req.params;
    const userId = (req as any).user.id_usuario;
    const userRol = (req as any).user.rol;

    if (userRol !== 'administrador') {
        return res.status(403).json({ message: 'Solo el administrador puede eliminar productos de una cuenta.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar cuenta abierta
        const cuentaResult = await client.query(
            `SELECT id_cuenta, id_mesa FROM cuentas WHERE id_cuenta = $1 AND estado = 'abierta' FOR UPDATE`,
            [idCuenta]
        );
        if (cuentaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Cuenta no encontrada o ya está cerrada' });
        }

        // 2. Obtener detalle a eliminar
        const detalleResult = await client.query(
            `SELECT dp.id_pedido, dp.subtotal, dp.cantidad, dp.id_producto, dp.precio_unitario
             FROM detalle_pedidos dp
             JOIN pedidos p ON dp.id_pedido = p.id_pedido
             WHERE dp.id_detalle = $1 AND p.id_cuenta = $2`,
            [idDetalle, idCuenta]
        );
        if (detalleResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Detalle no encontrado en esta cuenta' });
        }
        const detalle = detalleResult.rows[0];
        const idPedido = detalle.id_pedido;
        const subtotal = parseFloat(detalle.subtotal);
        const cantidad = detalle.cantidad;
        const idProducto = detalle.id_producto;

        // 3. Eliminar detalle
        await client.query(`DELETE FROM detalle_pedidos WHERE id_detalle = $1`, [idDetalle]);

        // 4. Actualizar pedido
        await client.query(
            `UPDATE pedidos SET monto_total = monto_total - $1 WHERE id_pedido = $2`,
            [subtotal, idPedido]
        );

        // 5. Actualizar cuenta
        await client.query(
            `UPDATE cuentas SET subtotal_acumulado = subtotal_acumulado - $1 WHERE id_cuenta = $2`,
            [subtotal, idCuenta]
        );

        // 6. Si el pedido se quedó sin detalles, eliminarlo
        const detallesRestantes = await client.query(
            `SELECT COUNT(*) FROM detalle_pedidos WHERE id_pedido = $1`, [idPedido]
        );
        if (parseInt(detallesRestantes.rows[0].count) === 0) {
            await client.query(`DELETE FROM pedidos WHERE id_pedido = $1`, [idPedido]);
        }

        // 7. Registrar merma
        await client.query(
            `INSERT INTO merma_productos (id_producto, cantidad, motivo, id_usuario)
             VALUES ($1, $2, 'Error de preparación', $3)`,
            [idProducto, cantidad, userId]
        );

        await client.query('COMMIT');

        // Devolver cuenta actualizada
        const cuentaActualizada = await client.query(`
            SELECT c.id_cuenta, m.numero_mesa, c.subtotal_acumulado, c.fecha_apertura,
                   COALESCE(
                       JSON_AGG(
                           JSON_BUILD_OBJECT(
                               'id_detalle', dp.id_detalle,
                               'cantidad', dp.cantidad,
                               'nombre_producto', pr.nombre_producto,
                               'precio_unitario', dp.precio_unitario,
                               'subtotal', dp.subtotal
                           ) ORDER BY dp.id_detalle
                       ) FILTER (WHERE dp.id_detalle IS NOT NULL),
                       '[]'
                   ) AS detalles
            FROM cuentas c
            JOIN mesas m ON c.id_mesa = m.id_mesa
            LEFT JOIN pedidos p ON p.id_cuenta = c.id_cuenta
            LEFT JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE c.id_cuenta = $1 AND c.estado = 'abierta'
            GROUP BY c.id_cuenta, m.numero_mesa`,
            [idCuenta]
        );
        res.json(cuentaActualizada.rows[0] || {});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar detalle de cuenta' });
    } finally {
        client.release();
    }
};
