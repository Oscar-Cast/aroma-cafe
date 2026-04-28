-- init.sql para Aroma Café
-- PostgreSQL 15+

-- =============================================
-- Tabla: usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena_cifrada TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'cajero', 'mesero', 'barra', 'cocina')),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_alta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Tabla: productos
-- =============================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('Bebidas Calientes', 'Bebidas Frías', 'Alimentos', 'Postres', 'Cafetería')),
    disponible VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (disponible IN ('activo', 'inactivo'))
);

-- =============================================
-- Tabla: pedidos
-- =============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    mesa VARCHAR(20),                    -- puede ser nulo si el backend aún no gestiona mesas
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en preparación', 'listo', 'entregado')),
    hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_entrega TIMESTAMP,
    monto_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);

-- =============================================
-- Tabla: detalle_pedidos
-- =============================================
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

-- =============================================
-- Tabla: insumos
-- =============================================
CREATE TABLE IF NOT EXISTS insumos (
    id_insumo SERIAL PRIMARY KEY,
    nombre_insumo VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL,
    existencia_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
    nivel_minimo NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- =============================================
-- Tabla: movimientos_inventario
-- =============================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento SERIAL PRIMARY KEY,
    id_insumo INTEGER NOT NULL REFERENCES insumos(id_insumo),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida_venta', 'merma_caducidad', 'merma_dano', 'ajuste')),
    cantidad NUMERIC(10,2) NOT NULL,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_pedido INTEGER REFERENCES pedidos(id_pedido)  -- opcional, solo para salidas por venta
);

-- =============================================
-- Tabla: cierre_caja
-- =============================================
CREATE TABLE IF NOT EXISTS cierre_caja (
    id_cierre SERIAL PRIMARY KEY,
    fecha_cierre TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_ingresos NUMERIC(10,2) NOT NULL,
    total_egresos NUMERIC(10,2) NOT NULL,
    saldo NUMERIC(10,2) NOT NULL,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);

-- =============================================
-- Tabla: movimientos_financieros
-- =============================================
CREATE TABLE IF NOT EXISTS movimientos_financieros (
    id_movimiento_fin SERIAL PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto NUMERIC(10,2) NOT NULL,
    concepto TEXT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_pedido INTEGER REFERENCES pedidos(id_pedido),
    id_cierre INTEGER REFERENCES cierre_caja(id_cierre)
);

-- =============================================
-- Tabla: merma_productos
-- =============================================
CREATE TABLE IF NOT EXISTS merma_productos (
    id_merma_prod SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    motivo VARCHAR(100) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);

-- =============================================
-- Tabla: mesas (para gestión de espacios)
-- (Aún no integrada con el backend, pero se incluye para futura implementación)
-- =============================================
CREATE TABLE IF NOT EXISTS mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero_mesa VARCHAR(20) UNIQUE NOT NULL,
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    ubicacion VARCHAR(10) NOT NULL CHECK (ubicacion IN ('interior', 'terraza')),
    estado VARCHAR(15) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'reservada'))
);

-- =============================================
-- Tabla: cuentas (registro de cobros)
-- (Aún no integrada con el backend)
-- =============================================
CREATE TABLE IF NOT EXISTS cuentas (
    id_cuenta SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido),
    mesa VARCHAR(20),                     -- La mesa al momento del cobro (puede ser la del pedido o no)
    subtotal NUMERIC(10,2) NOT NULL,
    propina NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    metodo_pago VARCHAR(15) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    pagado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_cierre TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_cajero INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);

-- Usuario de prueba para Aroma Café
INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado)
VALUES (
    'Administrador de Sistema', 
    'admin', 
    '$2b$10$u9ckJVcDe4xSYSj23y1oPeUKUT00XhBBQHQi70N9Uo81vdclCtp0.', -- Hash de 'admin123'
    'administrador', 
    'activo'
);

-- Productos de ejemplo con categorías correctas
INSERT INTO productos (nombre_producto, descripcion, precio, categoria, disponible) VALUES
('Espresso',        'Café intenso de 30ml',                    35.00, 'Bebidas Calientes', 'activo'),
('Americano',       'Espresso con agua caliente',              40.00, 'Bebidas Calientes', 'activo'),
('Cappuccino',      'Espresso con leche espumada',             55.00, 'Bebidas Calientes', 'activo'),
('Flat White',      'Doble shot con leche microespumada',      55.00, 'Bebidas Calientes', 'activo'),
('Latte',           'Espresso con leche vaporizada',           55.00, 'Bebidas Calientes', 'activo'),
('Frappé Café',     'Café frío licuado con leche y hielo',     65.00, 'Bebidas Frías',     'activo'),
('Cold Brew',       'Café en frío 12 horas de extracción',     70.00, 'Bebidas Frías',     'activo'),
('Limonada Fría',   'Limonada natural con hielo',              45.00, 'Bebidas Frías',     'activo'),
('Croissant',       'Croissant de mantequilla recién horneado',45.00, 'Alimentos',         'activo'),
('Tostada Francesa','Pan brioche con canela y maple',          65.00, 'Alimentos',         'activo'),
('Sandwich Club',   'Pollo, tocino, lechuga y tomate',         85.00, 'Alimentos',         'activo'),
('Pay de Queso',    'Rebanada de pay de queso con frutos rojos',55.00,'Alimentos',         'activo')
ON CONFLICT DO NOTHING;
 
