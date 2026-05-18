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
import { Plus, Minus, ShoppingCart, Clock, CheckCircle, ChefHat, Package, Trash2, Weight } from 'lucide-react'
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
    carrito.reduce((sum: number, item) => {
      const precioProducto: number = Number(item.producto.precio);
      const costoExtras: number = calcularCostoExtras(item.extrasIds);
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
    return <Badge className={map[estado] || ''} variant="outline" style={{ fontSize: '1rem'}}>{estado}</Badge>
  }

  const statusIcon = (estado: string) => {
    const icons: Record<string, React.ReactNode> = {
      'pendiente': <Clock size={20} />,
      'en preparación': <ChefHat size={20} />,
      'listo': <CheckCircle size={20} />,
      'entregado': <Package size={20} />
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
            <Button style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.2rem' }} >
              <Plus style={{height: '25', width: '25'}}/> Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent style={{ maxWidth: '64rem' }}>
            <DialogHeader>
              <DialogTitle className="heading-3" style={{ fontSize: '1.9rem', fontWeight: 500, color: 'var(--chocolate)' }}>
                Crear Pedido
              </DialogTitle>
            </DialogHeader>
            <div className="pedidos-dialog-grid">
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <Label className="pedidos-dialog-label" style={{fontSize: '1.3rem', fontWeight: 800, color: 'rgb(114, 92, 63, 0.5)' }}>
                    Mesa / Destino
                  </Label>
                  <Select value={selectedMesa} onValueChange={setSelectedMesa}>
                    <SelectTrigger className="pedidos-dialog-select" style={{fontSize: '1.2rem', fontWeight: 700, background: 'rgb(114,92,63,0.9)', color: 'white' }}>
                      <SelectValue placeholder="Selecciona una mesa" />
                    </SelectTrigger>
                    <SelectContent>{mesas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <Label className="pedidos-dialog-label" style={{fontSize: '1.7rem', fontWeight: 500, color: 'var(--chocolate)' }}>
                  Productos
                </Label>
                <ScrollArea className="pedidos-dialog-productos">
                  {categorias.map(cat => (
                    <div key={cat} style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontWeight: 600, color: 'var(--chocolate)', marginBottom: '0.5rem' }}>{cat}</h4>
                      {productos.filter(p => p.categoria === cat).map(prod => (
                        <div key={prod.id_producto} className="pedidos-producto-item">
                          <div style={{ flex: 1 }}>
                            <div style={{fontSize: '1.30rem', fontWeight: 500 }}>{prod.nombre_producto}</div>
                            <div style={{fontWeight: 900, fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.5)' }}>{formatCurrency(Number(prod.precio))}</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openExtrasPopup(prod)}><Plus size={20} /></Button>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div>
                <Label className="pedidos-dialog-label" style={{fontSize: '1.7rem', fontWeight: 500, color: 'var(--chocolate)' }}>
                  Resumen
                </Label>
                <div className="pedidos-dialog-carrito" style={{ display: 'flex', flexDirection: 'column', height: '200px' }}>
                  <ScrollArea style={{ flex: 1 }}>
                    <div style={{ padding: '0.75rem' }}>
                      {carrito.length === 0 ? (
                        <div className="pedidos-dialog-carrito-vacio">
                          <ShoppingCart size={60} style={{ marginBottom: '0.5rem' }} />
                          <p>Carrito vacío</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {carrito.map((item, idx) => (
                            <div key={idx} className="pedidos-dialog-carrito-item">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '1.3rem', color: 'rgb(114, 92, 63)' }}>{item.producto.nombre_producto}</div>
                                <div style={{fontWeight: 900, fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.5)' }}>
                                  {formatCurrency(Number(item.producto.precio) + calcularCostoExtras(item.extrasIds))} x {item.cantidad}
                                </div>
                                {item.extrasIds.length > 0 && (
                                  <div style={{fontWeight: 700, fontSize: '1rem', color: 'rgb(114, 92, 63, 0.5)' }}>
                                    {item.extrasIds.map(id => {
                                      const extra = extrasDisponibles.find(e => e.id === id);
                                      return extra ? <span key={id}>+ {extra.nombre} </span> : null;
                                    })}
                                  </div>
                                )}
                              </div>
                              <Button style={{ color: '#ef4444', backgroundColor: 'var(--lemon)'}} onClick={() => quitarDelCarrito(idx)}>
                                <Trash2 style={{height: '40', width: '35'}}/>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="pedidos-dialog-total" style={{ padding: '1rem', borderTop: '1px solid #dfcfbc', fontSize: '1.4rem' }}>
                    <span>Total</span>
                    <span>{formatCurrency(totalCarrito())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem'}}>
              <Label className="pedidos-dialog-label" style={{fontSize: '1.8rem', fontWeight: 500, color: 'var(--chocolate)' }}>
                Notas adicionales
              </Label>
              <textarea
                className="pedidos-notas-input"
                placeholder="Instrucciones especiales para cocina/barra..."
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2} style={{height: '120px', fontSize: '1.7rem', fontWeight: 400 }}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false) } style={{ fontSize: '1.2rem', background: 'rgb(114, 92, 63)', color: 'white' }}>
                Cancelar
              </Button>
              <Button style={{fontSize: '1.2rem', background: 'rgb(114, 92, 63)', color: 'white' }} onClick={crearPedido} disabled={carrito.length === 0 || !selectedMesa}>
                Crear Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
          {/* fin del scrollarea */}
        </Dialog>
      </div>

      {/* Extras popup */}
      <Dialog open={showExtrasPopup} onOpenChange={setShowExtrasPopup}>
        <DialogContent style={{ maxWidth: '32rem' }}>
          <DialogHeader>
            <DialogTitle className="heading-3" style={{fontSize: '1.8rem', fontWeight: '700'}}>Extras para {currentProducto?.nombre_producto}</DialogTitle>
            <DialogDescription style={{fontSize: '1.3rem', fontWeight: '600', color: 'rgb(114, 92, 63, 0.5)'}}>Selecciona los extras que deseas agregar</DialogDescription>
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
                    <span className="extra-nombre" style={{fontSize: '1.3rem'}}>{extra.nombre}</span>
                    <span className="extra-precio" style={{fontSize: '1.1rem', fontWeight: '800', color: 'rgb(114, 92, 63, 0.5)'}}>
                      {Number(extra.precio) > 0 ? `+ ${formatCurrency(Number(extra.precio))}` : 'Gratis'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtrasPopup(false)} style={{ fontSize: '1.2rem', background: 'rgb(114, 92, 63)', color: 'white' }}>
              Cancelar
            </Button>
            <Button style={{fontSize: '1.2rem', background: 'rgb(114, 92, 63)', color: 'white' }} onClick={confirmExtras}>
              Agregar al pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs y lista de pedidos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="pedidos-tabs">
        <TabsList className="pedidos-tabs-list" style={{background: 'var(--chocolate, 0.1)', height: '3rem'}} >
          <TabsTrigger value="todos" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Todos</TabsTrigger>
          <TabsTrigger value="pendiente" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Pendientes</TabsTrigger>
          <TabsTrigger value="en preparación" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>En preparación</TabsTrigger>
          <TabsTrigger value="listo" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Listos</TabsTrigger>
          <TabsTrigger value="entregado" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Entregados</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} style={{ marginTop: '1rem' }}>
          <div className="pedidos-grid">
            {filtered.map((p: any) => (
              <Card key={p.id_pedido} className="pedidos-card">
                <div className="pedidos-card-header">
                  <div className="pedidos-card-title" style={{fontSize: '1.8rem', fontWeight: 600, color: 'var(--chocolate)' }}>
                    {statusIcon(p.estado)} Pedido #{p.numero_pedido ?? p.id_pedido}
                  </div>
                  {statusBadge(p.estado)}
                </div>
                <div className="pedidos-card-desc" style={{fontWeight: '700', fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.4)' }}>
                  {p.mesa} • {formatTime(p.hora_registro)}
                </div>
                <div className="pedidos-card-detalle">
                  {p.detalles?.map((d: any, idx: number) => (
                    <div key={idx}>
                      <div className="pedidos-card-item" style={{fontSize: '1.15rem', fontWeight: '600', color: 'rgb(114, 92, 63)' }}>
                        <span>{d.cantidad}x {d.nombre_producto}</span>
                        <span>{formatCurrency(d.subtotal)}</span>
                      </div>
                      {d.extras_ids && d.extras_ids.length > 0 && (
                        <div style={{fontWeight: '900', paddingLeft: '1.25rem', fontSize: '1rem', color: 'rgb(114, 92, 63, 0.5)' }}>
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
                {p.notas && <div className="pedidos-card-notas"> {p.notas}</div>}
                <div className="pedidos-card-total"style ={{fontSize: '1.25rem', fontWeight: '700', color: 'var(--chocolate)' }}>
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
