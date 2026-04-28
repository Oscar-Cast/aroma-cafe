'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Pedido, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Utensils, Clock, ChefHat, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function CocinaView() {
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  const cargarPedidos = async () => {
    try {
      const data = await api.getPedidos()
      const filtrados = data
        .filter((p: Pedido) => p.estado !== 'entregado')
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
      toast({ title: 'Estado actualizado', description: `Pedido #${pedidoId} marcado como "${nuevoEstado}"` })
      cargarPedidos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' })
    }
  }

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      'pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
      'en preparación': 'bg-blue-100 text-blue-700 border-blue-200',
      'listo': 'bg-green-100 text-green-700 border-green-200',
    }
    return <Badge className={styles[estado] || ''} variant="outline">{estado}</Badge>
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

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando pedidos de cocina...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#354024] rounded-full flex items-center justify-center">
          <Utensils className="w-6 h-6 text-[#E5D7C4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Cocina</h1>
          <p className="text-[#889063]">Solo Alimentos</p>
        </div>
      </div>

      {/* Stats y columnas igual que BarraView, sin cambios relevantes salvo los filtros */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-amber-700">Pendientes</p><p className="text-3xl font-bold text-amber-800">{pendientes.length}</p></div><Clock className="w-10 h-10 text-amber-500" /></div></CardContent></Card>
        <Card className="border-blue-200 bg-blue-50"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-blue-700">En Preparación</p><p className="text-3xl font-bold text-blue-800">{enPreparacion.length}</p></div><ChefHat className="w-10 h-10 text-blue-500" /></div></CardContent></Card>
        <Card className="border-green-200 bg-green-50"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-green-700">Listos</p><p className="text-3xl font-bold text-green-800">{listos.length}</p></div><CheckCircle className="w-10 h-10 text-green-500" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pendientes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-amber-700 flex items-center gap-2"><Clock className="w-5 h-5" /> Pendientes ({pendientes.length})</h2>
          {pendientes.map(pedido => (
            <Card key={pedido.id_pedido} className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-[#4C3D19]">Pedido #{pedido.id_pedido}</CardTitle>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{getElapsedTime(pedido.hora_registro)}</Badge>
                </div>
                <CardDescription className="text-amber-700">{pedido.mesa} • {formatTime(pedido.hora_registro)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  {pedido.detalles?.map(detalle => (
                    <div key={detalle.id_detalle} className="flex justify-between text-sm">
                      <span className="font-medium text-[#4C3D19]">{detalle.cantidad}x {detalle.nombre_producto}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={() => cambiarEstado(pedido.id_pedido, 'en preparación')}>
                  <ChefHat className="w-4 h-4 mr-2" /> Comenzar Preparación
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* En Preparación */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2"><ChefHat className="w-5 h-5" /> En Preparación ({enPreparacion.length})</h2>
          {enPreparacion.map(pedido => (
            <Card key={pedido.id_pedido} className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-[#4C3D19]">Pedido #{pedido.id_pedido}</CardTitle>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">{getElapsedTime(pedido.hora_registro)}</Badge>
                </div>
                <CardDescription className="text-blue-700">{pedido.mesa} • {formatTime(pedido.hora_registro)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  {pedido.detalles?.map(detalle => (
                    <div key={detalle.id_detalle} className="flex justify-between text-sm">
                      <span className="font-medium text-[#4C3D19]">{detalle.cantidad}x {detalle.nombre_producto}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={() => cambiarEstado(pedido.id_pedido, 'listo')}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Marcar como Listo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Listos para Entregar ({listos.length})</h2>
          {listos.map(pedido => (
            <Card key={pedido.id_pedido} className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-[#4C3D19]">Pedido #{pedido.id_pedido}</CardTitle>
                  {getStatusBadge(pedido.estado)}
                </div>
                <CardDescription className="text-green-700">{pedido.mesa} • {formatTime(pedido.hora_registro)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {pedido.detalles?.map(detalle => (
                    <div key={detalle.id_detalle} className="flex justify-between text-sm">
                      <span className="font-medium text-[#4C3D19]">{detalle.cantidad}x {detalle.nombre_producto}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-3 text-center">Esperando que el mesero lo entregue</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
