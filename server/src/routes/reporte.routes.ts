import { Router } from 'express';
import { getVentasPorPeriodo, getResumenDashboard } from '../controllers/reporte.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/checkRole.js';

const router = Router();

// Reporte detallado con período seleccionable
router.get('/resumen', authMiddleware, isAdmin, getVentasPorPeriodo);

// Resumen rápido para el dashboard (últimos 7 días)
router.get('/dashboard', authMiddleware, isAdmin, getResumenDashboard);

export default router;
