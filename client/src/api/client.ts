import { getGlobalLogout } from '../providers/AuthProvider';

const API_BASE = import.meta.env.VITE_API_URL || '/api';


export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {

  	if (response.status === 401) {
  		const logoutFn = getGlobalLogout();
  		if (logoutFn) logoutFn();
  	}
  	
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || 'Error desconocido');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { nombre_usuario: string; contrasena: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Productos
  getProductos: () => request<any[]>('/productos'),
  createProducto: (data: any) =>
    request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  updateProducto: (id: number, data: any) =>
    request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProducto: (id: number) =>
    request(`/productos/${id}`, { method: 'DELETE' }),

  // Pedidos
  getPedidos: () => request<any[]>('/pedidos'),
  createPedido: (data: any) =>
    request('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  updatePedidoEstado: (id: number, estado: string) =>
    request(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  // Insumos
  getInsumos: () => request<any[]>('/insumos'),
  createInsumo: (data: any) =>
    request('/insumos', { method: 'POST', body: JSON.stringify(data) }),
  updateInsumo: (id: number, data: any) =>
    request(`/insumos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Movimientos inventario
  getMovimientosInventario: () => request<any[]>('/movimientos-inventario'),
  createMovimientoInventario: (data: any) =>
    request('/movimientos-inventario', { method: 'POST', body: JSON.stringify(data) }),

  // Movimientos financieros
  getMovimientosFinancieros: () => request<any[]>('/movimientos'),
  createMovimientoFinanciero: (data: any) =>
    request('/movimientos', { method: 'POST', body: JSON.stringify(data) }),

  // Caja / Turnos
    getTurnoActivo: () => request<any>('/caja/turno'),
    abrirTurno: (data: { monto_inicial: number }) => request('/caja/abrir', { method: 'POST', body: JSON.stringify(data) }),
    cerrarTurno: () => request('/caja/cerrar', { method: 'POST' }),
    getHistorialCierres: () => request<any[]>('/caja/historial'),

  // Mermas
  getMermas: () => request<any[]>('/mermas'),
  createMerma: (data: any) =>
    request('/mermas', { method: 'POST', body: JSON.stringify(data) }),

  // Reportes
  getResumenVentas: () => request<any>('/reportes/resumen'),
  getReporteMensual: () => request<any>('/reportes/mensual'),

  // Usuarios
  getUsuarios: () => request<any[]>('/usuarios'),
  createUsuario: (data: any) =>
    request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  updateUsuario: (id: number, data: any) =>
    request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  bajaUsuario: (id: number) =>
    request(`/usuarios/${id}/baja`, { method: 'PATCH' }),

  // Mesas
    getMesas: () => request<any[]>('/mesas'),
    createMesa: (data: any) => request('/mesas', { method: 'POST', body: JSON.stringify(data) }),
    updateMesa: (id: number, data: any) => request(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMesa: (id: number) => request(`/mesas/${id}`, { method: 'DELETE' }),
    
    // Cuentas
    getCuentasAbiertas: () => request<any[]>('/cuentas/abiertas'),
    cerrarCuenta: (id: number, data: { metodo_pago: string; propina?: number }) =>
      request(`/cuentas/${id}/cerrar`, { method: 'PATCH', body: JSON.stringify(data) }),


    
};
