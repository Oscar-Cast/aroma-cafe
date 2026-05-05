import { Request, Response } from 'express';
import pool from '../config/database.js';

// ── Helper: obtener o crear cuenta ──────────────────────────────────
async function obtenerOCrearCuenta(mesa: string, id_usuario: number): Promise<number> {
    // Buscar turno activo (obligatorio para crear cuentas)
    const turnoResult = await pool.query(
        `SELECT id_turno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
    );
    if (turnoResult.rowCount === 0) {
        throw new Error('No hay turno abierto. Primero debes abrir un turno.');
    }

    // Buscar la mesa por número
    const mesaRow = await pool.query(
        `SELECT id_mesa FROM mesas WHERE numero_mesa = $1`,
        [mesa]
    );
    if (mesaRow.rowCount === 0) {
        throw new Error(`La mesa "${mesa}" no está registrada.`);
    }
    const id_mesa = mesaRow.rows[0].id_mesa;

    // Buscar cuenta abierta para esa mesa
    const cuentaAbierta = await pool.query(
        `SELECT id_cuenta FROM cuentas WHERE id_mesa = $1 AND estado = 'abierta' LIMIT 1`,
        [id_mesa]
    );
    if (cuentaAbierta.rowCount! > 0) {
        return cuentaAbierta.rows[0].id_cuenta;
    }

    // Crear nueva cuenta vinculada al turno activo
    const nuevaCuenta = await pool.query(
        `INSERT INTO cuentas (id_mesa, estado, id_usuario_apertura)
         VALUES ($1, 'abierta', $2)
         RETURNING id_cuenta`,
        [id_mesa, id_usuario]
    );
    return nuevaCuenta.rows[0].id_cuenta;
}

// ── OBTENER PEDIDOS (con numero_pedido virtual por día) ─────────────
export const getPedidos = async (req: Request, res: Response) => {
    try {
        // Buscar turno activo
        const turnoActivo = await pool.query(
            `SELECT fecha_apertura FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
        );

        let filtroExtra = '';
        const params: any[] = [];

        if (turnoActivo.rowCount! > 0) {
            // Ocultar únicamente los pedidos ENTREGADOS anteriores al inicio del turno
            filtroExtra = `AND (p.estado != 'entregado' OR p.hora_registro >= $1)`;
            params.push(turnoActivo.rows[0].fecha_apertura);
        }

        const result = await pool.query(`
            SELECT
                p.id_pedido,
                p.numero_pedido,              -- número diario (mismo para subpedidos)
                m.numero_mesa AS mesa,
                p.estado,
                p.hora_registro,
                p.hora_entrega,
                p.monto_total,
                p.notas,
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
            JOIN cuentas c ON p.id_cuenta = c.id_cuenta
            JOIN mesas m ON c.id_mesa = m.id_mesa
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            LEFT JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
            LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE 1=1 ${filtroExtra}
            GROUP BY p.id_pedido, m.numero_mesa, u.nombre_usuario
            ORDER BY p.hora_registro DESC
        `, params);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener pedidos' });
    }
};

// ── CREAR PEDIDO  ────────────────────────────────
export const crearPedido = async (req: Request, res: Response) => {
    const { mesa, productos, notas } = req.body;
    const id_usuario = (req as any).user.id_usuario;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'El pedido debe tener al menos un producto' });
    }
    if (!mesa) {
        return res.status(400).json({ message: 'Debe especificar una mesa' });
    }

    // Obtener categorías reales de los productos desde la BD
    const ids = productos.map((p: any) => p.id_producto);
    const prodsInfo = await pool.query(
        `SELECT id_producto, categoria FROM productos WHERE id_producto = ANY($1)`,
        [ids]
    );
    const mapaCat = new Map(prodsInfo.rows.map((p: any) => [p.id_producto, p.categoria]));

    // Separar productos para barra y cocina
    const barraProds = productos.filter((p: any) => {
        const cat = mapaCat.get(p.id_producto);
        return cat && ['Bebidas Calientes', 'Bebidas Frías', 'Postres', 'Cafetería'].includes(cat);
    });
    const cocinaProds = productos.filter((p: any) => {
        const cat = mapaCat.get(p.id_producto);
        return cat && cat === 'Alimentos';
    });

    const grupos = [
        { area: 'barra', productos: barraProds },
        { area: 'cocina', productos: cocinaProds },
    ].filter(g => g.productos.length > 0);

    if (grupos.length === 0) {
        return res.status(400).json({ message: 'Ningún producto válido para preparar' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener el próximo número diario (una sola vez para todos los subpedidos)
        const conteoHoy = await client.query(
            `SELECT COUNT(*)::int + 1 AS siguiente
             FROM pedidos
             WHERE DATE(hora_registro) = CURRENT_DATE`
        );
        const numeroPedido = conteoHoy.rows[0].siguiente;

        // Obtener o crear cuenta
        let id_cuenta: number;
        try {
            id_cuenta = await obtenerOCrearCuenta(mesa, id_usuario);
        } catch (err: any) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: err.message });
        }

        const pedidosCreados: any[] = [];
        let totalGeneral = 0;

        for (const grupo of grupos) {
            const monto = grupo.productos.reduce(
                (acc: number, p: any) => acc + p.precio_unitario * p.cantidad, 0
            );
            totalGeneral += monto;

            const pedidoQuery = `
                INSERT INTO pedidos (id_cuenta, estado, monto_total, id_usuario, notas)
                VALUES ($1, 'pendiente', $2, $3, $4)
                RETURNING id_pedido`;
            const nuevo = await client.query(pedidoQuery,
                [id_cuenta, monto, id_usuario, notas || null]
            );
            const id_pedido = nuevo.rows[0].id_pedido;

            // Insertar detalles
            for (const prod of grupo.productos) {
                const subtotal = prod.cantidad * prod.precio_unitario;
                await client.query(
                    `INSERT INTO detalle_pedidos
                        (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id_pedido, prod.id_producto, prod.cantidad, prod.precio_unitario, subtotal]
                );
            }

            pedidosCreados.push({
                id_pedido,
                numero_pedido: numeroPedido,   // mismo número para todos los subpedidos
                area: grupo.area,
            });
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Pedido(s) registrado(s) con éxito',
            pedidos: pedidosCreados,
            numero_pedido: numeroPedido,
            monto_total: totalGeneral
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al procesar el pedido' });
    } finally {
        client.release();
    }
};

// ── ACTUALIZAR ESTADO DE PEDIDO ──────────────────────────────────────
export const actualizarEstadoPedido = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { estado } = req.body;
    const rol = (req as any).user?.rol;

    const estadosValidos = ['pendiente', 'en preparación', 'listo', 'entregado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: `Estado inválido: "${estado}"` });
    }

    // Validar permisos por rol
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

        const idxActual = estadosValidos.indexOf(actual.rows[0].estado);
        const idxNuevo  = estadosValidos.indexOf(estado);

        // Solo permitir avanzar (no retroceder)
        if (idxNuevo <= idxActual) {
            return res.status(400).json({
                message: `No se puede cambiar de "${actual.rows[0].estado}" a "${estado}".`
            });
        }

        // Registrar hora de entrega si corresponde
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
