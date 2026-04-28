import { Router } from 'express';
import { getInsumos, createInsumo, updateInsumo } from '../controllers/insumo.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getInsumos);
router.post('/', authMiddleware, createInsumo);
router.put('/:id', authMiddleware, updateInsumo);

export default router;
