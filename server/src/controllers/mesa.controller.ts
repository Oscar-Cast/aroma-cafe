import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener todas las mesas
export const getMesas = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM mesas ORDER BY numero_mesa ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener mesas' });
    }
};

// Crear una mesa
export const createMesa = async (req: Request, res: Response) => {
    const { numero_mesa, capacidad, ubicacion, estado } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO mesas (numero_mesa, capacidad, ubicacion, estado)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [numero_mesa, capacidad, ubicacion, estado || 'disponible']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear mesa' });
    }
};

// Actualizar una mesa
export const updateMesa = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { numero_mesa, capacidad, ubicacion, estado } = req.body;
    try {
        const result = await pool.query(
            `UPDATE mesas SET numero_mesa=$1, capacidad=$2, ubicacion=$3, estado=$4
             WHERE id_mesa=$5 RETURNING *`,
            [numero_mesa, capacidad, ubicacion, estado, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Mesa no encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar mesa' });
    }
};

// Eliminar una mesa
export const deleteMesa = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM mesas WHERE id_mesa = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Mesa no encontrada' });
        res.json({ message: 'Mesa eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar mesa' });
    }
};
