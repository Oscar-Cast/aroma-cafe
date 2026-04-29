import { Router } from 'express';
import { getMesas, createMesa, updateMesa, deleteMesa } from '../controllers/mesa.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/checkRole.js';

const router = Router();

router.get('/', authMiddleware, getMesas);
router.post('/', authMiddleware, isAdmin, createMesa);
router.put('/:id', authMiddleware, isAdmin, updateMesa);
router.delete('/:id', authMiddleware, isAdmin, deleteMesa);

export default router;
