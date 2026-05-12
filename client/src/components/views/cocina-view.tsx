'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Pedido, OrderStatus } from '@/lib/types'
import { extrasDisponibles } from '@/lib/extras'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Utensils, Clock, ChefHat, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/produccion.css'

export function CocinaView() {
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  const cargarPedidos = async () => {
    try {
      const data = await api.getPedidos()
      const filtrados = data
        .map((p: Pedido) => ({
          ...p,
          detalles: p.detalles?.filter((d: any) => d.categoria === 'Alimentos')
        }))
        .filter((p: Pedido) => p.detalles && p.detalles.length > 0)
      setPedidos(filtrados)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los pedidos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarPedidos() }, [])

  const cambiarEstado = async (pedidoId: number, nuevoEstado: OrderStatus) => {
    try {
      await api.updatePedidoEstado(pedidoId, nuevoEstado)
      toast({ title: 'Estado actualizado' })
      cargarPedidos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
    }
  }

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const getElapsedTime = (dateString: string) => {
    const elapsed = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
    if (elapsed < 1) return 'Ahora'
    if (elapsed === 1) return '1 min'
    return `${elapsed} min`
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente')
  const enPreparacion = pedidos.filter(p => p.estado === 'en preparación')
  const listos = pedidos.filter(p => p.estado === 'listo')

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando pedidos de cocina...</div>

  return (
    <div className="produccion-page">
      <div className="produccion-header">
        <div className="produccion-icon produccion-icon-cocina">
          <Utensils size={24} />
        </div>
        <div>
          <h1 className="produccion-title">Cocina</h1>
          <p className="produccion-subtitle">Solo Alimentos</p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="produccion-stats-grid">
        <Card className="produccion-stat-card pendiente">
          <CardContent className="produccion-stat-content">
            <div>
              <div className="produccion-stat-label">Pendientes</div>
              <div className="produccion-stat-number">{pendientes.length}</div>
            </div>
            <Clock size={32} />
          </CardContent>
        </Card>
        <Card className="produccion-stat-card en-preparacion">
          <CardContent className="produccion-stat-content">
            <div>
              <div className="produccion-stat-label">En Preparación</div>
              <div className="produccion-stat-number">{enPreparacion.length}</div>
            </div>
            <ChefHat size={32} />
          </CardContent>
        </Card>
        <Card className="produccion-stat-card listo">
          <CardContent className="produccion-stat-content">
            <div>
              <div className="produccion-stat-label">Listos</div>
              <div className="produccion-stat-number">{listos.length}</div>
            </div>
            <CheckCircle size={32} />
          </CardContent>
        </Card>
      </div>

      {/* Tres columnas de pedidos */}
      <div className="produccion-columns">
        {/* Pendientes */}
        <div className="produccion-column">
          <h2 className="produccion-column-title pendiente">
            <Clock size={18} /> Pendientes ({pendientes.length})
          </h2>
          {pendientes.map(pedido => (
            <Card key={pedido.id_pedido} className="produccion-order-card">
              <CardHeader className="produccion-order-card-header">
                <div className="produccion-order-card-top">
                  <CardTitle className="produccion-order-card-title">
                    Pedido #{pedido.numero_pedido ?? pedido.id_pedido}
                  </CardTitle>
                  <Badge className="produccion-status-badge pendiente">
                    {getElapsedTime(pedido.hora_registro)}
                  </Badge>
                </div>
                <CardDescription className="produccion-order-card-desc">
                  {pedido.mesa} • {formatTime(pedido.hora_registro)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="produccion-order-details">
                  {pedido.detalles?.map(d => (
                    <div key={d.id_detalle}>
                      <div className="produccion-order-detail-row">
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div className="produccion-extras">
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} className="produccion-extra-item">
                                <span>+ {extra.nombre}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pedido.notas && (
                  <div className="produccion-order-notas">
                    📝 {pedido.notas}
                  </div>
                )}
                <Button className="produccion-btn-start" onClick={() => cambiarEstado(pedido.id_pedido, 'en preparación')}>
                  <ChefHat size={16} /> Comenzar Preparación
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* En Preparación */}
        <div className="produccion-column">
          <h2 className="produccion-column-title en-preparacion">
            <ChefHat size={18} /> En Preparación ({enPreparacion.length})
          </h2>
          {enPreparacion.map(pedido => (
            <Card key={pedido.id_pedido} className="produccion-order-card">
              <CardHeader className="produccion-order-card-header">
                <div className="produccion-order-card-top">
                  <CardTitle className="produccion-order-card-title">
                    Pedido #{pedido.numero_pedido ?? pedido.id_pedido}
                  </CardTitle>
                  <Badge className="produccion-status-badge en-preparacion">
                    {getElapsedTime(pedido.hora_registro)}
                  </Badge>
                </div>
                <CardDescription className="produccion-order-card-desc">
                  {pedido.mesa} • {formatTime(pedido.hora_registro)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="produccion-order-details">
                  {pedido.detalles?.map(d => (
                    <div key={d.id_detalle}>
                      <div className="produccion-order-detail-row">
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div className="produccion-extras">
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} className="produccion-extra-item">
                                <span>+ {extra.nombre}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button className="produccion-btn-ready" onClick={() => cambiarEstado(pedido.id_pedido, 'listo')}>
                  <CheckCircle size={16} /> Marcar como Listo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listos */}
        <div className="produccion-column">
          <h2 className="produccion-column-title listo">
            <CheckCircle size={18} /> Listos para Entregar ({listos.length})
          </h2>
          {listos.map(pedido => (
            <Card key={pedido.id_pedido} className="produccion-order-card">
              <CardHeader className="produccion-order-card-header">
                <div className="produccion-order-card-top">
                  <CardTitle className="produccion-order-card-title">
                    Pedido #{pedido.numero_pedido ?? pedido.id_pedido}
                  </CardTitle>
                  <Badge className="produccion-status-badge listo">
                    Listo
                  </Badge>
                </div>
                <CardDescription className="produccion-order-card-desc">
                  {pedido.mesa} • {formatTime(pedido.hora_registro)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="produccion-order-details">
                  {pedido.detalles?.map(d => (
                    <div key={d.id_detalle}>
                      <div className="produccion-order-detail-row">
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div className="produccion-extras">
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} className="produccion-extra-item">
                                <span>+ {extra.nombre}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="produccion-espera">
                  Esperando que el mesero lo entregue
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
