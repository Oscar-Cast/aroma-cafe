'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Pedido, OrderStatus } from '@/lib/types'
import { extrasDisponibles } from '@/lib/extras'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GlassWater, Clock, ChefHat, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/produccion.css'

export function BarraView() {
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  const cargarPedidos = async () => {
    try {
      const data = await api.getPedidos()
      const filtrados = data
        .map((p: Pedido) => ({
          ...p,
          detalles: p.detalles?.filter((d: any) =>
            ['Bebidas Calientes', 'Bebidas Frías', 'Postres', 'Cafetería'].includes(d.categoria)
          )
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

  const getStatusBadge = (estado: string) => {
    const claseEstado = estado === 'en preparación' ? 'en-preparacion' : estado;
    return <Badge className={`produccion-status-badge ${claseEstado}`} variant="outline" style={{fontSize: '1.3rem'}}>{estado}</Badge>;
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

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando...</div>

  return (
    <div className="produccion-page">
      <div className="produccion-header">
        <div className="produccion-icon produccion-icon-barra" style={{height: '75px', width: '75px'}}>
          <GlassWater size={60} />
        </div>
        <div>
          <h1 className="produccion-title" style={{fontSize: '4rem'}}>Barra</h1>
          <p className="produccion-subtitle" style={{fontSize: '2rem', fontWeight: '700', color: 'rgb(114, 92, 63,0.5)'}}>Bebidas Calientes, Frías y Postres</p>
        </div>
      </div>

      <div className="produccion-stats-grid">
        <Card className="produccion-stat-card pendiente" style={{height: '100px', width: '400px'}}>
          <div>
            <div className="produccion-stat-label" style={{ color: '#92400e',fontSize: '1.4rem', fontWeight: '700' }}>Pendientes</div>
            <div className="produccion-stat-number" style={{ color: 'rgb(146, 64, 14,0.5)',fontSize: '1.4rem', fontWeight: '800' }}>{pendientes.length}</div>
          </div>
        </Card>
        <Card className="produccion-stat-card en-preparacion" style={{height: '100px', width: '400px'}}>
          <div>
            <div className="produccion-stat-label" style={{ color: '#1e40af',fontSize: '1.4rem', fontWeight: '700' }}>En Preparación</div>
            <div className="produccion-stat-number" style={{ color: 'rgb(30, 64, 175,0.5)',fontSize: '1.4rem', fontWeight: '800' }}>{enPreparacion.length}</div>
          </div>
        </Card>
        <Card className="produccion-stat-card listo" style={{height: '100px', width: '400px'}}>
          <div>
            <div className="produccion-stat-label" style={{ color: '#166534',fontSize: '1.4rem', fontWeight: '700' }}>Listos</div>
            <div className="produccion-stat-number" style={{ color: 'rgb(22, 101, 52,0.5)',fontSize: '1.4rem', fontWeight: '800' }}>{listos.length}</div>
          </div>
        </Card>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Pendientes */}
        <div className="produccion-column">
          <h2 className="produccion-column-title" style={{ color: '#92400e', fontSize: '1.8rem', fontWeight: '700' }}>
            <Clock size={30} /> Pendientes
          </h2>
          {pendientes.map(pedido => (
            <Card key={pedido.id_pedido} className="produccion-order-card" style={{ borderColor: '#fcd34d', borderWidth: '3px' }}>
              <CardHeader className="produccion-order-card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <CardTitle className="produccion-order-card-title" style={{fontSize: '2.3rem'}}>
                    Pedido #{pedido.numero_pedido ?? pedido.id_pedido}
                  </CardTitle>
                  <Badge className="badge-warning" style={{width: '25%', fontSize: '1.3rem'}}>{getElapsedTime(pedido.hora_registro)}</Badge>
                </div>
                <CardDescription className="produccion-order-card-desc" style={{fontSize: '1.3rem', fontWeight: '700', color: 'rgb(114, 92, 63, 0.5)'}}>
                  {pedido.mesa} • {formatTime(pedido.hora_registro)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {pedido.detalles?.map(d => (
                    <div key={d.id_detalle}>
                      <div className="produccion-order-card-detail"style={{fontSize: '1.5rem'}}>
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div style={{ paddingLeft: '1.25rem', fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.5)', fontWeight: '700' }}>
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} style={{ display: 'flex', gap: '0.5rem' }}>
                                <span>+ {extra.nombre}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pedido.notas && <div className="produccion-order-card-notas">Nota: {pedido.notas}</div>}
                <Button className="produccion-btn-start" onClick={() => cambiarEstado(pedido.id_pedido, 'en preparación')} style={{fontSize: '1.2rem', width: '100%'}}>
                  <ChefHat style={{width: '1.5rem', height: '1.5rem'}} /> Comenzar Preparación
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* En Preparación */}
        <div className="produccion-column">
          <h2 className="produccion-column-title" style={{ color: '#1e40af', fontSize: '1.8rem', fontWeight: '700' }}>
            <ChefHat size={30} /> En Preparación
          </h2>
          {enPreparacion.map(pedido => (
            <Card key={pedido.id_pedido} className="produccion-order-card" style={{ borderColor: '#93c5fd', borderWidth: '3px' }}>
              <CardHeader className="produccion-order-card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <CardTitle className="produccion-order-card-title" style={{fontSize: '2.3rem'}}>
                    Pedido #{pedido.numero_pedido ?? pedido.id_pedido}
                  </CardTitle>
                  <Badge className="badge-info" style={{width: '25%', fontSize: '1.3rem'}}>{getElapsedTime(pedido.hora_registro)}</Badge>
                </div>
                <CardDescription className="produccion-order-card-desc" style={{fontSize: '1.3rem', fontWeight: '700', color: 'rgb(114, 92, 63, 0.5)'}}>
                  {pedido.mesa} • {formatTime(pedido.hora_registro)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {pedido.detalles?.map(d => (
                    <div key={d.id_detalle}>
                      <div className="produccion-order-card-detail" style={{fontSize: '1.5rem'}}>
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div style={{ paddingLeft: '1.25rem', fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.5)', fontWeight: '700' }}>
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} style={{ display: 'flex', gap: '0.5rem' }}>
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
                  <CheckCircle size={20} style={{ marginRight: '0.5rem' }} /> Marcar como Listo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listos */}
        <div className="produccion-column">
          <h2 className="produccion-column-title" style={{ color: '#166534', fontSize: '1.8rem', fontWeight: '700' }}>
            <CheckCircle size={30} /> Listos para Entregar
          </h2>
          {listos.map(pedido => (
            <Card key={pedido.id_pedido} className="produccion-order-card" style={{ borderColor: '#86efac', borderWidth: '3px' }}>
              <CardHeader className="produccion-order-card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <CardTitle className="produccion-order-card-title" style={{ fontSize: '2.3rem' }}>
                    Pedido #{pedido.numero_pedido ?? pedido.id_pedido}
                  </CardTitle>
                  {getStatusBadge(pedido.estado)}
                </div>
                <CardDescription className="produccion-order-card-desc" style={{fontSize: '1.3rem', fontWeight: '700', color: 'rgb(114, 92, 63, 0.5)'}}>
                  {pedido.mesa} • {formatTime(pedido.hora_registro)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {pedido.detalles?.map(d => (
                    <div key={d.id_detalle}>
                      <div className="produccion-order-card-detail" style={{ fontSize: '1.5rem' }}>
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                        <span>{d.subtotal}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div style={{ paddingLeft: '1.25rem', fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.5)', fontWeight: '700' }}>
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} style={{ display: 'flex', gap: '0.5rem' }}>
                                <span>+ {extra.nombre}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '1.3rem', color: '#16a34a', textAlign: 'center', marginTop: '0.5rem' }}>
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
