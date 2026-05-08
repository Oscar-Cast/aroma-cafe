'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Pedido, Producto, OrderStatus } from '@/lib/types'
import { extrasDisponibles } from '@/lib/extras'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Minus, ShoppingCart, Clock, CheckCircle, ChefHat, Package, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/pedidos.css'

const extrasFiltrados = (producto: Producto | null) => {
  if (!producto) return [];
  const cat = producto.categoria.toLowerCase();
  return extrasDisponibles.filter(extra => {
    if (!extra.categoria) return true;
    if (cat.includes('bebida') || cat.includes('cafetería')) return extra.categoria === 'bebidas';
    if (cat.includes('alimento')) return extra.categoria === 'alimentos';
    if (cat.includes('postre')) return extra.categoria === 'bebidas' || extra.categoria === 'alimentos';
    return true;
  });
};

export function PedidosView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMesa, setSelectedMesa] = useState('')
  const [mesas, setMesas] = useState<string[]>([])
  const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number; extrasIds: string[] }[]>([])
  const [notas, setNotas] = useState('')
  const [activeTab, setActiveTab] = useState('todos')

  const [showExtrasPopup, setShowExtrasPopup] = useState(false)
  const [currentProducto, setCurrentProducto] = useState<Producto | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])

  const openExtrasPopup = (producto: Producto) => {
    setCurrentProducto(producto)
    setSelectedExtras([])
    setShowExtrasPopup(true)
  }

  const confirmExtras = () => {
    if (currentProducto) {
      agregarAlCarrito(currentProducto, selectedExtras)
    }
    setShowExtrasPopup(false)
    setCurrentProducto(null)
  }

  const agregarAlCarrito = (producto: Producto, extrasIds: string[]) => {
    setCarrito(prev => [...prev, { producto, cantidad: 1, extrasIds }])
  }

  const quitarDelCarrito = (index: number) => {
    setCarrito(prev => prev.filter((_, i) => i !== index))
  }

  const calcularCostoExtras = (ids: string[]) =>
    ids.reduce((sum, id) => sum + (Number(extrasDisponibles.find(e => e.id === id)?.precio) || 0), 0)

  const totalCarrito = () =>
    carrito.reduce((sum, item) => {
      const precioProducto = Number(item.producto.precio);
      const costoExtras = calcularCostoExtras(item.extrasIds);
      return sum + (precioProducto + costoExtras) * item.cantidad;
    }, 0)

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

  const crearPedido = async () => {
    if (!selectedMesa || carrito.length === 0) {
      toast({ title: 'Error', description: 'Selecciona mesa y productos', variant: 'destructive' })
      return
    }

    try {
      const res = await api.createPedido({
        mesa: selectedMesa,
        productos: carrito.map(item => ({
          id_producto: item.producto.id_producto,
          cantidad: item.cantidad,
          precio_unitario: Number(item.producto.precio) + calcularCostoExtras(item.extrasIds),
          extras: item.extrasIds
        })),
        notas: notas
      })
      toast({ title: `Pedido #${res.numero_pedido ?? res.id_pedido} creado` })
      cargar()
      setCarrito([])
      setSelectedMesa('')
      setNotas('')
      setDialogOpen(false)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el pedido', variant: 'destructive' })
    }
  }

  const cambiarEstado = async (id: number, estado: OrderStatus) => {
    try {
      await api.updatePedidoEstado(id, estado)
      toast({ title: 'Estado actualizado' })
      cargar()
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' })
    }
  }

  const statusBadge = (estado: string) => {
    const map: Record<string, string> = {
      'pendiente': 'badge-warning',
      'en preparación': 'badge-info',
      'listo': 'badge-success',
      'entregado': 'badge-gray'
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

  // Agrupar subpedidos
  const grouped = pedidos.reduce((acc: any, p: any) => {
    const key = p.numero_pedido ?? p.id_pedido;
    if (!acc[key]) {
      acc[key] = { ...p, detalles: [...(p.detalles || [])], estados: new Set([p.estado]) };
    } else {
      acc[key].detalles.push(...(p.detalles || []));
      acc[key].estados.add(p.estado);
      acc[key].monto_total = (parseFloat(acc[key].monto_total) + parseFloat(p.monto_total)).toFixed(2);
    }
    return acc;
  }, {});

  const groupedArray = Object.values(grouped).map((g: any) => ({
    ...g,
    estado: g.estados.has('pendiente') ? 'pendiente' :
            g.estados.has('en preparación') ? 'en preparación' :
            g.estados.has('listo') ? 'listo' :
            g.estados.has('entregado') ? 'entregado' : 'pendiente',
    id_pedido: g.id_pedido,
    numero_pedido: g.numero_pedido,
  }));

  
  const filtered = groupedArray.filter((p: any) => activeTab === 'todos' ? true : p.estado === activeTab);

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando pedidos...</div>

  return (
    <div className="pedidos-page">
      <div className="pedidos-header">
        <h1>Pedidos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ background: 'var(--chocolate)', color: 'white' }}>
              <Plus size={16} style={{ marginRight: '0.5rem' }} /> Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: '64rem' }}>
            <DialogHeader>
              <DialogTitle className="heading-3">Crear Pedido</DialogTitle>
            </DialogHeader>
            <div className="pedidos-dialog-grid">
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <Label className="pedidos-dialog-label">Mesa / Destino</Label>
                  <Select value={selectedMesa} onValueChange={setSelectedMesa}>
                    <SelectTrigger className="pedidos-dialog-select">
                      <SelectValue placeholder="Selecciona una mesa" />
                    </SelectTrigger>
                    <SelectContent>{mesas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <Label className="pedidos-dialog-label">Productos</Label>
                <ScrollArea className="pedidos-dialog-productos">
                  {categorias.map(cat => (
                    <div key={cat} style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--chocolate)', marginBottom: '0.5rem' }}>{cat}</h4>
                      {productos.filter(p => p.categoria === cat).map(prod => (
                        <div key={prod.id_producto} className="pedidos-producto-item">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{prod.nombre_producto}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>{formatCurrency(Number(prod.precio))}</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openExtrasPopup(prod)}><Plus size={16} /></Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div>
                <Label className="pedidos-dialog-label">Resumen</Label>
                <div className="pedidos-dialog-carrito">
                  <ScrollArea style={{ flex: 1 }}>
                    {carrito.length === 0 ? (
                      <div className="pedidos-dialog-carrito-vacio">
                        <ShoppingCart size={48} style={{ marginBottom: '0.5rem' }} />
                        <p>Carrito vacío</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {carrito.map((item, idx) => (
                          <div key={idx} className="pedidos-dialog-carrito-item">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{item.producto.nombre_producto}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>
                                {formatCurrency(Number(item.producto.precio) + calcularCostoExtras(item.extrasIds))} x {item.cantidad}
                              </div>
                              {item.extrasIds.length > 0 && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--caramel)' }}>
                                  {item.extrasIds.map(id => {
                                    const extra = extrasDisponibles.find(e => e.id === id);
                                    return extra ? <span key={id}>+ {extra.nombre} </span> : null;
                                  })}
                                </div>
                              )}
                            </div>
                            <Button size="icon" variant="ghost" style={{ color: '#ef4444' }} onClick={() => quitarDelCarrito(idx)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="pedidos-dialog-total">
                    <span>Total</span><span>{formatCurrency(totalCarrito())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <Label className="pedidos-dialog-label">Notas adicionales</Label>
              <textarea
                className="pedidos-notas-input"
                placeholder="Instrucciones especiales para cocina/barra..."
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={crearPedido} disabled={carrito.length === 0 || !selectedMesa}>
                Crear Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Extras popup */}
      <Dialog open={showExtrasPopup} onOpenChange={setShowExtrasPopup}>
        <DialogContent style={{ maxWidth: '32rem' }}>
          <DialogHeader>
            <DialogTitle className="heading-3">Extras para {currentProducto?.nombre_producto}</DialogTitle>
            <DialogDescription>Selecciona los extras que deseas agregar</DialogDescription>
          </DialogHeader>
          {currentProducto && (
            <div className="extras-popup-container">
              {extrasFiltrados(currentProducto).map(extra => {
                const isSelected = selectedExtras.includes(extra.id)
                return (
                  <button
                    key={extra.id}
                    className={`extras-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedExtras(prev =>
                        isSelected ? prev.filter(id => id !== extra.id) : [...prev, extra.id]
                      )
                    }}
                  >
                    <span className="extra-nombre">{extra.nombre}</span>
                    <span className="extra-precio">
                      {Number(extra.precio) > 0 ? `+ ${formatCurrency(Number(extra.precio))}` : 'Gratis'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtrasPopup(false)}>Cancelar</Button>
            <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={confirmExtras}>
              Agregar al pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs y lista de pedidos */}
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
            {filtered.map((p: any) => (
              <Card key={p.id_pedido} className="pedidos-card">
                <div className="pedidos-card-header">
                  <div className="pedidos-card-title">
                    {statusIcon(p.estado)} Pedido #{p.numero_pedido ?? p.id_pedido}
                  </div>
                  {statusBadge(p.estado)}
                </div>
                <div className="pedidos-card-desc">{p.mesa} • {formatTime(p.hora_registro)}</div>
                <div className="pedidos-card-detalle">
                  {p.detalles?.map((d: any, idx: number) => (
                    <div key={idx}>
                      <div className="pedidos-card-item">
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                        <span>{formatCurrency(d.subtotal)}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--caramel)' }}>
                          {d.extras_ids.map((id: string) => {
                            const extra = extrasDisponibles.find(e => e.id === id);
                            return extra ? (
                              <div key={id} style={{ display: 'flex', gap: '0.5rem' }}>
                                <span>+ {extra.nombre}</span>
                                {extra.precio > 0 && <span>({formatCurrency(extra.precio)})</span>}
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {p.notas && <div className="pedidos-card-notas">📝 {p.notas}</div>}
                <div className="pedidos-card-total">
                  <span>Total</span><span>{formatCurrency(p.monto_total)}</span>
                </div>
                {/* Botón Entregar (visible solo cuando el estado agrupado es "listo") */}
                {p.estado === 'listo' && (user?.rol === 'cajero' || user?.rol === 'mesero' || user?.rol === 'administrador') && (
                  <button
                    className="pedidos-entregar-btn"
                    onClick={() => {
                      console.log('Entregando pedido', p.id_pedido);
                      cambiarEstado(p.id_pedido, 'entregado');
                    }}
                  >
                    Entregar
                  </button>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
