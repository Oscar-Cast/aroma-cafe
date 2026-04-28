// User types
export type UserRole = 'administrador' | 'cajero' | 'mesero' | 'barra' | 'cocina'

export interface User {
  id: number
  nombre: string
  nombre_completo?: string
  rol: UserRole
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Product types
export type ProductCategory = 'Bebidas Calientes' | 'Bebidas Frías' | 'Alimentos' | 'Postres' | 'Cafetería'

export interface Producto {
  id_producto: number
  nombre_producto: string
  descripcion: string
  precio: number
  categoria: ProductCategory
  disponible: 'activo' | 'inactivo'
}

// Order types
export type OrderStatus = 'pendiente' | 'en preparación' | 'listo' | 'entregado'

export interface DetallePedido {
  id_detalle: number
  id_pedido: number
  id_producto: number
  nombre_producto?: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  categoria?: ProductCategory
}

export interface Pedido {
  id_pedido: number
  mesa: string
  estado: OrderStatus
  hora_registro: string
  hora_entrega?: string
  monto_total: number
  id_usuario: number
  nombre_usuario?: string
  detalles?: DetallePedido[]
}

// Inventory types
export interface Insumo {
  id_insumo: number
  nombre_insumo: string
  unidad_medida: string
  existencia_actual: number
  nivel_minimo: number
}

export type MovementType = 'entrada' | 'salida_venta' | 'merma_caducidad' | 'merma_dano' | 'ajuste'

export interface MovimientoInventario {
  id_movimiento: number
  id_insumo: number
  nombre_insumo?: string
  tipo_movimiento: MovementType
  cantidad: number
  fecha_movimiento: string
  id_usuario: number
  nombre_usuario?: string
  id_pedido?: number
}

// Cash register types
export interface CierreCaja {
  id_cierre: number
  fecha_cierre: string
  total_ingresos: number
  total_egresos: number
  saldo: number
  id_usuario: number
  nombre_usuario?: string
}

export interface MovimientoFinanciero {
  id_movimiento_fin: number
  tipo: 'ingreso' | 'egreso'
  monto: number
  concepto: string
  fecha_hora: string
  id_pedido?: number
  id_cierre?: number
}

// Waste/Loss types
export interface MermaProducto {
  id_merma_prod: number
  id_producto: number
  nombre_producto?: string
  cantidad: number
  motivo: string
  fecha_hora: string
  id_usuario: number
  nombre_usuario?: string
}

// Report types
export interface ResumenVentas {
  graficaVentas: { fecha: string; total: number }[]
  productosPopulares: { nombre_producto: string; cantidad_vendida: number }[]
  resumenFinanciero: {
    total_ingresos: number
    total_egresos: number
    saldo: number
    fecha_cierre: string
  } | null
}

export interface ReporteMensual {
  mes: string
  ingresos_mes: number
  egresos_mes: number
  utilidad_neta: number
}

// Table types
export interface Mesa {
  id_mesa: number
  numero_mesa: string
  capacidad: number
  ubicacion: 'interior' | 'terraza'
  estado: 'disponible' | 'ocupada' | 'reservada'
}

// Account/Bill types
export interface Cuenta {
  id_cuenta: number
  id_pedido: number
  mesa: string
  subtotal: number
  propina?: number
  total: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  pagado: boolean
  fecha_cierre?: string
  id_cajero: number
  nombre_cajero?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
