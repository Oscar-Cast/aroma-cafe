import pool   from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
 
const JWT_SECRET = process.env.JWT_SECRET || 'aroma_cafe_secret_key';
 
export const loginService = async (nombre_usuario: string, contrasena: string) => {
 
    // 1. Buscar el usuario en la base de datos
    const result = await pool.query(
        'SELECT * FROM usuarios WHERE nombre_usuario = $1',
        [nombre_usuario]
    );
    const usuario = result.rows[0];
 
    if (!usuario) {
        throw new Error('Usuario o contraseña incorrectos');
        // Nota: el mensaje genérico evita revelar si el usuario existe o no
    }
 
    // NUEVO: verificar que el usuario esté activo
    if (usuario.estado !== 'activo') {
        throw new Error('La cuenta está inactiva. Contacta al administrador.');
    }
 
    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(contrasena, usuario.contrasena_cifrada);
    if (!validPassword) {
        throw new Error('Usuario o contraseña incorrectos');
    }
 
    // 3. Generar JWT — el payload incluye id_usuario y rol para los middlewares
    const token = jwt.sign(
        {
            id_usuario: usuario.id_usuario,   // usado por los controllers para req.user.id_usuario
            id:         usuario.id_usuario,   // alias de compatibilidad
            rol:        usuario.rol,
            nombre:     usuario.nombre_usuario,
        },
        JWT_SECRET,
        { expiresIn: '9h' }
    );
 
    return {
        token,
        user: {
            id:     usuario.id_usuario,
            nombre: usuario.nombre_usuario,
            rol:    usuario.rol,
        },
    };
};
