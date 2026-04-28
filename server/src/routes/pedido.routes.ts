// server/src/routes/pedido.routes.ts
// CORRECCIÓN: se agrega la ruta PATCH /:id/estado que faltaba,
// con middlewares de autorización por rol.

import { Router } from 'express';
import {
    crearPedido,
    getPedidos,
    actualizarEstadoPedido   // ← NUEVO
} from '../controllers/pedido.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { hasRole }         from '../middlewares/checkRole.js';

const router = Router();

// Obtener todos los pedidos (con detalle)
// Acceso: todos los roles autenticados (cada uno ve lo que necesita en el frontend)
router.get(
    '/',
    authMiddleware,
    getPedidos
);

// Crear un nuevo pedido
// Acceso: cajero, mesero, administrador
router.post(
    '/',
    authMiddleware,
    hasRole('cajero', 'mesero', 'administrador'),
    crearPedido
);

// Actualizar estado de un pedido
// Acceso: todos los roles (el controlador valida qué estado puede tocar cada rol)
router.patch(
    '/:id/estado',
    authMiddleware,
    actualizarEstadoPedido
);

export default router;
