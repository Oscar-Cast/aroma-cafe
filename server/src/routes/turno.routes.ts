import { Router } from 'express';
import { getTurnoActivo, abrirTurno, cerrarTurno, getHistorialCierres } from '../controllers/turno.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { hasRole } from '../middlewares/checkRole.js';

const router = Router();

router.get('/activo', authMiddleware, getTurnoActivo);
router.post('/abrir', authMiddleware, hasRole('administrador', 'cajero'), abrirTurno);
router.post('/cerrar', authMiddleware, hasRole('administrador', 'cajero'), cerrarTurno);
router.get('/historial', authMiddleware, hasRole('administrador', 'cajero'), getHistorialCierres);

export default router;
