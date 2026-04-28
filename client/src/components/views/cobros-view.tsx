'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Pedido, Cuenta } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, CreditCard, Banknote, Smartphone, CheckCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Datos mock locales para cuentas (sustituir cuando haya endpoints)
const mockCuentas: Cuenta[] = [
  { id_cuenta: 1, id_pedido: 4, mesa: 'Mesa 5', subtotal: 143.00, propina: 20.00, total: 163.00, metodo_pago: 'tarjeta', pagado: true, fecha_cierre: new Date(Date.now() - 1500000).toISOString(), id_cajero: 2, nombre_cajero: 'cajero' },
]

export function CobrosView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pedidosPorCobrar, setPedidosPorCobrar] = useState<Pedido[]>([])
  const [cuentasCerradas, setCuentasCerradas] = useState<Cuenta[]>(mockCuentas)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [isCobrarDialogOpen, setIsCobrarDialogOpen] = useState(false)
  const [propina, setPropina] = useState(0)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [loading, setLoading] = useState(true)

  // Obtener pedidos entregados que aún no tienen cuenta
  const cargarPedidos = async () => {
    try {
      const pedidos = await api.getPedidos()
      const cuentasIds = cuentasCerradas.map(c => c.id_pedido)
      setPedidosPorCobrar(pedidos.filter((p: Pedido) => p.estado === 'entregado' && !cuentasIds.includes(p.id_pedido)))
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los pedidos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPedidos()
  }, [cuentasCerradas]) // recargar al cambiar cuentas

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const openCobrarDialog = (pedido: Pedido) => {
    setSelectedPedido(pedido)
    setPropina(0)
    setMetodoPago('efectivo')
    setIsCobrarDialogOpen(true)
  }

  const handleCobrar = () => {
    if (!selectedPedido || !user) return
    const total = selectedPedido.monto_total + propina
    const nuevaCuenta: Cuenta = {
      id_cuenta: Math.max(...cuentasCerradas.map(c => c.id_cuenta), 0) + 1,
      id_pedido: selectedPedido.id_pedido,
      mesa: selectedPedido.mesa,
      subtotal: selectedPedido.monto_total,
      propina: propina > 0 ? propina : undefined,
      total,
      metodo_pago: metodoPago,
      pagado: true,
      fecha_cierre: new Date().toISOString(),
      id_cajero: user.id,
      nombre_cajero: user.nombre_usuario
    }
    setCuentasCerradas(prev => [nuevaCuenta, ...prev])
    toast({ title: 'Cuenta cerrada', description: `${selectedPedido.mesa} - ${formatCurrency(total)} cobrado correctamente` })
    setIsCobrarDialogOpen(false)
    setSelectedPedido(null)
  }

  const getMetodoPagoIcon = (metodo: Cuenta['metodo_pago']) => {
    const icons = { efectivo: <Banknote className="w-4 h-4" />, tarjeta: <CreditCard className="w-4 h-4" />, transferencia: <Smartphone className="w-4 h-4" /> }
    return icons[metodo]
  }

  const getMetodoPagoBadge = (metodo: Cuenta['metodo_pago']) => {
    const styles = { efectivo: 'bg-green-100 text-green-700 border-green-200', tarjeta: 'bg-blue-100 text-blue-700 border-blue-200', transferencia: 'bg-purple-100 text-purple-700 border-purple-200' }
    return <Badge className={styles[metodo]} variant="outline">{getMetodoPagoIcon(metodo)} <span className="ml-1 capitalize">{metodo}</span></Badge>
  }

  const totalCobradoHoy = cuentasCerradas
    .filter(c => c.fecha_cierre?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, c) => sum + c.total, 0)

  const propinasTotales = cuentasCerradas
    .filter(c => c.fecha_cierre?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, c) => sum + (c.propina || 0), 0)

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando cobros...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#4C3D19] rounded-full flex items-center justify-center">
          <Receipt className="w-6 h-6 text-[#E5D7C4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Cobros</h1>
          <p className="text-[#889063]">Cierre de cuentas y registro de pagos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-amber-700">Por Cobrar</p><p className="text-3xl font-bold text-amber-800">{pedidosPorCobrar.length}</p></div>
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-green-700">Cobrado Hoy</p><p className="text-2xl font-bold text-green-800">{formatCurrency(totalCobradoHoy)}</p></div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-blue-700">Cuentas Cerradas Hoy</p><p className="text-3xl font-bold text-blue-800">{cuentasCerradas.filter(c => c.fecha_cierre?.startsWith(new Date().toISOString().split('T')[0])).length}</p></div>
              <Receipt className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-purple-700">Propinas Hoy</p><p className="text-2xl font-bold text-purple-800">{formatCurrency(propinasTotales)}</p></div>
              <Banknote className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="por-cobrar">
        <TabsList className="bg-[#CFBB99]/30">
          <TabsTrigger value="por-cobrar" className="data-[state=active]:bg-[#4C3D19] data-[state=active]:text-[#E5D7C4]">
            Por Cobrar ({pedidosPorCobrar.length})
          </TabsTrigger>
          <TabsTrigger value="cerradas" className="data-[state=active]:bg-[#4C3D19] data-[state=active]:text-[#E5D7C4]">
            Cuentas Cerradas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="por-cobrar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosPorCobrar.map(pedido => (
              <Card key={pedido.id_pedido} className="border-[#CFBB99]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-[#4C3D19]">{pedido.mesa}</CardTitle>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">Pedido #{pedido.id_pedido}</Badge>
                  </div>
                  <CardDescription className="text-[#889063]">Entregado: {formatTime(pedido.hora_entrega || pedido.hora_registro)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {pedido.detalles?.map(detalle => (
                      <div key={detalle.id_detalle} className="flex justify-between text-sm">
                        <span className="text-[#4C3D19]">{detalle.cantidad}x {detalle.nombre_producto}</span>
                        <span className="text-[#889063]">{formatCurrency(detalle.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#CFBB99] pt-3">
                    <div className="flex justify-between font-bold text-lg text-[#4C3D19]"><span>Total</span><span>{formatCurrency(pedido.monto_total)}</span></div>
                  </div>
                  <Button className="w-full bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={() => openCobrarDialog(pedido)}>
                    <Receipt className="w-4 h-4 mr-2" /> Cobrar Cuenta
                  </Button>
                </CardContent>
              </Card>
            ))}
            {pedidosPorCobrar.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#889063]">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay cuentas pendientes de cobro</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cerradas" className="mt-4">
          <Card className="border-[#CFBB99]">
            <CardHeader>
              <CardTitle className="text-[#4C3D19]">Historial de Cobros</CardTitle>
              <CardDescription className="text-[#889063]">Cuentas cerradas del día</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#CFBB99]">
                    <TableHead className="text-[#4C3D19]">Cuenta</TableHead>
                    <TableHead className="text-[#4C3D19]">Mesa</TableHead>
                    <TableHead className="text-[#4C3D19]">Subtotal</TableHead>
                    <TableHead className="text-[#4C3D19]">Propina</TableHead>
                    <TableHead className="text-[#4C3D19]">Total</TableHead>
                    <TableHead className="text-[#4C3D19]">Método</TableHead>
                    <TableHead className="text-[#4C3D19]">Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentasCerradas.map(cuenta => (
                    <TableRow key={cuenta.id_cuenta} className="border-[#CFBB99]/50">
                      <TableCell className="font-medium text-[#4C3D19]">#{cuenta.id_cuenta}</TableCell>
                      <TableCell className="text-[#889063]">{cuenta.mesa}</TableCell>
                      <TableCell className="text-[#889063]">{formatCurrency(cuenta.subtotal)}</TableCell>
                      <TableCell className="text-[#889063]">{cuenta.propina ? formatCurrency(cuenta.propina) : '-'}</TableCell>
                      <TableCell className="font-semibold text-[#4C3D19]">{formatCurrency(cuenta.total)}</TableCell>
                      <TableCell>{getMetodoPagoBadge(cuenta.metodo_pago)}</TableCell>
                      <TableCell className="text-[#889063]">{cuenta.fecha_cierre && formatDate(cuenta.fecha_cierre)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cobrar Dialog */}
      <Dialog open={isCobrarDialogOpen} onOpenChange={setIsCobrarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Cerrar Cuenta</DialogTitle>
            <DialogDescription className="text-[#889063]">
              {selectedPedido?.mesa} - Pedido #{selectedPedido?.id_pedido}
            </DialogDescription>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-4">
              <div className="bg-[#E5D7C4]/50 rounded-lg p-4 space-y-2">
                {selectedPedido.detalles?.map(detalle => (
                  <div key={detalle.id_detalle} className="flex justify-between text-sm">
                    <span className="text-[#4C3D19]">{detalle.cantidad}x {detalle.nombre_producto}</span>
                    <span className="text-[#889063]">{formatCurrency(detalle.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t border-[#CFBB99] pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-[#4C3D19]"><span>Subtotal</span><span>{formatCurrency(selectedPedido.monto_total)}</span></div>
                </div>
              </div>
              {/* Propina y método de pago (sin cambios) */}
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Propina (opcional)</Label>
                <div className="flex gap-2">
                  <Input type="number" min={0} step={5} value={propina} onChange={(e) => setPropina(parseFloat(e.target.value) || 0)} className="border-[#CFBB99]" placeholder="0.00" />
                  <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(selectedPedido.monto_total * 0.10))} className="border-[#CFBB99] text-[#4C3D19]">10%</Button>
                  <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(selectedPedido.monto_total * 0.15))} className="border-[#CFBB99] text-[#4C3D19]">15%</Button>
                  <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(selectedPedido.monto_total * 0.20))} className="border-[#CFBB99] text-[#4C3D19]">20%</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Método de Pago</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={metodoPago === 'efectivo' ? 'default' : 'outline'} className={metodoPago === 'efectivo' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-[#CFBB99] text-[#4C3D19]'} onClick={() => setMetodoPago('efectivo')}><Banknote className="w-4 h-4 mr-2" />Efectivo</Button>
                  <Button variant={metodoPago === 'tarjeta' ? 'default' : 'outline'} className={metodoPago === 'tarjeta' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-[#CFBB99] text-[#4C3D19]'} onClick={() => setMetodoPago('tarjeta')}><CreditCard className="w-4 h-4 mr-2" />Tarjeta</Button>
                  <Button variant={metodoPago === 'transferencia' ? 'default' : 'outline'} className={metodoPago === 'transferencia' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-[#CFBB99] text-[#4C3D19]'} onClick={() => setMetodoPago('transferencia')}><Smartphone className="w-4 h-4 mr-2" />Transf.</Button>
                </div>
              </div>
              <div className="bg-[#4C3D19] rounded-lg p-4">
                <div className="flex justify-between items-center text-[#E5D7C4]"><span className="text-lg">Total a Cobrar</span><span className="text-3xl font-bold">{formatCurrency(selectedPedido.monto_total + propina)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCobrarDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCobrar}><CheckCircle className="w-4 h-4 mr-2" />Confirmar Cobro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
