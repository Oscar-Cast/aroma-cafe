// server/src/controllers/pedido.controller.ts
// CORRECCIONES:
//   1. Se agrega actualizarEstadoPedido (PATCH /:id/estado) — faltaba completamente.
//   2. getPedidos ahora incluye el detalle de productos por pedido, necesario
//      para los filtros de visibilidad de barra/cocina en el frontend.
//   3. Se registra hora_entrega automáticamente cuando el estado es 'entregado'.

import { Request, Response } from 'express';
import pool from '../config/database.js';

// ── CREAR PEDIDO ─────────────────────────────────────────────────────
export const crearPedido = async (req: Request, res: Response) => {
    const { mesa, productos } = req.body;
    // productos: array de { id_producto, cantidad, precio_unitario }
    const id_usuario = (req as any).user.id_usuario;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'El pedido debe tener al menos un producto' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Calcular monto total
        const monto_total = productos.reduce(
            (acc: number, p: any) => acc + p.precio_unitario * p.cantidad, 0
        );

        // 2. Insertar pedido
        const pedidoQuery = `
            INSERT INTO pedidos (mesa, estado, monto_total, id_usuario)
            VALUES ($1, 'pendiente', $2, $3)
            RETURNING id_pedido`;
        const nuevoPedido = await client.query(pedidoQuery, [mesa, monto_total, id_usuario]);
        const id_pedido   = nuevoPedido.rows[0].id_pedido;

        // 3. Insertar renglones de detalle
        for (const prod of productos) {
            const subtotal = prod.cantidad * prod.precio_unitario;
            await client.query(
                `INSERT INTO detalle_pedidos
                    (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id_pedido, prod.id_producto, prod.cantidad, prod.precio_unitario, subtotal]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Pedido registrado con éxito', id_pedido, monto_total });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al procesar el pedido' });
    } finally {
        client.release();
    }
};

// ── OBTENER PEDIDOS (con detalle de productos) ───────────────────────
// CORRECCIÓN: se incluye un JOIN con detalle_pedidos y productos para que
// el frontend pueda filtrar por categoría (barra ve bebidas, cocina ve alimentos).
export const getPedidos = async (req: Request, res: Response) => {
    try {
        // Pedidos con sus líneas de detalle en un array JSON agregado
        const result = await pool.query(`
            SELECT
                p.id_pedido,
                p.mesa,
                p.estado,
                p.hora_registro,
                p.hora_entrega,
                p.monto_total,
                p.id_usuario,
                u.nombre_usuario,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id_producto',    dp.id_producto,
                            'nombre_producto', pr.nombre_producto,
                            'categoria',       pr.categoria,
                            'cantidad',        dp.cantidad,
                            'precio_unitario', dp.precio_unitario,
                            'subtotal',        dp.subtotal
                        )
                    ) FILTER (WHERE dp.id_detalle IS NOT NULL),
                    '[]'
                ) AS detalles
            FROM pedidos p
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            LEFT JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            GROUP BY p.id_pedido, u.nombre_usuario
            ORDER BY p.hora_registro DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener pedidos' });
    }
};

// ── ACTUALIZAR ESTADO DE PEDIDO ──────────────────────────────────────
// NUEVO: endpoint que faltaba. Valida las transiciones de estado permitidas
// para evitar retrocesos inválidos (ej. de 'entregado' a 'pendiente').
export const actualizarEstadoPedido = async (req: Request, res: Response) => {
    const { id }     = req.params;
    const { estado } = req.body;
    const rol        = (req as any).user?.rol;

    const estadosValidos = ['pendiente', 'en preparación', 'listo', 'entregado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: `Estado inválido: "${estado}"` });
    }

    // Validar que el rol tiene permiso para el estado solicitado
    const permisosRol: Record<string, string[]> = {
        administrador:  ['pendiente', 'en preparación', 'listo', 'entregado'],
        cajero:         ['entregado'],
        mesero:         ['entregado'],
        barra:          ['en preparación', 'listo'],
        cocina:         ['en preparación', 'listo'],
    };
    if (!permisosRol[rol]?.includes(estado)) {
        return res.status(403).json({
            message: `El rol "${rol}" no puede establecer el estado "${estado}"`
        });
    }

    try {
        // Obtener estado actual para validar transición hacia adelante
        const actual = await pool.query(
            'SELECT estado FROM pedidos WHERE id_pedido = $1', [id]
        );
        if (actual.rowCount === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const orden = estadosValidos;
        const idxActual = orden.indexOf(actual.rows[0].estado);
        const idxNuevo  = orden.indexOf(estado);

        // Solo permitir avanzar (no retroceder estados)
        if (idxNuevo <= idxActual) {
            return res.status(400).json({
                message: `No se puede cambiar de "${actual.rows[0].estado}" a "${estado}". Solo se puede avanzar en el flujo.`
            });
        }

        // Si pasa a entregado, registrar hora de entrega
        const horaEntrega = estado === 'entregado' ? new Date() : null;
        const query = horaEntrega
            ? 'UPDATE pedidos SET estado=$1, hora_entrega=$2 WHERE id_pedido=$3 RETURNING *'
            : 'UPDATE pedidos SET estado=$1 WHERE id_pedido=$2 RETURNING *';
        const params = horaEntrega ? [estado, horaEntrega, id] : [estado, id];

        const result = await pool.query(query, params);
        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar estado del pedido' });
    }
};
