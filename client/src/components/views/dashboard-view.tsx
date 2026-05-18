'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import '@/styles/dashboard.css'

export function DashboardView() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    ventasHoy: 0,
    pedidosPendientes: 0,
    pedidosEnPreparacion: 0,
    insumosEnAlerta: 0,
    pedidosRecientes: [] as any[],
  })
  const [insumosBajos, setInsumosBajos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      // Obtener TODOS los pedidos del día (sin filtrar por turno) para las ventas
      const todosPedidos = await api.getPedidos({ todas: true });
      const todayStr = new Date().toISOString().split('T')[0];
      const pedidosHoy = todosPedidos.filter((p: any) => p.hora_registro.startsWith(todayStr));
      const ventasHoy = pedidosHoy.reduce((sum: number, p: any) => sum + parseFloat(p.monto_total), 0);

      // Insumos (no dependen del turno)
      const insumos = await api.getInsumos();
      const bajos = insumos.filter((i: any) => parseFloat(i.existencia_actual) <= parseFloat(i.nivel_minimo) || parseFloat(i.existencia_actual) >= parseInt(i.nivel_minimo * 3));

      // Para los contadores de pendientes y en preparación usamos TODOS los pedidos activos (no solo del turno) para que el admin vea la realidad completa
      const pendientes = todosPedidos.filter((p: any) => p.estado === 'pendiente').length;
      const enPreparacion = todosPedidos.filter((p: any) => p.estado === 'en preparación').length;

      setStats({
        ventasHoy,
        pedidosPendientes: pendientes,
        pedidosEnPreparacion: enPreparacion,
        insumosEnAlerta: bajos.length,
        pedidosRecientes: todosPedidos.slice(0, 5),
      });
      setInsumosBajos(bajos);
    } catch (error) {
      console.error('Error cargando dashboard', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      'pendiente': 'badge-warning',
      'en preparación': 'badge-info',
      'listo': 'badge-success',
      'entregado': 'badge-gray'
    }
    return <Badge className={styles[estado] || ''} variant="outline">{estado}</Badge>
  }

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando resumen...</div>

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <h1>{getGreeting()}, {user?.nombre}</h1>
        <p>Aquí tienes un resumen del día</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="label"><DollarSign size={20} /> Ventas del Día</div>
          <div className="value">{formatCurrency(stats.ventasHoy)}</div>
          <div className="sub"><TrendingUp size={15} className="inline" style={{ color: 'green' }} /> Actualizado en tiempo real</div>
        </div>
        <div className="dashboard-card">
          <div className="label"><ShoppingCart size={20} /> Pedidos Pendientes</div>
          <div className="value">{stats.pedidosPendientes}</div>
          <div className="sub">Esperando preparación</div>
        </div>
        <div className="dashboard-card">
          <div className="label"><Clock size={20} style={{color: 'blue'}} /> En Preparación</div>
          <div className="value">{stats.pedidosEnPreparacion}</div>
          <div className="sub">En barra y cocina</div>
        </div>
        <div className="dashboard-card">
          <div className="label"><AlertTriangle size={20} style={{ color: 'red' }} /> Alertas Inventario</div>
          <div className="value">{stats.insumosEnAlerta}</div>
          <div className="sub">Insumos bajo stock mínimo</div>
        </div>
      </div>

      <div className="dashboard-recent">
        <h2>Pedidos Recientes</h2>
        {stats.pedidosRecientes.map((pedido: any) => (
          <div className="item" key={pedido.id_pedido}>
            <div className="info">
              <div className="circle">#{pedido.numero_pedido ?? pedido.id_pedido}</div>
              <div className="text">
                <div className="mesa">{pedido.mesa}</div>
                <div className="meta">{pedido.detalles?.length || 0} productos • {formatTime(pedido.hora_registro)}</div>
              </div>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--chocolate)', marginRight: '2rem' }}>
                {formatCurrency(pedido.monto_total)}
              </span>
              {getStatusBadge(pedido.estado)}
            </div>
          </div>
        ))}
        {stats.pedidosRecientes.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--chocolate)' }}>
            <Package size={48} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p>No hay pedidos recientes</p>
          </div>
        )}
      </div>

      {user?.rol === 'administrador' && stats.insumosEnAlerta > 0 && (
        <div className="dashboard-alert">
          <h2><AlertTriangle size={20} style={{color: 'red'}} /> Alertas de Inventario</h2>
          <div className="grid">
            {insumosBajos.map((insumo: any) => (
              <div className="item" key={insumo.id_insumo}>
                <div className="name">{insumo.nombre_insumo}</div>
                <div className="detail">{insumo.existencia_actual} {insumo.unidad_medida} (mín: {insumo.nivel_minimo})</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
