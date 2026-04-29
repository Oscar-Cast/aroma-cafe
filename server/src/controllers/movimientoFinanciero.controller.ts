import { Request, Response } from 'express';
import pool from '../config/database.js';

// Registrar ingreso o egreso manual
export const registrarMovimientoFinanciero = async (req: Request, res: Response) => {
    const { tipo, monto, concepto } = req.body;
    const id_usuario = (req as any).user.id_usuario;

    if (!tipo || !monto || !concepto) {
        return res.status(400).json({ message: 'tipo, monto y concepto son requeridos' });
    }
    if (!['ingreso', 'egreso'].includes(tipo)) {
        return res.status(400).json({ message: 'tipo debe ser "ingreso" o "egreso"' });
    }

    try {
        // Obtener turno activo
        const turnoActivo = await pool.query(
            `SELECT id_turno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1`
        );
        if (turnoActivo.rowCount === 0) {
            return res.status(400).json({ message: 'No hay turno activo. Abre un turno primero.' });
        }
        const id_turno = turnoActivo.rows[0].id_turno;

        const result = await pool.query(`
            INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id_turno, tipo, monto, concepto]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar movimiento financiero' });
    }
};

// Historial completo
export const getHistorialMovimientosFinancieros = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                mf.id_movimiento_fin,
                mf.tipo,
                mf.monto,
                mf.concepto,
                mf.fecha_hora,
                u.nombre_usuario AS usuario
            FROM movimientos_financieros mf
            INNER JOIN turnos_caja t ON mf.id_turno = t.id_turno
            INNER JOIN usuarios u ON t.id_usuario_apertura = u.id_usuario
            ORDER BY mf.fecha_hora DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener historial de movimientos financieros' });
    }
};
