import pool from './config/database.js';
import bcrypt from 'bcrypt';

const seedTest = async () => {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('123456', saltRounds);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ===================== USUARIOS (mismos 10) =====================
    await client.query(`
      INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena_cifrada, rol, estado) VALUES
      ('Administrador General', 'admin', $1, 'administrador', 'activo'),
      ('Cosa de la cosa', 'Cosa', $1, 'administrador', 'activo'),
      ('Laura Mesera', 'laura.m', $1, 'mesero', 'activo'),
      ('Pedro Mesero', 'pedro.m', $1, 'mesero', 'activo'),
      ('Sofía Mesera', 'sofia.m', $1, 'mesero', 'activo'),
      ('Carlos Cajero', 'carlos.c', $1, 'cajero', 'activo'),
      ('Lucía Cajera', 'lucia.c', $1, 'cajero', 'activo'),
      ('Mario Barra', 'mario.b', $1, 'barra', 'activo'),
      ('Elena Barra', 'elena.b', $1, 'barra', 'activo'),
      ('Diego Cocina', 'diego.k', $1, 'cocina', 'activo'),
      ('Ana Cocina', 'ana.k', $1, 'cocina', 'activo')
    `, [passwordHash]);

    // ===================== MESAS (25) =====================
    await client.query(`
      INSERT INTO mesas (numero_mesa, capacidad, ubicacion, estado) VALUES
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
      ('Mesa 25', 4, 'interior', 'disponible')
    `);

    // ===================== PRODUCTOS (25) =====================
    await client.query(`
      INSERT INTO productos (nombre_producto, descripcion, precio, categoria) VALUES
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
      ('Avena con Frutos Rojos', 'Avena caliente con frutos rojos', 40.00, 'Alimentos')
    `);

    // ===================== INSUMOS (10) =====================
    await client.query(`
      INSERT INTO insumos (nombre_insumo, unidad_medida, existencia_actual, nivel_minimo) VALUES
      ('Café en grano', 'kg', 25.0, 15.0),
      ('Leche entera', 'litros', 12.0, 8.0),
      ('Leche de almendras', 'litros', 5.0, 3.0),
      ('Chocolate en polvo', 'kg', 1.0, 3.0),
      ('Harina de trigo', 'kg', 10.0, 5.0),
      ('Huevo', 'piezas', 20.0, 30.0),
      ('Queso mozzarella', 'kg', 10.0, 2.0),
      ('Tomate', 'kg', 8.0, 3.0),
      ('Pechuga de pollo', 'kg', 20.0, 5.0),
      ('Azúcar', 'kg', 25.0, 5.0)
    `);

    // ===================== GENERAR DATOS HISTÓRICOS =====================
    // Usaremos un rango de fechas desde hace 30 días hasta hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    
    // Array de ids de usuarios para referenciar
    const userIds = { admin: 1, cosa: 2, mesero1: 3, mesero2: 4, mesero3: 5, cajero1: 6, cajero2: 7, barra1: 8, barra2: 9, cocina1: 10, cocina2: 11 };
    
    let turnoId = 1;
    let cuentaId = 1;
    let pedidoId = 1;
    let movimientoFinId = 1;
    let cierreId = 1;
    
    // Recorrer cada día desde startDate hasta today
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const fecha = new Date(d);
      const fechaStr = fecha.toISOString().split('T')[0];
      const isToday = fechaStr === today.toISOString().split('T')[0];
      
      // Crear un turno de caja para cada día (abierto por la mañana, cerrado por la noche, excepto hoy que queda abierto)
      const montoInicial = 500 + Math.floor(Math.random() * 300); // entre 500 y 800
      const idUsuarioApertura = userIds.cajero1;
      const fechaApertura = new Date(fecha);
      fechaApertura.setHours(9, 0, 0, 0);
      
      if (isToday) {
        // Turno abierto hoy
        await client.query(`
          INSERT INTO turnos_caja (id_turno, fecha_apertura, monto_inicial, id_usuario_apertura, estado)
          VALUES ($1, $2, $3, $4, 'abierto')
        `, [turnoId, fechaApertura, montoInicial, idUsuarioApertura]);
      } else {
        // Turno cerrado
        const fechaCierre = new Date(fecha);
        fechaCierre.setHours(21, 0, 0, 0);
        await client.query(`
          INSERT INTO turnos_caja (id_turno, fecha_apertura, monto_inicial, id_usuario_apertura, estado)
          VALUES ($1, $2, $3, $4, 'cerrado')
        `, [turnoId, fechaApertura, montoInicial, idUsuarioApertura]);
        
        // Generar cuentas cerradas para este día (entre 3 y 8 cuentas)
        const numCuentas = 3 + Math.floor(Math.random() * 6);
        let totalIngresosDia = 0;
        let totalEfectivo = 0, totalTarjeta = 0, totalTransferencia = 0;
        let propinasEfectivo = 0, propinasTarjeta = 0, propinasTransferencia = 0;
        
        for (let i = 0; i < numCuentas; i++) {
          // Elegir una mesa aleatoria (id 1..25)
          const idMesa = 1 + Math.floor(Math.random() * 25);
          // Número aleatorio de productos (1 a 4)
          const numProductos = 1 + Math.floor(Math.random() * 4);
          let subtotal = 0;
          let detalles = [];
          let extrasList = [];
          
          for (let p = 0; p < numProductos; p++) {
            const idProducto = 1 + Math.floor(Math.random() * 25);
            // Obtener precio del producto (simulado, pero podemos hardcodear rangos)
            // Para simplificar, usaremos precios conocidos. Mejor consultar la BD pero como estamos en seed, usamos array.
            const precios = [35,42,48,40,38,45,32,55,50,30,28,78,85,95,68,72,45,55,35,28,32,38,42,62,40];
            const precioUnitario = precios[idProducto-1];
            const cantidad = 1 + Math.floor(Math.random() * 2);
            const subtotalItem = precioUnitario * cantidad;
            subtotal += subtotalItem;
            
            // Extras aleatorios (0 a 2 extras)
            const extrasIds = [];
            const numExtras = Math.floor(Math.random() * 3);
            const allExtras = ['leche_deslactosada','leche_almendras','leche_soya','shot_extra','crema_batida','caramelo','vainilla','chispas_chocolate','canela_extra','hielo_separado','chilaquiles_rojos','chilaquiles_verdes','queso_extra','guacamole','tocino','huevo_extra'];
            for (let e = 0; e < numExtras; e++) {
              const extraId = allExtras[Math.floor(Math.random() * allExtras.length)];
              extrasIds.push(extraId);
              // Sumar precio del extra (simplificado: algunos son 0, otros 5-18)
              if (['leche_deslactosada','leche_soya'].includes(extraId)) subtotal += 5;
              else if (extraId === 'leche_almendras') subtotal += 8;
              else if (extraId === 'shot_extra') subtotal += 10;
              else if (extraId === 'crema_batida') subtotal += 12;
              else if (extraId === 'caramelo') subtotal += 6;
              else if (extraId === 'vainilla') subtotal += 5;
              else if (extraId === 'chispas_chocolate') subtotal += 4;
              else if (extraId === 'queso_extra') subtotal += 15;
              else if (extraId === 'guacamole') subtotal += 12;
              else if (extraId === 'tocino') subtotal += 18;
              else if (extraId === 'huevo_extra') subtotal += 10;
            }
            detalles.push({ idProducto, cantidad, precioUnitario, subtotalItem, extrasIds: JSON.stringify(extrasIds) });
          }
          
          const propina = Math.floor(Math.random() * 50) + 5; // entre 5 y 55
          const total = subtotal + propina;
          const metodos = ['efectivo', 'tarjeta', 'transferencia'];
          const metodoPago = metodos[Math.floor(Math.random() * 3)];
          
          // Fecha de apertura de la cuenta: entre las 9:00 y las 20:00 del día
          const horaApertura = new Date(fecha);
          horaApertura.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0);
          const fechaAperturaCuenta = horaApertura;
          const fechaCierreCuenta = new Date(horaApertura);
          fechaCierreCuenta.setMinutes(fechaCierreCuenta.getMinutes() + 30 + Math.floor(Math.random() * 90));
          
          // Insertar cuenta
          await client.query(`
            INSERT INTO cuentas (id_cuenta, id_mesa, estado, fecha_apertura, fecha_cierre, subtotal_acumulado, propina, total, metodo_pago, pagado, id_usuario_apertura, id_usuario_cierre)
            VALUES ($1, $2, 'cerrada', $3, $4, $5, $6, $7, $8, TRUE, $9, $10)
          `, [cuentaId, idMesa, fechaAperturaCuenta, fechaCierreCuenta, subtotal, propina, total, metodoPago, userIds.mesero1, userIds.cajero1]);
          
          // Acumular totales para el cierre
          totalIngresosDia += total;
          if (metodoPago === 'efectivo') {
            totalEfectivo += total;
            propinasEfectivo += propina;
          } else if (metodoPago === 'tarjeta') {
            totalTarjeta += total;
            propinasTarjeta += propina;
          } else {
            totalTransferencia += total;
            propinasTransferencia += propina;
          }
          
          // Crear un pedido para esta cuenta (con varios detalles)
          const numeroPedido = Math.floor(Math.random() * 300) + 1;
          await client.query(`
            INSERT INTO pedidos (id_pedido, id_cuenta, estado, hora_registro, hora_entrega, monto_total, numero_pedido, id_usuario)
            VALUES ($1, $2, 'entregado', $3, $4, $5, $6, $7)
          `, [pedidoId, cuentaId, fechaAperturaCuenta, fechaCierreCuenta, total, numeroPedido, userIds.mesero1]);
          
          // Insertar detalles
          for (const det of detalles) {
            await client.query(`
              INSERT INTO detalle_pedidos (id_pedido, id_producto, cantidad, precio_unitario, subtotal, extras_ids)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [pedidoId, det.idProducto, det.cantidad, det.precioUnitario, det.subtotalItem, det.extrasIds]);
          }
          
          // Insertar movimiento financiero (ingreso) asociado a este pedido
          await client.query(`
            INSERT INTO movimientos_financieros (id_movimiento_fin, id_turno, tipo, monto, concepto, fecha_hora, id_pedido)
            VALUES ($1, $2, 'ingreso', $3, $4, $5, $6)
          `, [movimientoFinId, turnoId, total, `Cobro cuenta ${cuentaId} - Mesa ${idMesa}`, fechaCierreCuenta, pedidoId]);
          
          cuentaId++;
          pedidoId++;
          movimientoFinId++;
        }
        
        // Agregar algunos egresos manuales (entre 1 y 3 por día)
        const numEgresos = 1 + Math.floor(Math.random() * 3);
        let totalEgresosDia = 0;
        for (let e = 0; e < numEgresos; e++) {
          const montoEgreso = 20 + Math.floor(Math.random() * 150);
          const conceptos = ['Compra de insumos', 'Gastos de limpieza', 'Mantenimiento', 'Publicidad', 'Transporte', 'Papelería'];
          const concepto = conceptos[Math.floor(Math.random() * conceptos.length)];
          const fechaEgreso = new Date(fecha);
          fechaEgreso.setHours(14 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0);
          await client.query(`
            INSERT INTO movimientos_financieros (id_movimiento_fin, id_turno, tipo, monto, concepto, fecha_hora)
            VALUES ($1, $2, 'egreso', $3, $4, $5)
          `, [movimientoFinId, turnoId, montoEgreso, concepto, fechaEgreso]);
          totalEgresosDia += montoEgreso;
          movimientoFinId++;
        }
        
        // Calcular saldo del turno
        const saldo = montoInicial + totalIngresosDia - totalEgresosDia;
        
        // Insertar cierre de caja
        await client.query(`
          INSERT INTO cierre_caja (id_cierre, id_turno, fecha_cierre, total_ingresos, total_egresos, saldo,
                                  detalle_efectivo, detalle_tarjeta, detalle_transferencia,
                                  propinas_efectivo, propinas_tarjeta, propinas_transferencia,
                                  efectivo_contado, diferencia, id_usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [cierreId, turnoId, fechaCierre, totalIngresosDia, totalEgresosDia, saldo,
            totalEfectivo, totalTarjeta, totalTransferencia,
            propinasEfectivo, propinasTarjeta, propinasTransferencia,
            totalEfectivo, 0, userIds.cajero1]); // efectivo contado = totalEfectivo (cuadre perfecto)
        cierreId++;
      }
      
      turnoId++;
    }
    
    // ===================== DATOS ADICIONALES: Mermas y Movimientos Inventario =====================
    // Mermas de productos (10 registros con fechas aleatorias dentro de los últimos 30 días)
    const productosIds = Array.from({ length: 25 }, (_, i) => i+1);
    const motivos = ['Error de preparación', 'Caducidad', 'Daño en transporte', 'Devolución cliente', 'Producto defectuoso'];
    for (let i = 0; i < 15; i++) {
      const idProducto = productosIds[Math.floor(Math.random() * productosIds.length)];
      const cantidad = 1 + Math.floor(Math.random() * 3);
      const motivo = motivos[Math.floor(Math.random() * motivos.length)];
      const fecha = new Date(startDate);
      fecha.setDate(startDate.getDate() + Math.floor(Math.random() * 31));
      fecha.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0);
      const idUsuario = userIds.barra1 + Math.floor(Math.random() * 3); // barra o admin
      await client.query(`
        INSERT INTO merma_productos (id_producto, cantidad, motivo, fecha_hora, id_usuario)
        VALUES ($1, $2, $3, $4, $5)
      `, [idProducto, cantidad, motivo, fecha, idUsuario]);
    }
    
    // Movimientos de inventario (entradas y salidas)
    const insumosIds = Array.from({ length: 10 }, (_, i) => i+1);
    // Entradas de insumos (compras) - 20 registros
    for (let i = 0; i < 20; i++) {
      const idInsumo = insumosIds[Math.floor(Math.random() * insumosIds.length)];
      const cantidad = 5 + Math.floor(Math.random() * 30);
      const fecha = new Date(startDate);
      fecha.setDate(startDate.getDate() + Math.floor(Math.random() * 31));
      fecha.setHours(8 + Math.floor(Math.random() * 4), 0, 0);
      await client.query(`
        INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario)
        VALUES ($1, 'entrada', $2, $3, $4)
      `, [idInsumo, cantidad, fecha, userIds.admin]);
    }
    // Salidas por venta (simuladas) - 30 registros
    for (let i = 0; i < 30; i++) {
      const idInsumo = insumosIds[Math.floor(Math.random() * insumosIds.length)];
      const cantidad = 0.2 + Math.random() * 1.5;
      const fecha = new Date(startDate);
      fecha.setDate(startDate.getDate() + Math.floor(Math.random() * 31));
      fecha.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0);
      await client.query(`
        INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario)
        VALUES ($1, 'salida_venta', $2, $3, $4)
      `, [idInsumo, cantidad, fecha, userIds.cajero1]);
    }
    // Mermas de insumos (5 registros)
    for (let i = 0; i < 5; i++) {
      const idInsumo = insumosIds[Math.floor(Math.random() * insumosIds.length)];
      const cantidad = 0.5 + Math.random() * 2;
      const tipo = Math.random() > 0.5 ? 'merma_caducidad' : 'merma_dano';
      const fecha = new Date(startDate);
      fecha.setDate(startDate.getDate() + Math.floor(Math.random() * 31));
      fecha.setHours(15 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60), 0);
      await client.query(`
        INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, fecha_movimiento, id_usuario)
        VALUES ($1, $2, $3, $4, $5)
      `, [idInsumo, tipo, cantidad, fecha, userIds.barra1]);
    }
    
    // Actualizar existencia actual de insumos según los movimientos (para que los datos sean consistentes)
    // Esto se podría hacer con una función, pero a efectos de seed, dejamos los valores iniciales. 
    // El sistema en producción actualizaría en cada movimiento.
    
    await client.query('COMMIT');
    console.log('✅ Seed completado con datos históricos de 30 días. Turnos, cuentas, pedidos y movimientos generados exitosamente.');
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
