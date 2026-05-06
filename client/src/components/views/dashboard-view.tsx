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
      const [pedidos, insumos] = await Promise.all([api.getPedidos(), api.getInsumos()])
      const today = new Date().toISOString().split('T')[0]
      const pedidosHoy = pedidos.filter((p: any) => p.hora_registro.startsWith(today))
      const ventasHoy = pedidosHoy.reduce((sum: number, p: any) => sum + p.monto_total, 0)
      const pendientes = pedidos.filter((p: any) => p.estado === 'pendiente').length
      const enPreparacion = pedidos.filter((p: any) => p.estado === 'en preparación').length
      const bajos = insumos.filter((i: any) => i.existencia_actual <= i.nivel_minimo)
      setStats({
        ventasHoy,
        pedidosPendientes: pendientes,
        pedidosEnPreparacion: enPreparacion,
        insumosEnAlerta: bajos.length,
        pedidosRecientes: pedidos.slice(0, 5),
      })
      setInsumosBajos(bajos)
    } catch (error) {
      console.error('Error cargando dashboard', error)
    } finally {
      setLoading(false)
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
      'pendiente': 'bg-amber-100 text-amber-700',
      'en preparación': 'bg-blue-100 text-blue-700',
      'listo': 'bg-green-100 text-green-700',
      'entregado': 'bg-gray-100 text-gray-700'
    }
    return <Badge className={styles[estado] || ''} variant="outline">{estado}</Badge>
  }

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando resumen...</div>

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <h1>{getGreeting()}, {user?.nombre_usuario}</h1>
        <p>Aquí tienes un resumen del día</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="label"><DollarSign size={16} /> Ventas del Día</div>
          <div className="value">{formatCurrency(stats.ventasHoy)}</div>
          <div className="sub"><TrendingUp size={12} className="inline" /> Actualizado en tiempo real</div>
        </div>
        <div className="dashboard-card">
          <div className="label"><ShoppingCart size={16} /> Pedidos Pendientes</div>
          <div className="value">{stats.pedidosPendientes}</div>
          <div className="sub">Esperando preparación</div>
        </div>
        <div className="dashboard-card">
          <div className="label"><Clock size={16} /> En Preparación</div>
          <div className="value">{stats.pedidosEnPreparacion}</div>
          <div className="sub">En barra y cocina</div>
        </div>
        <div className="dashboard-card">
          <div className="label"><AlertTriangle size={16} /> Alertas Inventario</div>
          <div className="value">{stats.insumosEnAlerta}</div>
          <div className="sub">Insumos bajo stock mínimo</div>
        </div>
      </div>

      <div className="dashboard-recent">
        <h2>Pedidos Recientes</h2>
        {stats.pedidosRecientes.map((pedido: any) => (
          <div className="item" key={pedido.id_pedido}>
            <div className="info">
              <div className="circle">#{pedido.id_pedido}</div>
              <div className="text">
                <div className="mesa">{pedido.mesa}</div>
                <div className="meta">{pedido.detalles?.length || 0} productos • {formatTime(pedido.hora_registro)}</div>
              </div>
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--chocolate)', marginRight: '1rem' }}>
                {formatCurrency(pedido.monto_total)}
              </span>
              {getStatusBadge(pedido.estado)}
            </div>
          </div>
        ))}
        {stats.pedidosRecientes.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--caramel)' }}>
            <Package size={48} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p>No hay pedidos recientes</p>
          </div>
        )}
      </div>

      {user?.rol === 'administrador' && stats.insumosEnAlerta > 0 && (
        <div className="dashboard-alert">
          <h2><AlertTriangle size={20} /> Alertas de Inventario</h2>
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
