import { Router } from 'express';
import { getResumenVentas, getReporteMensual } from '../controllers/reporte.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/checkRole.js';

const router = Router();

// Acceso restringido exclusivamente a administradores
router.get('/resumen', authMiddleware, isAdmin, getResumenVentas);
router.get('/mensual', authMiddleware, isAdmin, getReporteMensual);

export default router;
