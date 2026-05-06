'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Pedido, OrderStatus } from '@/lib/types'
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
            ['Bebidas Calientes', 'Bebidas Frías', 'Postres'].includes(d.categoria)
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
    const clases: Record<string, string> = {
      'pendiente': 'badge badge-pendiente',
      'en preparación': 'badge badge-preparacion',
      'listo': 'badge badge-listo',
      'entregado': 'badge badge-entregado'
    }
    return <span className={clases[estado] || ''}>{estado}</span>
  }

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const getElapsedTime = (dateString: string) => {
    const elapsed = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000)
    if (elapsed < 1) return 'Ahora'
    if (elapsed === 1) return '1 min'
    return `${elapsed} min`
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente')
  const enPreparacion = pedidos.filter(p => p.estado === 'en preparación')
  const listos = pedidos.filter(p => p.estado === 'listo')

  if (loading) return <div style={{textAlign:'center', padding:'2rem', color:'var(--caramel)'}}>Cargando pedidos de barra...</div>

  return (
    <div className="barra-page">
      {/* Encabezado */}
      <div className="barra-header">
        <div className="barra-icon">
          <GlassWater size={24} />
        </div>
        <div>
          <h1 className="barra-title">Barra</h1>
          <p className="barra-subtitle">Bebidas Calientes, Frías y Postres</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="barra-stats">
        <div className="barra-stat-card" style={{backgroundColor: '#FFFBEB', border: '1px solid #FCD34D'}}>
          <div>
            <p className="barra-stat-label" style={{color: '#92400E'}}>Pendientes</p>
            <p className="barra-stat-number" style={{color: '#92400E'}}>{pendientes.length}</p>
          </div>
          <Clock size={32} style={{color:'#F59E0B'}} />
        </div>
        <div className="barra-stat-card" style={{backgroundColor: '#EFF6FF', border: '1px solid #93C5FD'}}>
          <div>
            <p className="barra-stat-label" style={{color: '#1E40AF'}}>En Preparación</p>
            <p className="barra-stat-number" style={{color: '#1E40AF'}}>{enPreparacion.length}</p>
          </div>
          <ChefHat size={32} style={{color:'#3B82F6'}} />
        </div>
        <div className="barra-stat-card" style={{backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7'}}>
          <div>
            <p className="barra-stat-label" style={{color: '#065F46'}}>Listos</p>
            <p className="barra-stat-number" style={{color: '#065F46'}}>{listos.length}</p>
          </div>
          <CheckCircle size={32} style={{color:'#10B981'}} />
        </div>
      </div>

      {/* Columnas */}
      <div className="barra-columnas">
        {/* Pendientes */}
        <div className="barra-columna">
          <h2 className="barra-columna-titulo" style={{color: '#92400E'}}>
            <Clock size={20} /> Pendientes ({pendientes.length})
          </h2>
          {pendientes.length === 0 ? (
            <div className="barra-vacio barra-vacio-pendientes">
              <p>No hay pedidos pendientes</p>
            </div>
          ) : (
            pendientes.map(pedido => (
              <div key={pedido.id_pedido} className="barra-pedido">
                <div className="barra-pedido-header">
                  <h3 className="barra-pedido-titulo">Pedido #{pedido.numero_pedido ?? pedido.id_pedido}</h3>
                  <span className="badge badge-pendiente">{getElapsedTime(pedido.hora_registro)}</span>
                </div>
                <div className="barra-pedido-mesa">{pedido.mesa} • {formatTime(pedido.hora_registro)}</div>
                <div className="barra-pedido-productos">
                  {pedido.detalles?.map(detalle => (
                    <div key={detalle.id_detalle} className="barra-pedido-producto">
                      <span>{detalle.cantidad}x {detalle.nombre_producto}</span>
                    </div>
                  ))}
                </div>
                {pedido.notas && <div className="barra-pedido-notas">📝 {pedido.notas}</div>}
                <button className="barra-btn barra-btn-preparar" onClick={() => cambiarEstado(pedido.id_pedido, 'en preparación')}>
                  <ChefHat size={16} /> Comenzar Preparación
                </button>
              </div>
            ))
          )}
        </div>

        {/* En Preparación */}
        <div className="barra-columna">
          <h2 className="barra-columna-titulo" style={{color: '#1E40AF'}}>
            <ChefHat size={20} /> En Preparación ({enPreparacion.length})
          </h2>
          {enPreparacion.length === 0 ? (
            <div className="barra-vacio barra-vacio-preparacion">
              <p>Nada en preparación</p>
            </div>
          ) : (
            enPreparacion.map(pedido => (
              <div key={pedido.id_pedido} className="barra-pedido">
                <div className="barra-pedido-header">
                  <h3 className="barra-pedido-titulo">Pedido #{pedido.numero_pedido ?? pedido.id_pedido}</h3>
                  <span className="badge badge-preparacion">{getElapsedTime(pedido.hora_registro)}</span>
                </div>
                <div className="barra-pedido-mesa">{pedido.mesa} • {formatTime(pedido.hora_registro)}</div>
                <div className="barra-pedido-productos">
                  {pedido.detalles?.map(detalle => (
                    <div key={detalle.id_detalle} className="barra-pedido-producto">
                      <span>{detalle.cantidad}x {detalle.nombre_producto}</span>
                    </div>
                  ))}
                </div>
                <button className="barra-btn barra-btn-listo" onClick={() => cambiarEstado(pedido.id_pedido, 'listo')}>
                  <CheckCircle size={16} /> Marcar como Listo
                </button>
              </div>
            ))
          )}
        </div>

        {/* Listos */}
        <div className="barra-columna">
          <h2 className="barra-columna-titulo" style={{color: '#065F46'}}>
            <CheckCircle size={20} /> Listos para Entregar ({listos.length})
          </h2>
          {listos.length === 0 ? (
            <div className="barra-vacio barra-vacio-listo">
              <p>No hay pedidos listos</p>
            </div>
          ) : (
            listos.map(pedido => (
              <div key={pedido.id_pedido} className="barra-pedido">
                <div className="barra-pedido-header">
                  <h3 className="barra-pedido-titulo">Pedido #{pedido.numero_pedido ?? pedido.id_pedido}</h3>
                  {getStatusBadge(pedido.estado)}
                </div>
                <div className="barra-pedido-mesa">{pedido.mesa} • {formatTime(pedido.hora_registro)}</div>
                <div className="barra-pedido-productos">
                  {pedido.detalles?.map(detalle => (
                    <div key={detalle.id_detalle} className="barra-pedido-producto">
                      <span>{detalle.cantidad}x {detalle.nombre_producto}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:'0.75rem', color:'#065F46', textAlign:'center', marginTop:'0.75rem'}}>
                  Esperando que el mesero lo entregue
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
