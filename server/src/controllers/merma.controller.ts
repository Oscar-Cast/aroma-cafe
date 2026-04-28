import { Request, Response } from 'express';
import pool from '../config/database.js';

export const registrarMerma = async (req: Request, res: Response) => {
    const { id_producto, cantidad, motivo } = req.body;
    const id_usuario = (req as any).user.id_usuario; // El usuario que reporta la merma

    try {
        // Insertar el registro de merma
        const query = `
            INSERT INTO merma_productos (id_producto, cantidad, motivo, id_usuario)
            VALUES ($1, $2, $3, $4) RETURNING *`;
        
        const result = await pool.query(query, [id_producto, cantidad, motivo, id_usuario]);
        
        res.status(201).json({
            message: "Merma registrada correctamente",
            merma: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al registrar la merma" });
    }
};

export const getHistorialMermas = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT m.*, p.nombre_producto, u.nombre_usuario 
            FROM merma_productos m
            JOIN productos p ON m.id_producto = p.id_producto
            JOIN usuarios u ON m.id_usuario = u.id_usuario
            ORDER BY m.fecha_hora DESC`;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener historial de mermas" });
    }
};
