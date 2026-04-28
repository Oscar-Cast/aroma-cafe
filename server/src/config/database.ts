import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carga las variables del .env
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db', 
  database: process.env.DB_NAME || 'aroma_cafe',
  password: process.env.DB_PASSWORD || 'cosadelacosa',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Verificación inicial de conexión
pool.on('connect', () => {
  console.log('Conexión establecida con la base de datos aroma_cafe');
});

export default pool;
