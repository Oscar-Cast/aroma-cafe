import pool from './config/database.js';
import bcrypt from 'bcrypt';

const seedTest = async () => {
  const saltRounds = 10;
  // Contraseña común para todos los usuarios de prueba (cámbiala si quieres)
  const passwordHash = await bcrypt.hash('123456', saltRounds);

  try {
    // ================== LIMPIAR TODAS LAS TABLAS Y REINICIAR SECUENCIAS ==================
    await pool.query(`
      TRUNCATE TABLE 
        merma_productos,
        movimientos_financieros,
        cierre_caja,
        movimientos_inventario,
        detalle_pedidos,
        pedidos,
        cuentas,
        turnos_caja,
        insumos,
        productos,
        mesas,
        usuarios
      RESTART IDENTITY CASCADE
    `);

    // ===================== USUARIOS (10) =====================
    await pool.query(
      `INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado) VALUES
       ('Administrador General', 'admin', $1, 'administrador', 'activo'),
       ('Laura Mesera', 'laura.m', $2, 'mesero', 'activo'),
       ('Pedro Mesero', 'pedro.m', $2, 'mesero', 'activo'),
       ('Sofía Mesera', 'sofia.m', $2, 'mesero', 'activo'),
       ('Carlos Cajero', 'carlos.c', $2, 'cajero', 'activo'),
       ('Lucía Cajera', 'lucia.c', $2, 'cajero', 'activo'),
       ('Mario Barra', 'mario.b', $2, 'barra', 'activo'),
       ('Elena Barra', 'elena.b', $2, 'barra', 'activo'),
       ('Diego Cocina', 'diego.k', $2, 'cocina', 'activo'),
       ('Ana Cocina', 'ana.k', $2, 'cocina', 'activo')`,
      [passwordHash, passwordHash]
    );

    // ===================== MESAS (25) =====================
    await pool.query(
      `INSERT INTO mesas (numero_mesa, capacidad, ubicacion, estado) VALUES
       ('Mesa 1', 4, 'interior', 'disponible'),
       ('Mesa 2', 2, 'terraza', 'disponible'),
       ('Mesa 3', 6, 'interior', 'ocupada'),
       ('Mesa 4', 4, 'interior', 'reservada'),
       ('Mesa 5', 8, 'terraza', 'inactiva'),
       ('Mesa 6', 2, 'interior', 'disponible'),
       ('Mesa 7', 4, 'terraza', 'disponible'),
       ('Mesa 8', 6, 'interior', 'ocupada'),
       ('Mesa 9', 4, 'terraza', 'disponible'),
       ('Mesa 10', 2, 'interior', 'reservada'),
       ('Mesa 11', 8, 'interior', 'disponible'),
       ('Mesa 12', 10, 'terraza', 'ocupada'),
       ('Mesa 13', 4, 'interior', 'disponible'),
       ('Mesa 14', 2, 'terraza', 'disponible'),
       ('Mesa 15', 6, 'interior', 'inactiva'),
       ('Mesa 16', 4, 'terraza', 'reservada'),
       ('Mesa 17', 8, 'interior', 'ocupada'),
       ('Mesa 18', 2, 'terraza', 'disponible'),
       ('Mesa 19', 4, 'interior', 'disponible'),
       ('Mesa 20', 6, 'terraza', 'disponible'),
       ('Mesa 21', 4, 'interior', 'ocupada'),
       ('Mesa 22', 2, 'terraza', 'reservada'),
       ('Mesa 23', 8, 'interior', 'inactiva'),
       ('Mesa 24', 6, 'terraza', 'disponible'),
       ('Mesa 25', 4, 'interior', 'disponible')`
    );

    // ===================== TURNOS DE CAJA (3) =====================
    await pool.query(
      `INSERT INTO turnos_caja (monto_inicial, id_usuario_apertura, estado) VALUES
       (800.00, 1, 'abierto'),
       (500.00, 1, 'cerrado'),
       (600.00, 1, 'cerrado')`
    );

    // ===================== PRODUCTOS (25) =====================
    await pool.query(
      `INSERT INTO productos (nombre_producto, descripcion, precio, categoria) VALUES
       ('Americano', 'Café americano 12oz', 35.00, 'Bebidas Calientes'),
       ('Latte', 'Latte clásico', 42.00, 'Bebidas Calientes'),
       ('Mocha', 'Mocha con chocolate', 48.00, 'Bebidas Calientes'),
       ('Capuchino', 'Capuchino italiano', 40.00, 'Bebidas Calientes'),
       ('Té Chai', 'Té chai latte', 38.00, 'Bebidas Calientes'),
       ('Chocolate Caliente', 'Chocolate caliente con leche', 45.00, 'Bebidas Calientes'),
       ('Limonada', 'Limonada natural 16oz', 32.00, 'Bebidas Frías'),
       ('Frappé de Caramelo', 'Frappé de caramelo', 55.00, 'Bebidas Frías'),
       ('Smoothie de Fresa', 'Smoothie de fresa y plátano', 50.00, 'Bebidas Frías'),
       ('Té Helado', 'Té helado de durazno', 30.00, 'Bebidas Frías'),
       ('Agua de Horchata', 'Agua de horchata casera', 28.00, 'Bebidas Frías'),
       ('Club Sándwich', 'Sándwich de pollo con papas', 78.00, 'Alimentos'),
       ('Chilaquiles', 'Chilaquiles con huevo', 85.00, 'Alimentos'),
       ('Hamburguesa Clásica', 'Hamburguesa de res con queso', 95.00, 'Alimentos'),
       ('Ensalada César', 'Ensalada César con pollo', 68.00, 'Alimentos'),
       ('Wrap de Vegetales', 'Wrap de vegetales asados', 72.00, 'Alimentos'),
       ('Pay de Queso', 'Pay de queso casero', 45.00, 'Postres'),
       ('Pastel de Chocolate', 'Pastel de chocolate oscuro', 55.00, 'Postres'),
       ('Flan Napolitano', 'Flan napolitano', 35.00, 'Postres'),
       ('Croissant', 'Croissant de mantequilla', 28.00, 'Cafetería'),
       ('Muffin de Arándano', 'Muffin de arándano', 32.00, 'Cafetería'),
       ('Bagel con Queso Crema', 'Bagel tostado con queso crema', 38.00, 'Cafetería'),
       ('Yogurt con Granola', 'Yogurt natural con granola y miel', 42.00, 'Alimentos'),
       ('Tostadas Francesas', 'Tostadas francesas con fruta', 62.00, 'Alimentos'),
       ('Avena con Frutos Rojos', 'Avena caliente con frutos rojos', 40.00, 'Alimentos')`
    );

    // ===================== CUENTAS (15) =====================
    // Abiertas (5) – id_cuenta 1..5
    await pool.query(
      `INSERT INTO cuentas (id_mesa, estado, subtotal_acumulado, propina, total, id_usuario_apertura) VALUES
       (3, 'abierta', 0, 0, 0, 2),
       (8, 'abierta', 0, 0, 0, 3),
       (12, 'abierta', 0, 0, 0, 4),
       (17, 'abierta', 0, 0, 0, 2),
       (21, 'abierta', 0, 0, 0, 3)`
    );

    // Cerradas turno actual (5) – id_cuenta 6..10
    await pool.query(
      `INSERT INTO cuentas (id_mesa, estado, fecha_apertura, fecha_cierre, subtotal_acumulado, propina, total, metodo_pago, pagado, id_usuario_apertura, id_usuario_cierre) VALUES
       (1, 'cerrada', '2026-05-08 09:30:00', '2026-05-08 10:15:00', 245.50, 30.00, 275.50, 'efectivo', TRUE, 2, 5),
       (2, 'cerrada', '2026-05-08 11:00:00', '2026-05-08 11:45:00', 120.00, 15.00, 135.00, 'tarjeta', TRUE, 2, 5),
       (6, 'cerrada', '2026-05-08 12:00:00', '2026-05-08 12:40:00', 350.00, 40.00, 390.00, 'tarjeta', TRUE, 3, 6),
       (9, 'cerrada', '2026-05-08 13:00:00', '2026-05-08 13:30:00', 88.00, 10.00, 98.00, 'efectivo', TRUE, 4, 5),
       (14, 'cerrada', '2026-05-08 14:00:00', '2026-05-08 14:25:00', 62.00, 8.00, 70.00, 'transferencia', TRUE, 3, 6)`
    );

    // Cerradas días anteriores (5) – id_cuenta 11..15
    await pool.query(
      `INSERT INTO cuentas (id_mesa, estado, fecha_apertura, fecha_cierre, subtotal_acumulado, propina, total, metodo_pago, pagado, id_usuario_apertura, id_usuario_cierre) VALUES
       (10, 'cerrada', '2026-05-07 08:00:00', '2026-05-07 09:00:00', 180.00, 20.00, 200.00, 'efectivo', TRUE, 2, 5),
       (11, 'cerrada', '2026-05-07 10:30:00', '2026-05-07 11:15:00', 275.00, 30.00, 305.00, 'tarjeta', TRUE, 3, 6),
       (18, 'cerrada', '2026-05-06 09:00:00', '2026-05-06 10:00:00', 400.00, 50.00, 450.00, 'efectivo', TRUE, 4, 5),
       (19, 'cerrada', '2026-05-06 12:00:00', '2026-05-06 13:00:00', 150.00, 15.00, 165.00, 'transferencia', TRUE, 2, 6),
       (22, 'cerrada', '2026-05-06 14:00:00', '2026-05-06 14:45:00', 95.00, 10.00, 105.00, 'efectivo', TRUE, 3, 5)`
    );

    // ===================== PEDIDOS Y DETALLES =====================
    // Cuenta 1 abierta (id_cuenta=1, mesa 3) – pedidos para esta cuenta abierta (antes usábamos id_cuenta 6; ahora es 1)
    // NOTA: Las cuentas abiertas tienen IDs 1..5; las cerradas actuales 6..10.
    // Ajustemos los pedidos de cuentas abiertas para que apunten a IDs 1..5.
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, monto_total, numero_pedido, id_usuario) VALUES
       (1, 'entregado', '2026-05-08 14:00:00', 125.00, 101, 2),
       (1, 'entregado', '2026-05-08 14:20:00', 70.00, 102, 2)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (1, 2, 1, 42.00, 42.00, '[{"id":"leche_almendras","nombre":"Leche de almendras","precio":8}]'),
       (1, 13, 1, 85.00, 85.00, '[{"id":"chilaquiles_verdes","nombre":"Chilaquiles verdes","precio":0},{"id":"queso_extra","nombre":"Queso extra","precio":15}]'),
       (2, 7, 1, 32.00, 32.00, '[]'),
       (2, 17, 1, 45.00, 45.00, '[]')`
    );

    // Cuenta 2 abierta (id_cuenta=2, mesa 8)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, monto_total, numero_pedido, id_usuario) VALUES
       (2, 'entregado', '2026-05-08 14:10:00', 200.00, 103, 3)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (3, 14, 2, 95.00, 190.00, '[{"id":"tocino","nombre":"Tocino extra","precio":18}]'),
       (3, 8, 1, 55.00, 55.00, '[{"id":"leche_deslactosada","nombre":"Leche deslactosada","precio":5}]')`
    );

    // Cuenta 3 abierta (id_cuenta=3, mesa 12)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, monto_total, numero_pedido, id_usuario) VALUES
       (3, 'pendiente', '2026-05-08 14:30:00', 150.00, 104, 4)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (4, 3, 2, 48.00, 96.00, '[{"id":"crema_batida","nombre":"Crema batida","precio":12}]'),
       (4, 12, 1, 78.00, 78.00, '[]')`
    );

    // Cuenta 4 abierta (id_cuenta=4, mesa 17)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, monto_total, numero_pedido, id_usuario) VALUES
       (4, 'en preparación', '2026-05-08 14:35:00', 120.00, 105, 2)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (5, 4, 2, 40.00, 80.00, '[]'),
       (5, 20, 1, 28.00, 28.00, '[]'),
       (5, 10, 1, 30.00, 30.00, '[]')`
    );

    // Cuenta 5 abierta (id_cuenta=5, mesa 21)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, monto_total, numero_pedido, id_usuario) VALUES
       (5, 'entregado', '2026-05-08 14:40:00', 90.00, 106, 3)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (6, 5, 1, 38.00, 38.00, '[{"id":"canela_extra","nombre":"Canela extra","precio":0}]'),
       (6, 19, 1, 35.00, 35.00, '[]'),
       (6, 11, 1, 28.00, 28.00, '[]')`
    );

    // Cuentas cerradas turno actual (IDs 6..10)
    // Cuenta 6 (mesa 1)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario) VALUES
       (6, 'entregado', '2026-05-08 09:35:00', '2026-05-08 10:00:00', 245.50, 200, 2)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (7, 1, 2, 35.00, 70.00, '[{"id":"shot_extra","nombre":"Shot extra de espresso","precio":10}]'),
       (7, 3, 1, 48.00, 48.00, '[{"id":"crema_batida","nombre":"Crema batida","precio":12}]'),
       (7, 12, 1, 78.00, 78.00, '[]'),
       (7, 6, 1, 45.00, 45.00, '[]')`
    );

    // Cuenta 7 (mesa 2)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario) VALUES
       (7, 'entregado', '2026-05-08 11:05:00', '2026-05-08 11:30:00', 120.00, 201, 2)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (8, 8, 1, 55.00, 55.00, '[{"id":"leche_deslactosada","nombre":"Leche deslactosada","precio":5}]'),
       (8, 20, 2, 28.00, 56.00, '[]'),
       (8, 7, 1, 32.00, 32.00, '[]')`
    );

    // Cuenta 8 (mesa 6)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario) VALUES
       (8, 'entregado', '2026-05-08 12:05:00', '2026-05-08 12:35:00', 350.00, 202, 3)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (9, 13, 2, 85.00, 170.00, '[{"id":"guacamole","nombre":"Guacamole","precio":12}]'),
       (9, 14, 1, 95.00, 95.00, '[{"id":"tocino","nombre":"Tocino extra","precio":18}]'),
       (9, 9, 1, 50.00, 50.00, '[]'),
       (9, 10, 1, 30.00, 30.00, '[]')`
    );

    // Cuenta 9 (mesa 9)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario) VALUES
       (9, 'entregado', '2026-05-08 13:05:00', '2026-05-08 13:25:00', 88.00, 203, 4)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (10, 17, 1, 45.00, 45.00, '[]'),
       (10, 21, 1, 32.00, 32.00, '[]'),
       (10, 11, 1, 28.00, 28.00, '[]')`
    );

    // Cuenta 10 (mesa 14)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario) VALUES
       (10, 'entregado', '2026-05-08 14:03:00', '2026-05-08 14:20:00', 62.00, 204, 3)`
    );
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (11, 2, 1, 42.00, 42.00, '[{"id":"leche_soya","nombre":"Leche de soya","precio":6}]'),
       (11, 20, 1, 28.00, 28.00, '[]')`
    );

    // Pedidos históricos para cuentas de días anteriores (IDs 11..15)
    await pool.query(
      `INSERT INTO pedidos (id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario) VALUES
       (11, 'entregado', '2026-05-07 08:10:00', '2026-05-07 08:50:00', 180.00, 300, 2),
       (12, 'entregado', '2026-05-07 10:40:00', '2026-05-07 11:10:00', 275.00, 301, 3),
       (13, 'entregado', '2026-05-06 09:10:00', '2026-05-06 09:55:00', 400.00, 400, 4),
       (14, 'entregado', '2026-05-06 12:10:00', '2026-05-06 12:50:00', 150.00, 401, 2),
       (15, 'entregado', '2026-05-06 14:05:00', '2026-05-06 14:40:00', 95.00, 402, 3)`
    );

    // Detalles de esos pedidos históricos (id_pedido 12..16)
    await pool.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (12, 4, 2, 40.00, 80.00, '[]'),
       (12, 12, 1, 78.00, 78.00, '[]'),
       (12, 18, 1, 55.00, 55.00, '[]'),
       (13, 13, 2, 85.00, 170.00, '[{"id":"chilaquiles_rojos","nombre":"Chilaquiles rojos","precio":0},{"id":"crema","nombre":"Crema","precio":5}]'),
       (13, 8, 1, 55.00, 55.00, '[]'),
       (13, 21, 1, 32.00, 32.00, '[]'),
       (13, 11, 1, 28.00, 28.00, '[]'),
       (14, 14, 2, 95.00, 190.00, '[{"id":"tocino","nombre":"Tocino extra","precio":18}]'),
       (14, 16, 2, 72.00, 144.00, '[]'),
       (14, 7, 2, 32.00, 64.00, '[]'),
       (15, 5, 2, 38.00, 76.00, '[{"id":"shot_extra","nombre":"Shot extra de espresso","precio":10}]'),
       (15, 20, 2, 28.00, 56.00, '[]'),
       (15, 10, 1, 30.00, 30.00, '[]'),
       (16, 1, 1, 35.00, 35.00, '[]'),
       (16, 6, 1, 45.00, 45.00, '[{"id":"crema_batida","nombre":"Crema batida","precio":12}]'),
       (16, 19, 1, 35.00, 35.00, '[]')`
    );

    // ===================== INSUMOS =====================
    await pool.query(
      `INSERT INTO insumos (nombre_insumo, unidad_medida, existencia_actual, nivel_minimo) VALUES
       ('Café en grano', 'kg', 25.0, 5.0),
       ('Leche entera', 'litros', 40.0, 10.0),
       ('Leche de almendras', 'litros', 12.0, 3.0),
       ('Chocolate en polvo', 'kg', 8.0, 2.0),
       ('Harina de trigo', 'kg', 30.0, 5.0),
       ('Huevo', 'piezas', 120.0, 30.0),
       ('Queso mozzarella', 'kg', 10.0, 2.0),
       ('Tomate', 'kg', 15.0, 3.0),
       ('Pechuga de pollo', 'kg', 20.0, 5.0),
       ('Azúcar', 'kg', 25.0, 5.0)`
    );

    // ===================== MOVIMIENTOS DE INVENTARIO =====================
    await pool.query(
      `INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario) VALUES
       (1, 'entrada', 30.0, '2026-05-06 08:00:00', 1),
       (2, 'entrada', 50.0, '2026-05-06 08:00:00', 1),
       (3, 'entrada', 15.0, '2026-05-06 08:00:00', 1)`
    );

    await pool.query(
      `INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario, id_pedido) VALUES
       (1, 'salida_venta', 0.2, '2026-05-08 09:35:00', 2, 7),
       (2, 'salida_venta', 1.0, '2026-05-08 09:35:00', 2, 7),
       (1, 'salida_venta', 0.3, '2026-05-08 11:05:00', 2, 8),
       (5, 'salida_venta', 1.5, '2026-05-08 14:00:00', 2, 1),
       (6, 'salida_venta', 2.0, '2026-05-08 14:00:00', 2, 1)`
    );

    await pool.query(
      `INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario) VALUES
       (4, 'merma_caducidad', 0.5, '2026-05-07 18:00:00', 1),
       (8, 'merma_dano', 2.0, '2026-05-07 18:00:00', 1)`
    );

    // ===================== CIERRES DE CAJA =====================
    await pool.query(
      `INSERT INTO cierre_caja (id_turno, fecha_cierre, total_ingresos, total_egresos, saldo,
                                detalle_efectivo, detalle_tarjeta, detalle_transferencia,
                                propinas_efectivo, propinas_tarjeta, propinas_transferencia,
                                efectivo_contado, diferencia, id_usuario) VALUES
       (2, '2026-05-07 20:00:00', 505.00, 0, 505.00,
        200.00, 305.00, 0.00,
        20.00, 30.00, 0.00,
        505.00, 0, 1),
       (3, '2026-05-06 20:00:00', 615.00, 0, 615.00,
        555.00, 0.00, 60.00,
        50.00, 0.00, 15.00,
        615.00, 0, 1)`
    );

    // ===================== MOVIMIENTOS FINANCIEROS =====================
    await pool.query(
      `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto, fecha_hora, id_pedido) VALUES
       (1, 'ingreso', 275.50, 'Pago cuenta Mesa 1', '2026-05-08 10:15:00', 7),
       (1, 'ingreso', 135.00, 'Pago cuenta Mesa 2', '2026-05-08 11:45:00', 8),
       (1, 'ingreso', 390.00, 'Pago cuenta Mesa 6', '2026-05-08 12:40:00', 9),
       (1, 'ingreso', 98.00, 'Pago cuenta Mesa 9', '2026-05-08 13:30:00', 10),
       (1, 'ingreso', 70.00, 'Pago cuenta Mesa 14', '2026-05-08 14:25:00', 11)`
    );

    await pool.query(
      `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto, fecha_hora) VALUES
       (1, 'egreso', 50.00, 'Compra de hielo para barra', '2026-05-08 13:00:00')`
    );

    await pool.query(
      `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto, fecha_hora, id_pedido, id_cierre) VALUES
       (2, 'ingreso', 200.00, 'Pago cuenta Mesa 10', '2026-05-07 09:00:00', 12, 1),
       (2, 'ingreso', 305.00, 'Pago cuenta Mesa 11', '2026-05-07 11:15:00', 13, 1),
       (3, 'ingreso', 450.00, 'Pago cuenta Mesa 18', '2026-05-06 10:00:00', 14, 2),
       (3, 'ingreso', 165.00, 'Pago cuenta Mesa 19', '2026-05-06 13:00:00', 15, 2),
       (3, 'ingreso', 105.00, 'Pago cuenta Mesa 22', '2026-05-06 14:45:00', 16, 2)`
    );

    // ===================== MERMA DE PRODUCTOS =====================
    await pool.query(
      `INSERT INTO merma_productos (id_producto, cantidad, motivo, fecha_hora, id_usuario) VALUES
       (20, 2, 'Croissant quemado', '2026-05-08 10:00:00', 9),
       (17, 1, 'Pay de queso caducado', '2026-05-07 19:00:00', 1)`
    );

    console.log('✅ Datos de prueba insertados correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al insertar datos de prueba:', error);
    process.exit(1);
  }
};

seedTest();
