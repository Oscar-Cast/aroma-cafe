import { Request, Response } from 'express';
import pool from '../config/database.js';

export const realizarCierre = async (req: Request, res: Response) => {
    const { total_egresos } = req.body; 
    const id_usuario = (req as any).user.id_usuario; // El admin que cierra la caja

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Sumar todos los pedidos del día que no han sido cerrados
        // (En una versión avanzada, filtrarías por fecha y estado 'entregado')
        const ingresosResult = await client.query(
            'SELECT SUM(monto_total) as total FROM pedidos WHERE hora_registro::date = CURRENT_DATE'
        );
        const total_ingresos = ingresosResult.rows[0].total || 0;
        const saldo = total_ingresos - total_egresos;

        // 2. Insertar el registro en cierre_caja
        const cierreQuery = `
            INSERT INTO cierre_caja (total_ingresos, total_egresos, saldo, id_usuario)
            VALUES ($1, $2, $3, $4) RETURNING *`;
        const nuevoCierre = await client.query(cierreQuery, [total_ingresos, total_egresos, saldo, id_usuario]);

        // 3. Opcional: Vincular movimientos financieros al cierre
        await client.query(
            'UPDATE movimientos_financieros SET id_cierre = $1 WHERE id_cierre IS NULL',
            [nuevoCierre.rows[0].id_cierre]
        );

        await client.query('COMMIT');
        res.status(201).json(nuevoCierre.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al procesar el cierre de caja' });
    } finally {
        client.release();
    }
};

export const getHistorialCierres = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT c.*, u.nombre_usuario 
            FROM cierre_caja c 
            JOIN usuarios u ON c.id_usuario = u.id_usuario 
            ORDER BY c.fecha_cierre DESC`);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener historial de cierres' });
    }
};
