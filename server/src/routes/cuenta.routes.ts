import { Router } from 'express';
import { getCuentas, getCuentasAbiertas, cerrarCuenta } from '../controllers/cuenta.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { hasRole } from '../middlewares/checkRole.js';

const router = Router();

router.get('/', authMiddleware, hasRole('administrador', 'cajero'), getCuentas);
router.get('/abiertas', authMiddleware, hasRole('administrador', 'cajero'), getCuentasAbiertas);
router.patch('/:id/cerrar', authMiddleware, hasRole('administrador', 'cajero'), cerrarCuenta);

export default router;
