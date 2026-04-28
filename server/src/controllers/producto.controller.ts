import { Request, Response } from 'express';
import pool from '../config/database';

export const getProductos = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id_producto ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
};

export const createProducto = async (req: Request, res: Response) => {
    const { nombre_producto, descripcion, precio, categoria, disponible } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO productos (nombre_producto, descripcion, precio, categoria, disponible) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre_producto, descripcion, precio, categoria, disponible]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al crear producto" });
    }
};

export const updateProducto = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre_producto, descripcion, precio, categoria, disponible } = req.body;
    try {
        const result = await pool.query(
            'UPDATE productos SET nombre_producto=$1, descripcion=$2, precio=$3, categoria=$4, disponible=$5 WHERE id_producto=$6 RETURNING *',
            [nombre_producto, descripcion, precio, categoria, disponible, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Producto no encontrado" });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar" });
    }
};

// Eliminar un producto
export const deleteProducto = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM productos WHERE id_producto = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Producto no encontrado" });
        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar" });
    }
};
