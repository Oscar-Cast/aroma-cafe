import { Request, Response } from 'express';
import pool from '../config/database.js';

export const registrarMovimiento = async (req: Request, res: Response) => {
    const { id_insumo, tipo_movimiento, cantidad, id_pedido } = req.body;
    const id_usuario = (req as any).user.id_usuario; // Obtenido del JWT

    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Iniciamos transacción

        // 1. Insertar el registro del movimiento
        const movimientoQuery = `
            INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, id_usuario, id_pedido)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const nuevoMovimiento = await client.query(movimientoQuery, [id_insumo, tipo_movimiento, cantidad, id_usuario, id_pedido]);

        // 2. Actualizar la existencia en la tabla insumos
        // Si es 'entrada' o 'ajuste' positivo, suma. Si es 'salida_venta' o 'merma', resta.
        const operador = (tipo_movimiento === 'entrada' || (tipo_movimiento === 'ajuste' && cantidad > 0)) ? '+' : '-';
        
        await client.query(
            `UPDATE insumos SET existencia_actual = existencia_actual ${operador} $1 WHERE id_insumo = $2`,
            [Math.abs(cantidad), id_insumo]
        );

        await client.query('COMMIT');
        res.status(201).json(nuevoMovimiento.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: "Error al procesar el movimiento de inventario" });
    } finally {
        client.release();
    }
};

export const getHistorialMovimientos = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT m.*, i.nombre_insumo, u.nombre_usuario 
            FROM movimientos_inventario m
            JOIN insumos i ON m.id_insumo = i.id_insumo
            JOIN usuarios u ON m.id_usuario = u.id_usuario
            ORDER BY m.fecha_movimiento DESC`);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener historial" });
    }
};
