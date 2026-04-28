'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { CierreCaja, Pedido } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, TrendingDown, Clock, FileCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function CajaView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cierres, setCierres] = useState<CierreCaja[]>([])
  const [pedidosHoy, setPedidosHoy] = useState<Pedido[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [egresos, setEgresos] = useState('')
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      const [cierresData, pedidosData] = await Promise.all([
        api.getCierres(),
        api.getPedidos()
      ])
      setCierres(cierresData)
      const today = new Date().toISOString().split('T')[0]
      setPedidosHoy(pedidosData.filter((p: Pedido) => p.hora_registro.startsWith(today)))
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const totalIngresos = pedidosHoy.reduce((sum, p) => sum + p.monto_total, 0)
  const pedidosEntregados = pedidosHoy.filter(p => p.estado === 'entregado').length
  const totalPedidos = pedidosHoy.length

  const realizarCierre = async () => {
    const totalEgresos = parseFloat(egresos) || 0
    try {
      await api.realizarCierre({ total_egresos: totalEgresos })
      toast({ title: 'Cierre de caja realizado', description: `Saldo final: ${formatCurrency(totalIngresos - totalEgresos)}` })
      setIsDialogOpen(false)
      setEgresos('')
      cargarDatos() // recargar para mostrar el nuevo cierre
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo realizar el cierre', variant: 'destructive' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando caja...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Caja</h1>
          <p className="text-[#889063] mt-1">Gestión de caja y cierres del día</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]">
              <FileCheck className="w-4 h-4 mr-2" />
              Realizar Cierre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#4C3D19]">Cierre de Caja</DialogTitle>
              <DialogDescription className="text-[#889063]">
                Registra los egresos del día para calcular el saldo final
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Total Ingresos del Día</span>
                  </div>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(totalIngresos)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Total de Egresos</Label>
                <Input
                  type="number" step="0.01"
                  value={egresos} onChange={(e) => setEgresos(e.target.value)}
                  placeholder="0.00" className="border-[#CFBB99] text-lg"
                />
                <p className="text-sm text-[#889063]">
                  Incluye compras, pagos a proveedores, gastos operativos, etc.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-[#E5D7C4] border border-[#CFBB99]">
                <div className="flex items-center justify-between">
                  <span className="text-[#4C3D19] font-medium">Saldo Proyectado</span>
                  <span className="text-2xl font-bold text-[#4C3D19]">
                    {formatCurrency(totalIngresos - (parseFloat(egresos) || 0))}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={realizarCierre}>
                Confirmar Cierre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Ingresos del Día</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIngresos)}</div>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Pedidos del Día</CardTitle>
            <Clock className="h-4 w-4 text-[#889063]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">{totalPedidos}</div>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Entregados</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">{pedidosEntregados}</div>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#889063]">Ticket Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-[#889063]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#4C3D19]">
              {totalPedidos > 0 ? formatCurrency(totalIngresos / totalPedidos) : '$0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's orders */}
      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Pedidos del Día</CardTitle>
          <CardDescription className="text-[#889063]">Todos los pedidos registrados hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFBB99]">
                <TableHead className="text-[#4C3D19]"># Pedido</TableHead>
                <TableHead className="text-[#4C3D19]">Mesa</TableHead>
                <TableHead className="text-[#4C3D19]">Hora</TableHead>
                <TableHead className="text-[#4C3D19]">Estado</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidosHoy.map(pedido => (
                <TableRow key={pedido.id_pedido} className="border-[#CFBB99]">
                  <TableCell className="font-medium text-[#4C3D19]">#{pedido.id_pedido}</TableCell>
                  <TableCell className="text-[#4C3D19]">{pedido.mesa}</TableCell>
                  <TableCell className="text-[#889063]">
                    {new Date(pedido.hora_registro).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${
                      pedido.estado === 'entregado' ? 'text-green-600' :
                      pedido.estado === 'listo' ? 'text-blue-600' :
                      pedido.estado === 'en preparación' ? 'text-amber-600' : 'text-gray-600'
                    }`}>{pedido.estado}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#4C3D19]">{formatCurrency(pedido.monto_total)}</TableCell>
                </TableRow>
              ))}
              {pedidosHoy.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#889063]">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay pedidos registrados hoy</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Previous closings */}
      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Historial de Cierres</CardTitle>
          <CardDescription className="text-[#889063]">Cierres de caja anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFBB99]">
                <TableHead className="text-[#4C3D19]">Fecha</TableHead>
                <TableHead className="text-[#4C3D19]">Responsable</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Ingresos</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Egresos</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cierres.map(cierre => (
                <TableRow key={cierre.id_cierre} className="border-[#CFBB99]">
                  <TableCell className="text-[#4C3D19]">{formatDate(cierre.fecha_cierre)}</TableCell>
                  <TableCell className="text-[#889063]">{cierre.nombre_usuario}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">{formatCurrency(cierre.total_ingresos)}</TableCell>
                  <TableCell className="text-right text-red-600 font-medium">{formatCurrency(cierre.total_egresos)}</TableCell>
                  <TableCell className="text-right font-bold text-[#4C3D19]">{formatCurrency(cierre.saldo)}</TableCell>
                </TableRow>
              ))}
              {cierres.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#889063]">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay cierres anteriores</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
