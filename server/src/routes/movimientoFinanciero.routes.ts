// server/src/routes/movimientoFinanciero.routes.ts
// Rutas para movimientos_financieros (ingresos/egresos manuales).
// Separado de movimiento.routes.ts que maneja movimientos de inventario.

import { Router } from 'express';
import {
    registrarMovimientoFinanciero,
    getHistorialMovimientosFinancieros,
} from '../controllers/movimientoFinanciero.controller.js';
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
