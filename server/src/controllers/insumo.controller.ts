import { Request, Response } from 'express';
import pool from '../config/database.js';

// Obtener todos los insumos
export const getInsumos = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM insumos ORDER BY nombre_insumo ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener insumos" });
    }
};

// Crear un nuevo insumo (ej. "Leche Entera", "Grano Chiapas")
export const createInsumo = async (req: Request, res: Response) => {
    const { nombre_insumo, unidad_medida, existencia_actual, nivel_minimo } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO insumos (nombre_insumo, unidad_medida, existencia_actual, nivel_minimo) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre_insumo, unidad_medida, existencia_actual, nivel_minimo]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al crear insumo" });
    }
};

// Actualizar stock de insumo (útil para cuando llega un proveedor)
export const updateInsumo = async (req: Request, res: Response) => {
    const { id } = req.params;
    const campos = req.body;               // { nombre_insumo?, unidad_medida?, existencia_actual?, nivel_minimo? }

    if (!id || Object.keys(campos).length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar' });
    }

    // Construir dinámicamente la consulta SET
    const setClauses: string[] = [];
    const values: any[] = [];
    let contador = 1;

    for (const [campo, valor] of Object.entries(campos)) {
        // Evitar campos no deseados (solo los permitidos)
        if (['nombre_insumo', 'unidad_medida', 'existencia_actual', 'nivel_minimo'].includes(campo)) {
            setClauses.push(`${campo} = $${contador}`);
            values.push(valor);
            contador++;
        }
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ message: 'Ningún campo válido para actualizar' });
    }

    values.push(id);

    const query = `UPDATE insumos SET ${setClauses.join(', ')} WHERE id_insumo = $${contador} RETURNING *`;

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Insumo no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar insumo' });
    }
};
