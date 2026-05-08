import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener todas las mesas
export const getMesas = async (req: Request, res: Response) => {
    try {
        // Si se pasa ?todos=1, se muestran todas (incluyendo inactivas)
        const mostrarTodas = req.query.todos === '1';
        
        let query = 'SELECT * FROM mesas';
        if (!mostrarTodas) {
            query += " WHERE estado != 'inactiva'";
        }
        query += ' ORDER BY numero_mesa ASC';
        
        const result = await pool.query(query);
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
        const mesa = await pool.query('SELECT estado FROM mesas WHERE id_mesa = $1', [id]);
        if (mesa.rowCount === 0) {
            return res.status(404).json({ message: 'Mesa no encontrada' });
        }
        if (mesa.rows[0].estado === 'ocupada') {
            return res.status(400).json({ message: 'No se puede desactivar una mesa ocupada' });
        }

        // En lugar de DELETE, ponemos estado 'inactiva'
        const result = await pool.query(
            `UPDATE mesas SET estado = 'inactiva' WHERE id_mesa = $1 RETURNING *`,
            [id]
        );
        res.json({ message: 'Mesa desactivada correctamente', mesa: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al desactivar mesa' });
    }
};
