import { Request, Response } from 'express';
import pool from '../config/database.js';

export const getVentasPorPeriodo = async (req: Request, res: Response) => {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) {
        return res.status(400).json({ message: 'Debe especificar inicio y fin (YYYY-MM-DD)' });
    }

    try {
        // Ingresos agrupados por día (ventas diarias)
        const ventasQuery = await pool.query(`
            SELECT
                DATE(mf.fecha_hora) AS fecha,
                SUM(mf.monto) AS total
            FROM movimientos_financieros mf
            WHERE mf.tipo = 'ingreso'
              AND mf.fecha_hora::date BETWEEN $1 AND $2
            GROUP BY DATE(mf.fecha_hora)
            ORDER BY fecha ASC
        `, [inicio, fin]);

        // Total de ingresos
        const totalIngresos = ventasQuery.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total), 0);

        // Egresos desglosados por concepto (agrupados)
        const egresosQuery = await pool.query(`
            SELECT
                concepto,
                SUM(monto) AS total
            FROM movimientos_financieros mf
            WHERE mf.tipo = 'egreso'
              AND mf.fecha_hora::date BETWEEN $1 AND $2
            GROUP BY concepto
            ORDER BY total DESC
        `, [inicio, fin]);

        // Total de egresos
        const totalEgresos = egresosQuery.rows.reduce((sum: number, row: any) => sum + parseFloat(row.total), 0);

        // Productos vendidos (todos, sin límite de 10)
        const productosQuery = await pool.query(`
            SELECT
                pr.nombre_producto,
                pr.categoria,
                SUM(dp.cantidad) AS cantidad_vendida,
                SUM(dp.subtotal) AS total_vendido
            FROM detalle_pedidos dp
            JOIN pedidos p ON dp.id_pedido = p.id_pedido
            JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE p.hora_registro::date BETWEEN $1 AND $2
              AND p.estado = 'entregado'
            GROUP BY pr.nombre_producto, pr.categoria
            ORDER BY cantidad_vendida DESC
        `, [inicio, fin]);

        // Ingresos por método de pago (de cuentas cerradas)
        const metodoPagoQuery = await pool.query(`
            SELECT
                c.metodo_pago,
                SUM(c.total) AS total
            FROM cuentas c
            WHERE c.pagado = TRUE
              AND c.fecha_cierre::date BETWEEN $1 AND $2
            GROUP BY c.metodo_pago
        `, [inicio, fin]);

        // Ticket promedio
        const totalCuentas = await pool.query(`
            SELECT COUNT(*) AS cantidad FROM cuentas
            WHERE pagado = TRUE AND fecha_cierre::date BETWEEN $1 AND $2
        `, [inicio, fin]);
        const numCuentas = parseInt(totalCuentas.rows[0]?.cantidad || '0');
        const ticketPromedio = numCuentas > 0 ? totalIngresos / numCuentas : 0;

        res.json({
            ventasDiarias: ventasQuery.rows,
            totalIngresos,
            totalEgresos,
            saldoNeto: totalIngresos - totalEgresos,
            ticketPromedio,
            productosVendidos: productosQuery.rows,       // lista completa
            metodosPago: metodoPagoQuery.rows,
            egresosDetalle: egresosQuery.rows,
            periodo: { inicio, fin }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reporte' });
    }
};

// Dashboard resumido (últimos 7 días)
export const getResumenDashboard = async (req: Request, res: Response) => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy);
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const inicio = hace7Dias.toISOString().split('T')[0];
    const fin = hoy.toISOString().split('T')[0];

    try {
        const ventas = await pool.query(`
            SELECT SUM(monto) AS total FROM movimientos_financieros
            WHERE tipo = 'ingreso' AND fecha_hora::date BETWEEN $1 AND $2
        `, [inicio, fin]);
        const productos = await pool.query(`
            SELECT pr.nombre_producto, SUM(dp.cantidad) AS cantidad
            FROM detalle_pedidos dp
            JOIN pedidos p ON dp.id_pedido = p.id_pedido
            JOIN productos pr ON dp.id_producto = pr.id_producto
            WHERE p.estado = 'entregado' AND p.hora_registro::date BETWEEN $1 AND $2
            GROUP BY pr.nombre_producto
            ORDER BY cantidad DESC LIMIT 5
        `, [inicio, fin]);

        res.json({
            ventas7dias: ventas.rows[0]?.total || 0,
            topProductos: productos.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener resumen' });
    }
};
