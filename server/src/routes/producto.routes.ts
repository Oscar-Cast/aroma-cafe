import { Router } from 'express';
import { 
    getProductos, 
    createProducto, 
    updateProducto,
    deleteProducto  
} from '../controllers/producto.controller';

import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getProductos); // Público: para que vean el menú
router.post('/', authMiddleware, createProducto); // Protegido
router.put('/:id', authMiddleware, updateProducto); // Protegido
router.delete('/:id', authMiddleware, deleteProducto); // Protegido

export default router;
