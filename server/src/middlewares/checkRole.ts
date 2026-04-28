// server/src/middlewares/checkRole.ts

import { Request, Response, NextFunction } from 'express';

// Uso: router.get('/ruta', authMiddleware, hasRole('administrador', 'cajero'), handler)
export const hasRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (user && roles.includes(user.rol)) {
            next();
        } else {
            res.status(403).json({
                message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}.`
            });
        }
    };
};

// ── Helpers por rol (mantienen compatibilidad con el código existente) ──

export const isAdmin = hasRole('administrador');

export const isCajero = hasRole('cajero', 'administrador');

export const isMesero = hasRole('mesero', 'administrador');

// Barra y cocina comparten la vista de producción pero con filtros distintos
export const isProduccion = hasRole('barra', 'cocina', 'administrador');

// Cualquier usuario de piso (cajero o mesero) puede cambiar estado a entregado
export const isPiso = hasRole('cajero', 'mesero', 'administrador');

// Puede registrar o consultar pedidos
export const isPedidos = hasRole('cajero', 'mesero', 'administrador');
