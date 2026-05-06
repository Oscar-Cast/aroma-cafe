'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Pedido, Producto, OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Minus, ShoppingCart, Clock, CheckCircle, ChefHat, Package, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/pedidos.css'

export function PedidosView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMesa, setSelectedMesa] = useState('')
  const [mesas, setMesas] = useState<string[]>([])
  const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number }[]>([])
  const [notas, setNotas] = useState('')
  const [activeTab, setActiveTab] = useState('todos')

  const cargar = async () => {
    try {
      const [pedidosData, productosData, mesasData] = await Promise.all([
        api.getPedidos(), api.getProductos(), api.getMesas()
      ])
      setPedidos(pedidosData)
      setProductos(productosData.filter(p => p.disponible === 'activo'))
      setMesas(mesasData.map(m => m.numero_mesa))
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const agregarAlCarrito = (p: Producto) => {
    setCarrito(prev => {
      const exist = prev.find(i => i.producto.id_producto === p.id_producto)
      if (exist) return prev.map(i => i.producto.id_producto === p.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { producto: p, cantidad: 1 }]
    })
  }

  const quitarDelCarrito = (id: number) => {
    setCarrito(prev => {
      const exist = prev.find(i => i.producto.id_producto === id)
      if (exist && exist.cantidad > 1) return prev.map(i => i.producto.id_producto === id ? { ...i, cantidad: i.cantidad - 1 } : i)
      return prev.filter(i => i.producto.id_producto !== id)
    })
  }

  const eliminarDelCarrito = (id: number) => setCarrito(prev => prev.filter(i => i.producto.id_producto !== id))

  const totalCarrito = () => carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0)

  const crearPedido = async () => {
    if (!selectedMesa || carrito.length === 0) {
      toast({ title: 'Error', description: 'Selecciona mesa y productos', variant: 'destructive' })
      return
    }
    try {
      const res = await api.createPedido({
        mesa: selectedMesa,
        productos: carrito.map(i => ({ id_producto: i.producto.id_producto, cantidad: i.cantidad, precio_unitario: i.producto.precio })),
        notas
      })
      toast({ title: `Pedido #${res.numero_pedido ?? res.id_pedido} creado` })
      cargar()
      setCarrito([]); setSelectedMesa(''); setNotas(''); setDialogOpen(false)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el pedido', variant: 'destructive' })
    }
  }

  const cambiarEstado = async (id: number, estado: OrderStatus) => {
    try {
      await api.updatePedidoEstado(id, estado)
      toast({ title: 'Estado actualizado' })
      cargar()
    } catch { toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' }) }
  }

  const statusBadge = (estado: string) => {
    const map: Record<string, string> = {
      'pendiente': 'bg-amber-100 text-amber-700',
      'en preparación': 'bg-blue-100 text-blue-700',
      'listo': 'bg-green-100 text-green-700',
      'entregado': 'bg-gray-100 text-gray-700'
    }
    return <Badge className={map[estado] || ''} variant="outline">{estado}</Badge>
  }

  const statusIcon = (estado: string) => {
    const icons: Record<string, React.ReactNode> = {
      'pendiente': <Clock size={16} />,
      'en preparación': <ChefHat size={16} />,
      'listo': <CheckCircle size={16} />,
      'entregado': <Package size={16} />
    }
    return icons[estado]
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)

  const categorias = [...new Set(productos.map(p => p.categoria))]
  const filtered = pedidos.filter(p => activeTab === 'todos' ? true : p.estado === activeTab)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando pedidos...</div>

  return (
    <div className="pedidos-page">
      <div className="pedidos-header">
        <h1>Pedidos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ background: 'var(--chocolate)', color: 'white' }}><Plus size={16} style={{ marginRight: '0.5rem' }} />Nuevo Pedido</Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: '56rem' }}>
            <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)' }}>Crear Pedido</DialogTitle></DialogHeader>
            <div className="pedidos-dialog-grid">
              <div>
                <Label className="pedidos-dialog-label">Mesa / Destino</Label>
                <Select value={selectedMesa} onValueChange={setSelectedMesa}>
                  <SelectTrigger className="pedidos-dialog-select"><SelectValue placeholder="Selecciona una mesa" /></SelectTrigger>
                  <SelectContent>{mesas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Label className="pedidos-dialog-label" style={{ marginTop: '1rem' }}>Productos</Label>
                <div className="pedidos-dialog-productos">
                  {categorias.map(cat => (
                    <div key={cat} style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--chocolate)', marginBottom: '0.5rem' }}>{cat}</h4>
                      {productos.filter(p => p.categoria === cat).map(p => (
                        <div key={p.id_producto} className="pedidos-producto-item">
                          <div><p style={{ fontWeight: 500 }}>{p.nombre_producto}</p><p style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>{formatCurrency(p.precio)}</p></div>
                          <Button size="sm" variant="outline" onClick={() => agregarAlCarrito(p)}><Plus size={12} /></Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="pedidos-dialog-label">Resumen</Label>
                <div className="pedidos-dialog-carrito">
                  <ScrollArea style={{ flex: 1 }}>
                    {carrito.length === 0 ? (
                      <div className="pedidos-dialog-carrito-vacio"><ShoppingCart size={48} style={{ marginBottom: '0.5rem' }} /><p>Carrito vacío</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {carrito.map(i => (
                          <div key={i.producto.id_producto} className="pedidos-dialog-carrito-item">
                            <div style={{ flex: 1 }}><p style={{ fontWeight: 500 }}>{i.producto.nombre_producto}</p><p style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>{formatCurrency(i.producto.precio)} x {i.cantidad}</p></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Button size="icon" variant="outline" onClick={() => quitarDelCarrito(i.producto.id_producto)}><Minus size={12} /></Button>
                              <span style={{ width: '1.5rem', textAlign: 'center' }}>{i.cantidad}</span>
                              <Button size="icon" variant="outline" onClick={() => agregarAlCarrito(i.producto)}><Plus size={12} /></Button>
                              <Button size="icon" variant="ghost" style={{ color: '#ef4444' }} onClick={() => eliminarDelCarrito(i.producto.id_producto)}><Trash2 size={12} /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="pedidos-dialog-total"><span>Total</span><span>{formatCurrency(totalCarrito())}</span></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Label className="pedidos-dialog-label">Notas / Modificaciones</Label>
              <textarea className="pedidos-notas-input" placeholder="Ej: Leche deslactosada, sin azúcar..." value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={crearPedido} disabled={carrito.length === 0 || !selectedMesa}>Crear Pedido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="pedidos-tabs">
        <TabsList className="pedidos-tabs-list">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="en preparación">En preparación</TabsTrigger>
          <TabsTrigger value="listo">Listos</TabsTrigger>
          <TabsTrigger value="entregado">Entregados</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} style={{ marginTop: '1rem' }}>
          <div className="pedidos-grid">
            {filtered.map(p => (
              <Card key={p.id_pedido} className="pedidos-card">
                <div className="pedidos-card-header">
                  <div className="pedidos-card-title">{statusIcon(p.estado)} Pedido #{p.numero_pedido ?? p.id_pedido}</div>
                  {statusBadge(p.estado)}
                </div>
                <div className="pedidos-card-desc">{p.mesa} • {formatTime(p.hora_registro)}</div>
                <div className="pedidos-card-detalle">
                  {p.detalles?.map(d => (
                    <div className="pedidos-card-item" key={d.id_detalle}><span>{d.cantidad}x {d.nombre_producto}</span><span>{formatCurrency(d.subtotal)}</span></div>
                  ))}
                </div>
                {p.notas && <div className="pedidos-card-notas">📝 {p.notas}</div>}
                <div className="pedidos-card-total"><span>Total</span><span>{formatCurrency(p.monto_total)}</span></div>
                {p.estado === 'listo' && (user?.rol === 'cajero' || user?.rol === 'mesero' || user?.rol === 'administrador') && (
                  <button className="pedidos-entregar-btn" onClick={() => cambiarEstado(p.id_pedido, 'entregado')}>Entregar</button>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
