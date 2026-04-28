// server/src/controllers/reporte.controller.ts
// CORRECCIÓN: la consulta de ventas por día usaba la columna 'fecha_alta'
// que no existe en la tabla pedidos. La columna correcta es 'hora_registro'.
// También se filtra solo pedidos en estado 'entregado' para que los ingresos
// del reporte sean consistentes con lo que realmente se cobró.

import { Request, Response } from 'express';
import pool from '../config/database.js';

// ── RESUMEN GENERAL (usado por el dashboard de reportes) ─────────────
export const getResumenVentas = async (req: Request, res: Response) => {
    try {
        // 1. Ventas totales por día — últimos 7 días
        // CORRECCIÓN: era 'fecha_alta', debe ser 'hora_registro::date'
        const ventasDias = await pool.query(`
            SELECT
                hora_registro::date AS fecha,
                SUM(monto_total)    AS total
            FROM pedidos
            WHERE
                estado = 'entregado'
                AND hora_registro >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY hora_registro::date
            ORDER BY fecha DESC
            LIMIT 7
        `);

        // 2. Productos más vendidos (top 5 por número de veces pedido)
        const topProductos = await pool.query(`
            SELECT
                pr.nombre_producto,
                SUM(dp.cantidad) AS cantidad_vendida
            FROM detalle_pedidos dp
            JOIN productos       pr ON dp.id_producto  = pr.id_producto
            JOIN pedidos          p  ON dp.id_pedido    = p.id_pedido
            WHERE p.estado = 'entregado'
            GROUP BY pr.nombre_producto
            ORDER BY cantidad_vendida DESC
            LIMIT 5
        `);

        // 3. Resumen del último cierre de caja
        const ultimoCierre = await pool.query(`
            SELECT
                total_ingresos,
                total_egresos,
                saldo,
                fecha_cierre
            FROM cierre_caja
            ORDER BY fecha_cierre DESC
            LIMIT 1
        `);

        res.json({
            graficaVentas:      ventasDias.rows,
            productosPopulares: topProductos.rows,
            resumenFinanciero:  ultimoCierre.rows[0] || null,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reportes' });
    }
};

// ── REPORTE MENSUAL (contabilidad) ────────────────────────────────────
export const getReporteMensual = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                TO_CHAR(fecha_cierre, 'YYYY-MM') AS mes,
                SUM(total_ingresos)              AS ingresos_mes,
                SUM(total_egresos)               AS egresos_mes,
                SUM(saldo)                       AS utilidad_neta
            FROM cierre_caja
            GROUP BY mes
            ORDER BY mes DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reporte mensual' });
    }
};
