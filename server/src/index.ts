// server/src/index.ts
// CORRECCIONES:
//   1. Se registran las nuevas rutas de usuarios (/api/usuarios).
//   2. Se registran las rutas de movimientos financieros (/api/movimientos).
//   3. Las rutas de caja usan los nuevos paths /historial y /cierre.
//   4. Se agrega SPA fallback para que el frontend cargue correctamente
//      si se accede directamente a cualquier sub-ruta.

import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import path      from 'path';
import { fileURLToPath } from 'url';

import pool from './config/database.js';

// Rutas
import { login } from './controllers/authController.js';
import productoRoutes       from './routes/producto.routes.js';
import insumoRoutes         from './routes/insumo.routes.js';
import movimientoRoutes     from './routes/movimiento.routes.js';          // inventario
import movFinancieroRoutes  from './routes/movimientoFinanciero.routes.js'; // financieros ← NUEVO
import pedidoRoutes         from './routes/pedido.routes.js';
import cajaRoutes           from './routes/caja.routes.js';
import mermaRoutes          from './routes/merma.routes.js';
import reporteRoutes        from './routes/reporte.routes.js';
import usuarioRoutes        from './routes/usuario.routes.js';             // ← NUEVO
import mesaRoutes from './routes/mesa.routes.js';
import cuentaRoutes from './routes/cuenta.routes.js';
import mesaRoutes from './routes/mesa.routes.js';
import turnoRoutes from './routes/turno.routes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas API ─────────────────────────────────────────────────────────

// Auth
app.post('/api/auth/login', login);

// Recursos principales
app.use('/api/productos',    productoRoutes);
app.use('/api/insumos',      insumoRoutes);
app.use('/api/pedidos',      pedidoRoutes);
app.use('/api/usuarios',     usuarioRoutes);          // ← NUEVO
app.use('/api/caja',         cajaRoutes);
app.use('/api/mermas',       mermaRoutes);
app.use('/api/reportes',     reporteRoutes);

// Movimientos (separados por tipo)
app.use('/api/movimientos-inventario', movimientoRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/cuentas', cuentaRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('api/turnos', turnoRoutes);
app.use('/api/movimientos-financieros', movFinancieroRoutes);

// ── Health check ──────────────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
    try {
        const dbStatus = await pool.query('SELECT NOW()');
        res.json({
            status:     'Servidor operativo',
            database:   'Conectada',
            serverTime: dbStatus.rows[0].now,
        });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: 'Fallo de conexión a DB' });
    }
});

// ── Archivos estáticos (frontend) ─────────────────────────────────────
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// SPA fallback: cualquier ruta no-API devuelve index.html
app.use((req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicDir, 'index.html'));
    }
});

// ── Arranque ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Aroma a Café — Backend activo`);
});
