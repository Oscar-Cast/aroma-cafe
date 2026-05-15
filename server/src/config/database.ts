import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carga las variables del .env
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, 
  database: process.env.DB_NAME,
  password: process.env.DB_BACKEND_PASS, 
  port: parseInt(process.env.DB_PORT),
});

// Verificación inicial de conexión
pool.on('connect', () => {
  console.log('Conexión establecida con la base de datos aroma_cafe');
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en el pool de conexiones', err);
  process.exit(-1);
});

export default pool;
