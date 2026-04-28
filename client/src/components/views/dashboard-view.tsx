'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

export function DashboardView() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    ventasHoy: 0,
    pedidosPendientes: 0,
    pedidosEnPreparacion: 0,
    insumosEnAlerta: 0,
    pedidosRecientes: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      const [pedidos, insumos] = await Promise.all([
        api.getPedidos(),
        api.getInsumos()
      ])
      const today = new Date().toISOString().split('T')[0]
      const pedidosHoy = pedidos.filter((p: any) => p.hora_registro.startsWith(today))
      const ventasHoy = pedidosHoy.reduce((sum: number, p: any) => sum + p.monto_total, 0)
      const pendientes = pedidos.filter((p: any) => p.estado === 'pendiente').length
      const enPreparacion = pedidos.filter((p: any) => p.estado === 'en preparación').length
      const insumosBajos = insumos.filter((i: any) => i.existencia_actual <= i.nivel_minimo).length
      setStats({
        ventasHoy,
        pedidosPendientes: pendientes,
        pedidosEnPreparacion: enPreparacion,
        insumosEnAlerta: insumosBajos,
        pedidosRecientes: pedidos.slice(0, 5),
      })
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
      'pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
      'en preparación': 'bg-blue-100 text-blue-700 border-blue-200',
      'listo': 'bg-green-100 text-green-700 border-green-200',
      'entregado': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return <Badge className={styles[estado] || ''} variant="outline">{estado}</Badge>
  }

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando resumen...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4C3D19]">{getGreeting()}, {user?.nombre_usuario}</h1>
        <p className="text-[#889063] mt-1">Aquí tienes un resumen del día</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Ventas del Día</CardTitle>
            <DollarSign className="h-4 w-4 text-[#889063]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">{formatCurrency(stats.ventasHoy)}</div>
            <p className="text-xs text-[#889063]"><TrendingUp className="h-3 w-3 inline mr-1" />Actualizado</p>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Pedidos Pendientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">{stats.pedidosPendientes}</div>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">En Preparación</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">{stats.pedidosEnPreparacion}</div>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Alertas Inventario</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">{stats.insumosEnAlerta}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Pedidos Recientes</CardTitle>
          <CardDescription className="text-[#889063]">Últimos 5 pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.pedidosRecientes.map((pedido: any) => (
              <div key={pedido.id_pedido} className="flex items-center justify-between p-4 rounded-lg bg-[#E5D7C4]/50 border border-[#CFBB99]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#4C3D19] flex items-center justify-center">
                    <span className="text-sm font-bold text-[#E5D7C4]">#{pedido.id_pedido}</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#4C3D19]">{pedido.mesa}</p>
                    <p className="text-sm text-[#889063]">{pedido.detalles?.length || 0} productos • {formatTime(pedido.hora_registro)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-[#4C3D19]">{formatCurrency(pedido.monto_total)}</span>
                  {getStatusBadge(pedido.estado)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
