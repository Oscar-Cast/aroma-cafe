import pool from './config/database.js';
import bcrypt from 'bcrypt';

const seed = async () => {
    const saltRounds = 10;
    const hash = await bcrypt.hash('admin123', saltRounds); // Contraseña temporal

    try {
        await pool.query(
            `INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado) 
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (nombre_usuario) DO NOTHING`,
            ['Administrador Aroma', 'admin', hash, 'administrador', 'activo']
        );
        console.log('✅ Usuario administrador creado con éxito');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al crear usuario: revisa tu server/src/config/database.ts', err);
        process.exit(1);
    }
};

seed();
