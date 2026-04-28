import { Router } from 'express';
import { registrarMerma, getHistorialMermas } from '../controllers/merma.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Ver historial y registrar mermas requiere autenticación
router.get('/', authMiddleware, getHistorialMermas);
router.post('/', authMiddleware, registrarMerma);

export default router;
