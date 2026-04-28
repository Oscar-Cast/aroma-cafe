// server/src/routes/usuario.routes.ts
// NUEVO: rutas de usuarios. Solo el administrador puede gestionar usuarios.

import { Router } from 'express';
import {
    getUsuarios,
    createUsuario,
    updateUsuario,
    bajaUsuario,
} from '../controllers/usuario.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { isAdmin }        from '../middlewares/checkRole.js';

const router = Router();

// Todas las rutas requieren autenticación y rol administrador
router.get('/',    authMiddleware, isAdmin, getUsuarios);
router.post('/',   authMiddleware, isAdmin, createUsuario);
router.put('/:id', authMiddleware, isAdmin, updateUsuario);

// Baja lógica (cambia estado a inactivo)
router.patch('/:id/baja', authMiddleware, isAdmin, bajaUsuario);

export default router;
