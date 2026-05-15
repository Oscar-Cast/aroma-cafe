import pool from './config/database.js';
import bcrypt from 'bcrypt';

const seedTest = async () => {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('123456', saltRounds);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ===================== USUARIOS (10) =====================
    await client.query(
      `INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado) VALUES
       ('Administrador General', 'admin', $1, 'administrador', 'activo'),
       ('Laura Mesera', 'laura.m', $1, 'mesero', 'activo'),
       ('Pedro Mesero', 'pedro.m', $1, 'mesero', 'activo'),
       ('Sofía Mesera', 'sofia.m', $1, 'mesero', 'activo'),
       ('Carlos Cajero', 'carlos.c', $1, 'cajero', 'activo'),
       ('Lucía Cajera', 'lucia.c', $1, 'cajero', 'activo'),
       ('Mario Barra', 'mario.b', $1, 'barra', 'activo'),
       ('Elena Barra', 'elena.b', $1, 'barra', 'activo'),
       ('Diego Cocina', 'diego.k', $1, 'cocina', 'activo'),
       ('Ana Cocina', 'ana.k', $1, 'cocina', 'activo')`,
      [passwordHash]
    );

    // ===================== MESAS (25) =====================
    await client.query(
      `INSERT INTO mesas (numero_mesa, capacidad, ubicacion, estado) VALUES
       ('Mesa 1', 4, 'interior', 'disponible'), ('Mesa 2', 2, 'terraza', 'disponible'),
       ('Mesa 3', 6, 'interior', 'ocupada'), ('Mesa 4', 4, 'interior', 'reservada'),
       ('Mesa 5', 8, 'terraza', 'inactiva'), ('Mesa 6', 2, 'interior', 'disponible'),
       ('Mesa 7', 4, 'terraza', 'disponible'), ('Mesa 8', 6, 'interior', 'ocupada'),
       ('Mesa 9', 4, 'terraza', 'disponible'), ('Mesa 10', 2, 'interior', 'reservada'),
       ('Mesa 11', 8, 'interior', 'disponible'), ('Mesa 12', 10, 'terraza', 'ocupada'),
       ('Mesa 13', 4, 'interior', 'disponible'), ('Mesa 14', 2, 'terraza', 'disponible'),
       ('Mesa 15', 6, 'interior', 'inactiva'), ('Mesa 16', 4, 'terraza', 'reservada'),
       ('Mesa 17', 8, 'interior', 'ocupada'), ('Mesa 18', 2, 'terraza', 'disponible'),
       ('Mesa 19', 4, 'interior', 'disponible'), ('Mesa 20', 6, 'terraza', 'disponible'),
       ('Mesa 21', 4, 'interior', 'ocupada'), ('Mesa 22', 2, 'terraza', 'reservada'),
       ('Mesa 23', 8, 'interior', 'inactiva'), ('Mesa 24', 6, 'terraza', 'disponible'),
       ('Mesa 25', 4, 'interior', 'disponible')`
    );

    // ===================== PRODUCTOS (25) =====================
    await client.query(
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

    // ===================== TURNOS DE CAJA (3) =====================
    await client.query(
      `INSERT INTO turnos_caja (monto_inicial, id_usuario_apertura, estado) VALUES
       (800.00, 1, 'abierto'), (500.00, 1, 'cerrado'), (600.00, 1, 'cerrado')`
    );

    // ===================== CUENTAS (15) =====================
    // Abiertas (1-5), Cerradas Turno Actual (6-10), Cerradas Históricas (11-15)
    await client.query(
      `INSERT INTO cuentas (id_mesa, estado, subtotal_acumulado, propina, total, id_usuario_apertura) VALUES
       (3, 'abierta', 227.00, 0, 227.00, 2),
       (8, 'abierta', 286.00, 0, 286.00, 3),
       (12, 'abierta', 174.00, 0, 174.00, 4),
       (17, 'abierta', 138.00, 0, 138.00, 2),
       (21, 'abierta', 101.00, 0, 101.00, 3)`
    );

    await client.query(
      `INSERT INTO cuentas (id_mesa, estado, fecha_apertura, fecha_cierre, subtotal_acumulado, propina, total, metodo_pago, pagado, id_usuario_apertura, id_usuario_cierre) VALUES
       (1, 'cerrada', '2026-05-08 09:30:00', '2026-05-08 10:15:00', 273.00, 30.00, 303.00, 'efectivo', TRUE, 2, 5),
       (2, 'cerrada', '2026-05-08 11:00:00', '2026-05-08 11:45:00', 148.00, 15.00, 163.00, 'tarjeta', TRUE, 2, 5),
       (6, 'cerrada', '2026-05-08 12:00:00', '2026-05-08 12:40:00', 357.00, 40.00, 397.00, 'tarjeta', TRUE, 3, 6),
       (9, 'cerrada', '2026-05-08 13:00:00', '2026-05-08 13:30:00', 105.00, 10.00, 115.00, 'efectivo', TRUE, 4, 5),
       (14, 'cerrada', '2026-05-08 14:00:00', '2026-05-08 14:25:00', 76.00, 8.00, 84.00, 'transferencia', TRUE, 3, 6),
       (10, 'cerrada', '2026-05-07 08:00:00', '2026-05-07 09:00:00', 213.00, 20.00, 233.00, 'efectivo', TRUE, 2, 5),
       (11, 'cerrada', '2026-05-07 10:30:00', '2026-05-07 11:15:00', 290.00, 30.00, 320.00, 'tarjeta', TRUE, 3, 6),
       (18, 'cerrada', '2026-05-06 09:00:00', '2026-05-06 10:00:00', 434.00, 50.00, 484.00, 'efectivo', TRUE, 4, 5),
       (19, 'cerrada', '2026-05-06 12:00:00', '2026-05-06 13:00:00', 172.00, 15.00, 187.00, 'transferencia', TRUE, 2, 6),
       (22, 'cerrada', '2026-05-06 14:00:00', '2026-05-06 14:45:00', 127.00, 10.00, 137.00, 'efectivo', TRUE, 3, 5)`
    );

    // ===================== PEDIDOS Y DETALLES =====================
    // Pedidos de Cuentas Abiertas (1-5)
    await client.query(
      `INSERT INTO pedidos (id_cuenta, estado, monto_total, numero_pedido, id_usuario) VALUES
       (1, 'entregado', 150.00, 101, 2), -- Latte + Chilaquiles
       (1, 'entregado', 77.00, 102, 2),  -- Limonada + Pay
       (2, 'entregado', 286.00, 103, 3), -- 2 Hamburguesas c/tocino + Frappé
       (3, 'pendiente', 174.00, 104, 4), -- 2 Mocha c/crema + Club Sandwich
       (4, 'en preparación', 138.00, 105, 2), -- 2 Capuchino + Croissant + Té Helado
       (5, 'entregado', 101.00, 106, 3)  -- Té Chai + Flan + Horchata`
    );

    await client.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (1, 2, 1, 42.00, 50.00, '["leche_almendras"]'),
       (1, 13, 1, 85.00, 100.00, '["chilaquiles_verdes", "queso_extra"]'),
       (2, 7, 1, 32.00, 32.00, '[]'),
       (2, 17, 1, 45.00, 45.00, '[]'),
       (3, 14, 2, 95.00, 226.00, '["tocino"]'),
       (3, 8, 1, 55.00, 60.00, '["leche_deslactosada"]'),
       (4, 3, 2, 48.00, 120.00, '["crema_batida"]'),
       (4, 12, 1, 78.00, 78.00, '[]'),
       (5, 4, 2, 40.00, 80.00, '[]'),
       (5, 20, 1, 28.00, 28.00, '[]'),
       (5, 10, 1, 30.00, 30.00, '[]'),
       (6, 5, 1, 38.00, 38.00, '["canela_extra"]'),
       (6, 19, 1, 35.00, 35.00, '[]'),
       (6, 11, 1, 28.00, 28.00, '[]')`
    );

    // Pedidos de Cuentas Cerradas Actuales (6-10)
    await client.query(
      `INSERT INTO pedidos (id_cuenta, estado, monto_total, numero_pedido, id_usuario) VALUES
       (6, 'entregado', 273.00, 200, 2),
       (7, 'entregado', 148.00, 201, 2),
       (8, 'entregado', 357.00, 202, 3),
       (9, 'entregado', 105.00, 203, 4),
       (10, 'entregado', 76.00, 204, 3)`
    );

    await client.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (7, 1, 2, 35.00, 90.00, '["shot_extra"]'),
       (7, 3, 1, 48.00, 60.00, '["crema_batida"]'),
       (7, 12, 1, 78.00, 78.00, '[]'),
       (7, 6, 1, 45.00, 45.00, '[]'),
       (8, 8, 1, 55.00, 60.00, '["leche_deslactosada"]'),
       (8, 20, 2, 28.00, 56.00, '[]'),
       (8, 7, 1, 32.00, 32.00, '[]'),
       (9, 13, 2, 85.00, 182.00, '["guacamole"]'),
       (9, 14, 1, 95.00, 113.00, '["tocino"]'),
       (9, 9, 1, 50.00, 50.00, '[]'),
       (10, 17, 1, 45.00, 45.00, '[]'),
       (10, 21, 1, 32.00, 32.00, '[]'),
       (10, 11, 1, 28.00, 28.00, '[]'),
       (11, 2, 1, 42.00, 48.00, '["leche_soya"]'),
       (11, 20, 1, 28.00, 28.00, '[]')`
    );

    // Pedidos Históricos (11-15)
    await client.query(
      `INSERT INTO pedidos (id_cuenta, estado, monto_total, numero_pedido, id_usuario) VALUES
       (11, 'entregado', 213.00, 300, 2),
       (12, 'entregado', 290.00, 301, 3),
       (13, 'entregado', 434.00, 400, 4),
       (14, 'entregado', 172.00, 401, 2),
       (15, 'entregado', 127.00, 402, 3)`
    );

    await client.query(
      `INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids) VALUES
       (12, 4, 2, 40.00, 80.00, '[]'), (12, 12, 1, 78.00, 78.00, '[]'), (12, 18, 1, 55.00, 55.00, '[]'),
       (13, 13, 2, 85.00, 175.00, '["chilaquiles_rojos", "crema"]'), (13, 8, 1, 55.00, 55.00, '[]'), (13, 21, 1, 32.00, 32.00, '[]'), (13, 11, 1, 28.00, 28.00, '[]'),
       (14, 14, 2, 95.00, 226.00, '["tocino"]'), (14, 16, 2, 72.00, 144.00, '[]'), (14, 7, 2, 32.00, 64.00, '[]'),
       (15, 5, 2, 38.00, 86.00, '["shot_extra"]'), (15, 20, 2, 28.00, 56.00, '[]'), (15, 10, 1, 30.00, 30.00, '[]'),
       (16, 1, 1, 35.00, 35.00, '[]'), (16, 6, 1, 45.00, 57.00, '["crema_batida"]'), (16, 19, 1, 35.00, 35.00, '[]')`
    );

    // ===================== INSUMOS E INVENTARIO =====================
    await client.query(
      `INSERT INTO insumos (nombre_insumo, unidad_medida, existencia_actual, nivel_minimo) VALUES
       ('Café en grano', 'kg', 25.0, 5.0), ('Leche entera', 'litros', 40.0, 10.0),
       ('Leche de almendras', 'litros', 12.0, 3.0), ('Chocolate en polvo', 'kg', 8.0, 2.0),
       ('Harina de trigo', 'kg', 30.0, 5.0), ('Huevo', 'piezas', 120.0, 30.0),
       ('Queso mozzarella', 'kg', 10.0, 2.0), ('Tomate', 'kg', 15.0, 3.0),
       ('Pechuga de pollo', 'kg', 20.0, 5.0), ('Azúcar', 'kg', 25.0, 5.0)`
    );

    await client.query(
      `INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario, id_pedido) VALUES
       (1, 'entrada', 30.0, '2026-05-06 08:00:00', 1, NULL),
       (1, 'salida_venta', 0.2, '2026-05-08 09:35:00', 2, 7),
       (2, 'salida_venta', 1.0, '2026-05-08 09:35:00', 2, 7)`
    );

    // ===================== CIERRES Y FINANZAS =====================
    await client.query(
      `INSERT INTO cierre_caja (id_turno, fecha_cierre, total_ingresos, total_egresos, saldo, detalle_efectivo, detalle_tarjeta, detalle_transferencia, id_usuario) VALUES
       (2, '2026-05-07 20:00:00', 553.00, 0, 553.00, 233.00, 320.00, 0, 1),
       (3, '2026-05-06 20:00:00', 808.00, 0, 808.00, 621.00, 0, 187.00, 1)`
    );

    await client.query(
      `INSERT INTO movimientos_financieros (id_turno, tipo, monto, concepto, fecha_hora, id_pedido) VALUES
       (1, 'ingreso', 303.00, 'Pago Mesa 1', '2026-05-08 10:15:00', 7),
       (1, 'ingreso', 163.00, 'Pago Mesa 2', '2026-05-08 11:45:00', 8),
       (1, 'ingreso', 397.00, 'Pago Mesa 6', '2026-05-08 12:40:00', 9),
       (1, 'ingreso', 115.00, 'Pago Mesa 9', '2026-05-08 13:30:00', 10),
       (1, 'ingreso', 84.00, 'Pago Mesa 14', '2026-05-08 14:25:00', 11),
       (1, 'egreso', 50.00, 'Compra de hielo', '2026-05-08 13:00:00', NULL)`
    );

    // ===================== MERMA =====================
    await client.query(
      `INSERT INTO merma_productos (id_producto, cantidad, motivo, fecha_hora, id_usuario) VALUES
       (20, 2, 'Croissant quemado', '2026-05-08 10:00:00', 9),
       (17, 1, 'Pay caducado', '2026-05-07 19:00:00', 1)`
    );

    await client.query('COMMIT');
    console.log('✅ Seed completado con éxito. Datos 100% consistentes.');
    process.exit(0);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en el Seed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

seedTest();
