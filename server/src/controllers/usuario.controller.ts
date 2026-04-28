// server/src/controllers/usuario.controller.ts
// NUEVO: controlador completo de usuarios que faltaba en el proyecto.
// El frontend necesita CRUD de usuarios para que el administrador
// pueda dar altas, editar datos/rol y dar de baja.

import { Request, Response } from 'express';
import pool   from '../config/database.js';
import bcrypt from 'bcryptjs';

// ── OBTENER TODOS LOS USUARIOS ────────────────────────────────────────
export const getUsuarios = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                id_usuario,
                nombre_completo,
                nombre_usuario,
                rol,
                estado,
                fecha_alta
            FROM usuarios
            ORDER BY fecha_alta DESC
        `);
        // Nunca se devuelve contrasena_cifrada
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// ── CREAR USUARIO ─────────────────────────────────────────────────────
export const createUsuario = async (req: Request, res: Response) => {
    const { nombre_completo, nombre_usuario, contrasena, rol, estado } = req.body;

    if (!nombre_completo || !nombre_usuario || !contrasena || !rol) {
        return res.status(400).json({ message: 'Nombre, usuario, contraseña y rol son requeridos' });
    }

    const rolesValidos = ['administrador', 'cajero', 'mesero', 'barra', 'cocina'];
    if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ message: `Rol inválido. Opciones: ${rolesValidos.join(', ')}` });
    }

    try {
        // Verificar que el nombre_usuario no exista
        const existe = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE nombre_usuario = $1', [nombre_usuario]
        );
        if (existe.rowCount && existe.rowCount > 0) {
            return res.status(409).json({ message: 'El nombre de usuario ya está en uso' });
        }

        const contrasena_cifrada = await bcrypt.hash(contrasena, 10);

        const result = await pool.query(`
            INSERT INTO usuarios
                (nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_usuario, nombre_completo, nombre_usuario, rol, estado, fecha_alta
        `, [nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado || 'activo']);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

// ── ACTUALIZAR USUARIO ────────────────────────────────────────────────
// La contraseña es opcional: si no se envía, se conserva la existente.
export const updateUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre_completo, nombre_usuario, contrasena, rol, estado } = req.body;

    try {
        // Verificar que el usuario existe
        const existente = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE id_usuario = $1', [id]
        );
        if (existente.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar colisión de nombre_usuario (excluyendo el propio registro)
        if (nombre_usuario) {
            const colision = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE nombre_usuario = $1 AND id_usuario <> $2',
                [nombre_usuario, id]
            );
            if (colision.rowCount && colision.rowCount > 0) {
                return res.status(409).json({ message: 'El nombre de usuario ya está en uso' });
            }
        }

        // Construir la query dinámicamente según si viene o no contraseña nueva
        let query: string;
        let params: any[];

        if (contrasena) {
            const contrasena_cifrada = await bcrypt.hash(contrasena, 10);
            query = `
                UPDATE usuarios
                SET nombre_completo    = $1,
                    nombre_usuario     = $2,
                    contrasena_cifrada = $3,
                    rol                = $4,
                    estado             = $5
                WHERE id_usuario = $6
                RETURNING id_usuario, nombre_completo, nombre_usuario, rol, estado, fecha_alta
            `;
            params = [nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado, id];
        } else {
            query = `
                UPDATE usuarios
                SET nombre_completo = $1,
                    nombre_usuario  = $2,
                    rol             = $3,
                    estado          = $4
                WHERE id_usuario = $5
                RETURNING id_usuario, nombre_completo, nombre_usuario, rol, estado, fecha_alta
            `;
            params = [nombre_completo, nombre_usuario, rol, estado, id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

// ── DAR DE BAJA (soft delete) ─────────────────────────────────────────
// No se elimina físicamente; se cambia estado a 'inactivo'.
// Un usuario inactivo no puede hacer login (validado en authService).
export const bajaUsuario = async (req: Request, res: Response) => {
    const { id } = req.params;

    // Evitar que el admin se dé de baja a sí mismo
    const solicitante = (req as any).user?.id_usuario;
    if (String(solicitante) === String(id)) {
        return res.status(400).json({ message: 'No puedes darte de baja a ti mismo' });
    }

    try {
        const result = await pool.query(
            `UPDATE usuarios SET estado = 'inactivo'
             WHERE id_usuario = $1
             RETURNING id_usuario, nombre_usuario, estado`,
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario dado de baja', usuario: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al dar de baja al usuario' });
    }
};
