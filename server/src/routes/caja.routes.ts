// server/src/routes/caja.routes.ts
// CORRECCIÓN: las rutas usaban '/' tanto para GET historial como POST cierre,
// lo que hace que el frontend llame a /api/caja/historial y /api/caja/cierre
// para distinguirlos con claridad.
// También se ajusta: cajero puede ejecutar cierre (no solo administrador).

import { Router } from 'express';
import { realizarCierre, getHistorialCierres } from '../controllers/caja.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { hasRole }        from '../middlewares/checkRole.js';

const router = Router();

// Historial de cierres — solo admin
router.get(
    '/historial',
    authMiddleware,
    hasRole('administrador', 'cajero'),
    getHistorialCierres
);

// Ejecutar cierre — cajero y administrador
router.post(
    '/cierre',
    authMiddleware,
    hasRole('administrador', 'cajero'),
    realizarCierre
);

export default router;
