// server/src/routes/movimiento.routes.ts
// CORRECCIÓN: el frontend llama a /api/movimientos para movimientos FINANCIEROS
// (ingresos/egresos), pero el controlador existente maneja movimientos de
// INVENTARIO (insumos). Se separan en dos archivos de rutas distintos.
// Este archivo corresponde a movimientos_financieros.

import { Router } from 'express';
import { registrarMovimientoFinanciero, getHistorialMovimientosFinancieros }
    from '../controllers/movimientoFinanciero.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { hasRole }        from '../middlewares/checkRole.js';

const router = Router();

router.get(
    '/',
    authMiddleware,
    hasRole('administrador', 'cajero'),
    getHistorialMovimientosFinancieros
);

router.post(
    '/',
    authMiddleware,
    hasRole('administrador', 'cajero'),
    registrarMovimientoFinanciero
);

export default router;
