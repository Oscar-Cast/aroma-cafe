// server/src/controllers/movimientoFinanciero.controller.ts
// NUEVO: controlador para la tabla movimientos_financieros.
// El controlador original (movimiento.controller.ts) opera sobre
// movimientos_inventario. Este es el correcto para el panel de
// "Movimientos Financieros" del frontend.

import { Request, Response } from 'express';
import pool from '../config/database.js';

// ── REGISTRAR MOVIMIENTO FINANCIERO ───────────────────────────────────
export const registrarMovimientoFinanciero = async (req: Request, res: Response) => {
    const { tipo, monto, concepto, id_pedido } = req.body;

    if (!tipo || !monto || !concepto) {
        return res.status(400).json({ message: 'tipo, monto y concepto son requeridos' });
    }
    if (!['ingreso', 'egreso'].includes(tipo)) {
        return res.status(400).json({ message: 'tipo debe ser "ingreso" o "egreso"' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO movimientos_financieros (tipo, monto, concepto, id_pedido)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [tipo, monto, concepto, id_pedido || null]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar movimiento financiero' });
    }
};

// ── HISTORIAL DE MOVIMIENTOS FINANCIEROS ─────────────────────────────
export const getHistorialMovimientosFinancieros = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                mf.*,
                p.mesa AS pedido_mesa
            FROM movimientos_financieros mf
            LEFT JOIN pedidos p ON mf.id_pedido = p.id_pedido
            ORDER BY mf.fecha_hora DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener movimientos financieros' });
    }
};
