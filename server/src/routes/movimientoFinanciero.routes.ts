import { Router } from 'express';
import { registrarMovimientoFinanciero, getHistorialMovimientosFinancieros } from '../controllers/movimientoFinanciero.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { hasRole } from '../middlewares/checkRole.js';

const router = Router();

router.get('/', authMiddleware, hasRole('administrador', 'cajero'), getHistorialMovimientosFinancieros);
router.post('/', authMiddleware, hasRole('administrador', 'cajero'), registrarMovimientoFinanciero);

export default router;
