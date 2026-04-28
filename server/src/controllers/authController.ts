import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const login = async (req: Request, res: Response) => {
    try {
        const { nombre_usuario, contrasena } = req.body;
        // Llama a loginService (asegúrate que en el servicio se llame igual)
        const data = await authService.loginService(nombre_usuario, contrasena);
        res.json(data);
    } catch (error: any) { 
        // Este es el bloque que le falta a tu código actual
        res.status(401).json({ error: error.message });
    } 
};

