'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Receipt, CreditCard, Banknote, Smartphone, CheckCircle, Clock, Coffee } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DetalleProducto {
  cantidad: number
  nombre_producto: string
  precio_unitario: number
  subtotal: number
}

interface CuentaAbierta {
  id_cuenta: number
  numero_mesa: string
  subtotal_acumulado: number
  fecha_apertura: string
  detalles: DetalleProducto[]
}

export function CobrosView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cuentasAbiertas, setCuentasAbiertas] = useState<CuentaAbierta[]>([])
  const [cuentasCerradas, setCuentasCerradas] = useState<any[]>([])
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaAbierta | null>(null)
  const [isCobrarDialogOpen, setIsCobrarDialogOpen] = useState(false)
  const [propina, setPropina] = useState(0)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      const abiertas = await api.getCuentasAbiertas()
      setCuentasAbiertas(abiertas)
      setCuentasCerradas([])
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las cuentas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const openCobrarDialog = (cuenta: CuentaAbierta) => {
    setSelectedCuenta(cuenta)
    setPropina(0)
    setMetodoPago('efectivo')
    setIsCobrarDialogOpen(true)
  }

  const handleCobrar = async () => {
    if (!selectedCuenta) return
    try {
      await api.cerrarCuenta(selectedCuenta.id_cuenta, {
        metodo_pago: metodoPago,
        propina: propina > 0 ? propina : undefined
      })
      toast({ title: 'Cuenta cobrada', description: `${selectedCuenta.numero_mesa} - ${formatCurrency(selectedCuenta.subtotal_acumulado + propina)}` })
      setIsCobrarDialogOpen(false)
      cargarDatos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo procesar el cobro', variant: 'destructive' })
    }
  }

  const getMetodoPagoIcon = (metodo: string) => {
    const icons: any = { efectivo: <Banknote className="w-4 h-4" />, tarjeta: <CreditCard className="w-4 h-4" />, transferencia: <Smartphone className="w-4 h-4" /> }
    return icons[metodo] || null
  }

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando cuentas...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#4C3D19] rounded-full flex items-center justify-center">
          <Receipt className="w-6 h-6 text-[#E5D7C4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Cobros</h1>
          <p className="text-[#889063]">Cuentas activas y cierre de mesas</p>
        </div>
      </div>

      <Tabs defaultValue="abiertas">
        <TabsList className="bg-[#CFBB99]/30">
          <TabsTrigger value="abiertas" className="data-[state=active]:bg-[#4C3D19] data-[state=active]:text-[#E5D7C4]">
            Cuentas Abiertas ({cuentasAbiertas.length})
          </TabsTrigger>
          <TabsTrigger value="historial" className="data-[state=active]:bg-[#4C3D19] data-[state=active]:text-[#E5D7C4]">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abiertas" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cuentasAbiertas.map(cuenta => (
              <Card key={cuenta.id_cuenta} className="border-[#CFBB99]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-[#4C3D19]">{cuenta.numero_mesa}</CardTitle>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">
                      <Clock className="w-3 h-3 mr-1" />{formatTime(cuenta.fecha_apertura)}
                    </Badge>
                  </div>
                  <CardDescription className="text-[#889063]">
                    Cuenta #{cuenta.id_cuenta}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Detalle de productos consumidos */}
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {cuenta.detalles.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-[#4C3D19]">{item.cantidad}x {item.nombre_producto}</span>
                          <span className="text-[#889063]">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="flex justify-between items-center pt-2 border-t border-[#CFBB99]">
                    <span className="text-[#889063]">Total acumulado:</span>
                    <span className="text-xl font-bold text-[#4C3D19]">{formatCurrency(cuenta.subtotal_acumulado)}</span>
                  </div>
                  <Button 
                    className="w-full bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]"
                    onClick={() => openCobrarDialog(cuenta)}
                  >
                    <Receipt className="w-4 h-4 mr-2" /> Cobrar Cuenta
                  </Button>
                </CardContent>
              </Card>
            ))}
            {cuentasAbiertas.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#889063]">
                <Coffee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay cuentas abiertas</p>
                <p className="text-sm">Crea pedidos para abrir cuentas</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <div className="text-center py-8 text-[#889063]">
            Historial no implementado aún (se puede añadir después consultando cuentas cerradas).
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de cobro */}
      <Dialog open={isCobrarDialogOpen} onOpenChange={setIsCobrarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Cobrar Cuenta</DialogTitle>
            <DialogDescription className="text-[#889063]">
              {selectedCuenta?.numero_mesa} - Cuenta #{selectedCuenta?.id_cuenta}
            </DialogDescription>
          </DialogHeader>
          {selectedCuenta && (
            <div className="space-y-4">
              {/* Detalle completo en el diálogo */}
              <div className="bg-[#E5D7C4]/50 rounded-lg p-3">
                <ScrollArea className="h-28">
                  {selectedCuenta.detalles.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-1">
                      <span>{item.cantidad}x {item.nombre_producto}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </ScrollArea>
                <div className="border-t border-[#CFBB99] mt-2 pt-2 flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedCuenta.subtotal_acumulado)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Propina (opcional)</Label>
                <div className="flex gap-2">
                  <Input type="number" min={0} step={5} value={propina} onChange={(e) => setPropina(parseFloat(e.target.value) || 0)} className="border-[#CFBB99]" placeholder="0.00" />
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(selectedCuenta.subtotal_acumulado * 0.10))} className="border-[#CFBB99] text-[#4C3D19]">10%</Button>
                    <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(selectedCuenta.subtotal_acumulado * 0.15))} className="border-[#CFBB99] text-[#4C3D19]">15%</Button>
                    <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(selectedCuenta.subtotal_acumulado * 0.20))} className="border-[#CFBB99] text-[#4C3D19]">20%</Button>
                  </div>
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
                <div className="flex justify-between items-center text-[#E5D7C4]">
                  <span className="text-lg">Total a Cobrar</span>
                  <span className="text-3xl font-bold">{formatCurrency(selectedCuenta.subtotal_acumulado + propina)}</span>
                </div>
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
