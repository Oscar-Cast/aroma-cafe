'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Pedido, Producto, DetallePedido, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Minus, ShoppingCart, Clock, CheckCircle, ChefHat, Package, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PedidosView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedMesa, setSelectedMesa] = useState('')
  const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number }[]>([])
  const [activeTab, setActiveTab] = useState('todos')

  const cargarDatos = async () => {
    try {
      const [pedidosData, productosData] = await Promise.all([api.getPedidos(), api.getProductos()])
      setPedidos(pedidosData)
      setProductos(productosData.filter((p: Producto) => p.disponible === 'activo'))
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito(prev => {
      const existente = prev.find(item => item.producto.id_producto === producto.id_producto)
      if (existente) return prev.map(item => item.producto.id_producto === producto.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item)
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const quitarDelCarrito = (id: number) => {
    setCarrito(prev => {
      const existente = prev.find(item => item.producto.id_producto === id)
      if (existente && existente.cantidad > 1) return prev.map(item => item.producto.id_producto === id ? { ...item, cantidad: item.cantidad - 1 } : item)
      return prev.filter(item => item.producto.id_producto !== id)
    })
  }

  const eliminarDelCarrito = (id: number) => setCarrito(prev => prev.filter(item => item.producto.id_producto !== id))

  const calcularTotal = () => carrito.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0)

  const crearPedido = async () => {
    if (!selectedMesa || carrito.length === 0) {
      toast({ title: 'Error', description: 'Selecciona mesa y productos', variant: 'destructive' })
      return
    }
    try {
      await api.createPedido({
        mesa: selectedMesa,
        productos: carrito.map(item => ({
          id_producto: item.producto.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio,
        })),
      })
      toast({ title: 'Pedido creado' })
      cargarDatos()
      setCarrito([])
      setSelectedMesa('')
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el pedido', variant: 'destructive' })
    }
  }

  const cambiarEstadoPedido = async (id: number, estado: OrderStatus) => {
    try {
      await api.updatePedidoEstado(id, estado)
      toast({ title: 'Estado actualizado' })
      cargarDatos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      'pendiente': 'bg-amber-100 text-amber-700', 'en preparación': 'bg-blue-100 text-blue-700',
      'listo': 'bg-green-100 text-green-700', 'entregado': 'bg-gray-100 text-gray-700'
    }
    return <Badge className={styles[estado]} variant="outline">{estado}</Badge>
  }

  const getStatusIcon = (estado: string) => {
    const icons: Record<string, React.ReactNode> = {
      'pendiente': <Clock className="w-4 h-4" />, 'en preparación': <ChefHat className="w-4 h-4" />,
      'listo': <CheckCircle className="w-4 h-4" />, 'entregado': <Package className="w-4 h-4" />
    }
    return icons[estado]
  }

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const mesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Para llevar', 'Domicilio']
  const categorias = [...new Set(productos.map(p => p.categoria))]
  const filteredPedidos = pedidos.filter(p => activeTab === 'todos' ? true : p.estado === activeTab)

  if (loading) return <div className="text-center py-12">Cargando pedidos...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-[#4C3D19]">Pedidos</h1></div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild><Button className="bg-[#4C3D19]"><Plus className="w-4 h-4 mr-2" />Nuevo Pedido</Button></DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle className="text-[#4C3D19]">Crear Pedido</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2"><Label className="text-[#4C3D19]">Mesa / Destino</Label>
                  <Select value={selectedMesa} onValueChange={setSelectedMesa}>
                    <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona una mesa" /></SelectTrigger>
                    <SelectContent>{mesas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#4C3D19] mb-2 block">Productos</Label>
                  <ScrollArea className="h-[400px] border border-[#CFBB99] rounded-lg p-3">
                    {categorias.map(cat => (
                      <div key={cat} className="mb-4">
                        <h4 className="font-semibold text-[#354024] mb-2">{cat}</h4>
                        {productos.filter(p => p.categoria === cat).map(producto => (
                          <div key={producto.id_producto} className="flex items-center justify-between p-2 rounded-lg bg-[#E5D7C4]/50">
                            <div><p className="font-medium text-sm">{producto.nombre_producto}</p><p className="text-xs text-[#889063]">{formatCurrency(producto.precio)}</p></div>
                            <Button size="sm" variant="outline" onClick={() => agregarAlCarrito(producto)}><Plus className="w-3 h-3" /></Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-[#4C3D19]">Resumen</Label>
                <div className="border border-[#CFBB99] rounded-lg p-4 h-[450px] flex flex-col">
                  <ScrollArea className="flex-1">
                    {carrito.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-[#889063]"><ShoppingCart className="w-12 h-12 mb-2" /><p>Carrito vacío</p></div>
                    ) : (
                      <div className="space-y-3">
                        {carrito.map(item => (
                          <div key={item.producto.id_producto} className="flex items-center justify-between p-3 rounded-lg bg-[#E5D7C4]/50">
                            <div className="flex-1"><p className="font-medium text-sm">{item.producto.nombre_producto}</p><p className="text-xs">{formatCurrency(item.producto.precio)} x {item.cantidad}</p></div>
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => quitarDelCarrito(item.producto.id_producto)}><Minus className="w-3 h-3" /></Button>
                              <span className="w-6 text-center">{item.cantidad}</span>
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => agregarAlCarrito(item.producto)}><Plus className="w-3 h-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => eliminarDelCarrito(item.producto.id_producto)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="border-t pt-3 mt-3 flex justify-between font-bold"><span>Total</span><span>{formatCurrency(calcularTotal())}</span></div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C3D19]" onClick={crearPedido} disabled={carrito.length === 0 || !selectedMesa}>Crear Pedido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#CFBB99]/30">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="en preparación">En preparación</TabsTrigger>
          <TabsTrigger value="listo">Listos</TabsTrigger>
          <TabsTrigger value="entregado">Entregados</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPedidos.map(pedido => (
              <Card key={pedido.id_pedido} className="border-[#CFBB99]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">{getStatusIcon(pedido.estado)} #{pedido.id_pedido}</CardTitle>
                    {getStatusBadge(pedido.estado)}
                  </div>
                  <CardDescription>{pedido.mesa} • {formatTime(pedido.hora_registro)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pedido.detalles?.map(d => (
                      <div key={d.id_detalle} className="flex justify-between text-sm"><span>{d.cantidad}x {d.nombre_producto}</span><span>{formatCurrency(d.subtotal)}</span></div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(pedido.monto_total)}</span></div>
                  {pedido.estado === 'listo' && (user?.rol === 'cajero' || user?.rol === 'mesero' || user?.rol === 'administrador') && (
                    <Button className="w-full mt-2 bg-[#4C3D19]" onClick={() => cambiarEstadoPedido(pedido.id_pedido, 'entregado')}>Entregar</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
