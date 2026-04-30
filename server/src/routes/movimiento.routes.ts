import { Router } from 'express';
import { registrarMovimiento, getHistorialMovimientos } from '../controllers/movimiento.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Registrar un movimiento de inventario (entrada / salida / merma)
router.post('/', authMiddleware, registrarMovimiento);

// Obtener historial de movimientos de inventario
router.get('/', authMiddleware, getHistorialMovimientos);

export default router;
