-- Aroma Café - Esquema de base de datos

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena_cifrada TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'cajero', 'mesero', 'barra', 'cocina')),
    estado VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_alta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: mesas
CREATE TABLE IF NOT EXISTS mesas (
    id_mesa SERIAL PRIMARY KEY,
    numero_mesa VARCHAR(20) UNIQUE NOT NULL,
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    ubicacion VARCHAR(10) NOT NULL CHECK (ubicacion IN ('interior', 'terraza')),
    estado VARCHAR(15) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'reservada'))
);

-- Tabla: turnos_caja (apertura de turno)
CREATE TABLE IF NOT EXISTS turnos_caja (
    id_turno SERIAL PRIMARY KEY,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_inicial NUMERIC(10,2) NOT NULL CHECK (monto_inicial >= 0),
    id_usuario_apertura INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    estado VARCHAR(10) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado'))
);

-- Tabla: cuentas (NO vinculada a turno – puede abrir y cerrar en turnos diferentes)
CREATE TABLE IF NOT EXISTS cuentas (
    id_cuenta SERIAL PRIMARY KEY,
    id_mesa INTEGER NOT NULL REFERENCES mesas(id_mesa),
    estado VARCHAR(15) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    subtotal_acumulado NUMERIC(10,2) NOT NULL DEFAULT 0,
    propina NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(15) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    pagado BOOLEAN NOT NULL DEFAULT FALSE,
    id_usuario_apertura INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_usuario_cierre INTEGER REFERENCES usuarios(id_usuario)
);

-- Tabla: pedidos (asociados a una cuenta)
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_cuenta INTEGER NOT NULL REFERENCES cuentas(id_cuenta),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en preparación', 'listo', 'entregado')),
    hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_entrega TIMESTAMP,
    monto_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('Bebidas Calientes', 'Bebidas Frías', 'Alimentos', 'Postres', 'Cafetería')),
    disponible VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (disponible IN ('activo', 'inactivo'))
);

-- Tabla: detalle_pedidos
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

-- Tabla: insumos
CREATE TABLE IF NOT EXISTS insumos (
    id_insumo SERIAL PRIMARY KEY,
    nombre_insumo VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL,
    existencia_actual NUMERIC(10,2) NOT NULL DEFAULT 0,
    nivel_minimo NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Tabla: movimientos_inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id_movimiento SERIAL PRIMARY KEY,
    id_insumo INTEGER NOT NULL REFERENCES insumos(id_insumo),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida_venta', 'merma_caducidad', 'merma_dano', 'ajuste')),
    cantidad NUMERIC(10,2) NOT NULL,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    id_pedido INTEGER REFERENCES pedidos(id_pedido)
);

-- Tabla: cierre_caja (contiene el resumen del turno)
CREATE TABLE IF NOT EXISTS cierre_caja (
    id_cierre SERIAL PRIMARY KEY,
    id_turno INTEGER UNIQUE NOT NULL REFERENCES turnos_caja(id_turno),
    fecha_cierre TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_ingresos NUMERIC(10,2) NOT NULL,
    total_egresos NUMERIC(10,2) NOT NULL,
    saldo NUMERIC(10,2) NOT NULL,
    detalle_efectivo NUMERIC(10,2),
    detalle_tarjeta NUMERIC(10,2),
    detalle_transferencia NUMERIC(10,2),
    propinas_efectivo NUMERIC(10,2),
    propinas_tarjeta NUMERIC(10,2),
    propinas_transferencia NUMERIC(10,2),
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);

-- Tabla: movimientos_financieros (ingresos/egresos ligados a un turno)
CREATE TABLE IF NOT EXISTS movimientos_financieros (
    id_movimiento_fin SERIAL PRIMARY KEY,
    id_turno INTEGER NOT NULL REFERENCES turnos_caja(id_turno),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto NUMERIC(10,2) NOT NULL,
    concepto TEXT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_pedido INTEGER REFERENCES pedidos(id_pedido),
    id_cierre INTEGER REFERENCES cierre_caja(id_cierre)
);

-- Tabla: merma_productos
CREATE TABLE IF NOT EXISTS merma_productos (
    id_merma_prod SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    motivo VARCHAR(100) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario)
);
