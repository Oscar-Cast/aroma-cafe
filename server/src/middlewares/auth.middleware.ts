import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
 
export interface AuthRequest extends Request {
    user?: any;
}
 
const JWT_SECRET = process.env.JWT_SECRET || 'aroma_cafe_secret_key';
 
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
    }
 
    const token = authHeader.split(' ')[1];
 
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};
 
