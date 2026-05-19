'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, CreditCard, Banknote, Smartphone, CheckCircle, Clock, Coffee, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/cobros.css'

interface DetalleProducto {
  id_detalle: number
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

const motivosMerma = [
  'Error de captura',
  'Caducidad',
  'Daño en transporte',
  'Daño en almacén',
  'Producto defectuoso',
  'Error de preparación',
  'Devolución de cliente',
  'Otro',
]

export function CobrosView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [cuentasAbiertas, setCuentasAbiertas] = useState<CuentaAbierta[]>([])
  const [cuentasCerradas, setCuentasCerradas] = useState<any[]>([])
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaAbierta | null>(null)
  const [selectedCerrada, setSelectedCerrada] = useState<any | null>(null)
  const [isCobrarDialogOpen, setIsCobrarDialogOpen] = useState(false)
  const [openDetalleCuenta, setOpenDetalleCuenta] = useState(false)
  const [propina, setPropina] = useState(0)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [loading, setLoading] = useState(true)

  // Estados para el diálogo de motivo al eliminar producto
  const [showEliminarDialog, setShowEliminarDialog] = useState(false)
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('Error de preparación')
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('')
  const [cuentaAEliminar, setCuentaAEliminar] = useState<{ cuentaId: number; detalleId: number } | null>(null)

  const cargarDatos = async () => {
    try {
      const abiertas = await api.getCuentasAbiertas()
      setCuentasAbiertas(abiertas.map((c: any) => ({ ...c, subtotal_acumulado: Number(c.subtotal_acumulado) })))
      const todas = await api.getCuentas()
      const cerradas = todas.filter((c: any) => c.estado === 'cerrada')
      cerradas.sort((a: any, b: any) => new Date(b.fecha_cierre).getTime() - new Date(a.fecha_cierre).getTime())
      setCuentasCerradas(cerradas)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las cuentas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const openCobrarDialog = (cuenta: CuentaAbierta) => {
    setSelectedCuenta(cuenta)
    setPropina(0)
    setMetodoPago('efectivo')
    setIsCobrarDialogOpen(true)
  }

  const verDetalleCuenta = async (cuenta: any) => {
    try {
      const cuentasDetalle = await api.getCuentas({ detalle: true })
      const cuentaDetalle = cuentasDetalle.find((c: any) => c.id_cuenta === cuenta.id_cuenta)
      if (cuentaDetalle) {
        setSelectedCerrada(cuentaDetalle)
        setOpenDetalleCuenta(true)
      } else {
        toast({ title: 'Error', description: 'No se pudo obtener el detalle', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al obtener detalle', variant: 'destructive' })
    }
  }

  const handleCobrar = async () => {
    if (!selectedCuenta || !user) return
    try {
      await api.cerrarCuenta(selectedCuenta.id_cuenta, {
        metodo_pago: metodoPago,
        propina: propina > 0 ? propina : undefined,
      })
      toast({
        title: 'Cuenta cobrada',
        description: `${selectedCuenta.numero_mesa} - ${formatCurrency(
          selectedCuenta.subtotal_acumulado + propina
        )}`,
      })
      setIsCobrarDialogOpen(false)
      cargarDatos()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo procesar el cobro', variant: 'destructive' })
    }
  }

  const handleEliminarProducto = (cuentaId: number, detalleId: number) => {
    setCuentaAEliminar({ cuentaId, detalleId })
    setMotivoSeleccionado('Error de preparación')
    setMotivoPersonalizado('')
    setShowEliminarDialog(true)
  }

  const confirmarEliminacion = async () => {
    if (!cuentaAEliminar) return
    const motivoFinal = motivoSeleccionado === 'Otro' ? motivoPersonalizado : motivoSeleccionado
    if (!motivoFinal.trim()) {
      toast({ title: 'Error', description: 'Debes especificar un motivo', variant: 'destructive' })
      return
    }
    try {
      await api.eliminarDetalleCuenta(cuentaAEliminar.cuentaId, cuentaAEliminar.detalleId, {
        motivo: motivoFinal,
      })
      toast({ title: 'Producto eliminado' })
      cargarDatos()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo eliminar', variant: 'destructive' })
    } finally {
      setShowEliminarDialog(false)
      setCuentaAEliminar(null)
    }
  }

  const hoy = new Date().toISOString().split('T')[0]
  const totalCobradoHoy = cuentasCerradas
    .filter(c => c.fecha_cierre?.startsWith(hoy))
    .reduce((sum, c) => sum + Number(c.total || 0), 0)
  const propinasTotales = cuentasCerradas
    .filter(c => c.fecha_cierre?.startsWith(hoy))
    .reduce((sum, c) => sum + Number(c.propina || 0), 0)

  if (loading)
    return (
      <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>
        Cargando cobros...
      </div>
    )

  return (
    <div className="cobros-page">
      <div className="cobros-header">
        <div className="cobros-icon" style={{marginTop: '-40px', height: '75px', width: '75px'}}>
          <Receipt style={{ width: '60px', height: '60px'}}/>
        </div>
        <div>
          <h1 style={{ fontSize: '4rem'}}>Cobros</h1>
          <p style={{fontSize: '2rem', fontWeight: '700', color: 'rgb(114, 92, 63,0.5)'}}>Cierre de cuentas y registro de pagos</p>
        </div>
      </div>

      <div className="cobros-stats-grid">
        <div className="cobros-stat-card amber">
          <div className="cobros-stat-label" style={{fontSize: '1.5rem', fontWeight: '600'}}>Por Cobrar</div>
          <div className="cobros-stat-value" style={{ color: 'rgb(146, 64, 14,0.5)',fontSize: '1.6rem', fontWeight: '800' }}>{cuentasAbiertas.length}</div>
        </div>
        <div className="cobros-stat-card green">
          <div className="cobros-stat-label" style={{fontSize: '1.5rem', fontWeight: '600'}}>Cobrado Hoy</div>
          <div className="cobros-stat-value" style={{ color: 'rgb(22, 101, 52,0.5)',fontSize: '1.6rem', fontWeight: '800' }}>{formatCurrency(totalCobradoHoy)}</div>
        </div>
        <div className="cobros-stat-card blue">
          <div className="cobros-stat-label" style={{fontSize: '1.5rem', fontWeight: '600'}}>Cuentas Cerradas Hoy</div>
          <div className="cobros-stat-value" style={{ color: 'rgb(30, 64, 175,0.5)',fontSize: '1.6rem', fontWeight: '800' }}>
            {cuentasCerradas.filter(c => c.fecha_cierre?.startsWith(hoy)).length}
          </div>
        </div>
        <div className="cobros-stat-card purple">
          <div className="cobros-stat-label" style={{fontSize: '1.5rem', fontWeight: '600'}}>Propinas Hoy</div>
          <div className="cobros-stat-value" style={{ color: 'rgb(126, 34, 206,0.5)',fontSize: '1.6rem', fontWeight: '800' }}>{formatCurrency(propinasTotales)}</div>
        </div>
      </div>

      <Tabs defaultValue="abiertas" style={{}}>
        <TabsList className="cobros-tabs-list" style={{background: 'var(--chocolate, 0.1)', height: '3rem'}}>
          <TabsTrigger value="abiertas" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Cuentas Abiertas</TabsTrigger>
          <TabsTrigger value="historial" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="abiertas" style={{ marginTop: '1rem' }}>
          <div className="cobros-grid">
            {cuentasAbiertas.map(cuenta => (
              <Card key={cuenta.id_cuenta} className="cobros-account-card">
                <div>
                  <div className="cobros-account-title" style={{ fontSize: '1.7rem', fontWeight: '500' }}>
                    {cuenta.numero_mesa}
                  </div>
                  <div className="cobros-account-time" style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63, 0.5)', fontWeight: '700'}}>
                    <Clock size={20} className="inline" /> {formatTime(cuenta.fecha_apertura)} — Cuenta #
                    {cuenta.id_cuenta}
                  </div>
                </div>
                <div className="cobros-account-detail">
                  {cuenta.detalles.map((item, idx) => (
                    <div className="cobros-account-item" key={idx}>
                      <span style={{fontSize: '1.3rem'}}>
                        {item.cantidad}x {item.nombre_producto}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
                        {formatCurrency(item.subtotal)}
                        {user?.rol === 'administrador' && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleEliminarProducto(cuenta.id_cuenta, item.id_detalle)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={25} />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="cobros-account-total" style={{color: 'rgb(114, 92, 63,0.6)'}}>
                  <span style={{fontSize: '1.3rem', fontWeight: '700'}}>Total</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '700' }}>{formatCurrency(cuenta.subtotal_acumulado)}</span>
                </div>
                <button
                  className="cobros-btn-cobrar"
                  onClick={() => openCobrarDialog(cuenta)}
                style={{display: 'inline-flex', fontSize: '1.2rem', alignItems: 'center', gap: '0.5rem'}}>
                  <Receipt size={24} style={{ marginRight: '0.5rem'}} /> Cobrar Cuenta
                </button>
              </Card>
            ))}
            {cuentasAbiertas.length === 0 && (
              <div className="cobros-empty" style={{ gridColumn: '1 / -1' }}>
                <Coffee size={48} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No hay cuentas abiertas</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historial" style={{ marginTop: '1rem' }}>
          {cuentasCerradas.length > 0 ? (
            <Card className="cobros-historial-card">
              <div style={{ padding: '1rem' }}>
                <h2
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 500,
                    color: 'var(--chocolate)',
                  }}
                >
                  Historial de Cobros
                </h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow style={{fontSize: '1.5rem'}}>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Cuenta</TableHead>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Mesa</TableHead>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Subtotal</TableHead>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Propina</TableHead>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Total</TableHead>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Método</TableHead>
                    <TableHead style={{fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentasCerradas.map(c => (
                    <TableRow
                      key={c.id_cuenta}
                      onClick={() => verDetalleCuenta(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell style={{fontSize:'1.3rem', fontWeight: 600}}>#{c.id_cuenta}</TableCell>
                      <TableCell style={{fontSize:'1.3rem', fontWeight: 600}}>{c.numero_mesa}</TableCell>
                      <TableCell style={{fontSize:'1.3rem', fontWeight: 600}}>#{c.id_cuenta}</TableCell>
                      <TableCell style={{fontSize: '1.3rem', fontWeight: 600}}>{c.propina ? formatCurrency(c.propina) : '-'}</TableCell>
                      <TableCell style={{fontSize: '1.3rem', fontWeight: 600 }}>
                        {formatCurrency(c.total)}
                      </TableCell>
                      <TableCell>
                        <span className={`cobros-badge-pago ${c.metodo_pago}`} style={{fontSize: '1.25rem', fontWeight: 500}}>
                          {c.metodo_pago}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontSize: '1.3rem', fontWeight: 600, color: 'rgb(114, 92, 63, 0.6)' }}>
                        {formatDate(c.fecha_cierre)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div
              className="text-center"
              style={{ padding: '2rem', color: 'rgb(114, 92, 63, 0.6)' }}
            >
              No hay cuentas cerradas aún
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo para cobrar */}
      <Dialog open={isCobrarDialogOpen} onOpenChange={setIsCobrarDialogOpen}>
        <DialogContent style={{ maxHeight: '728px' }}>
          <DialogHeader>
            <DialogTitle style={{fontSize: '1.7rem', fontWeight: 600}}>Cobrar Cuenta</DialogTitle>
          </DialogHeader>
          {selectedCuenta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="cobros-dialog-detail">
                <div
                  style={{
                    maxHeight: '12rem',
                    overflowY: 'auto',
                    paddingRight: '0.25rem',
                  }}
                >
                  {selectedCuenta.detalles.map((item, idx) => (
                    <div className="cobros-dialog-item" key={idx}>
                      <span style={{fontSize: '1.2rem', fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>
                        {item.cantidad}x {item.nombre_producto}
                      </span>
                      <span style={{fontSize: '1.2rem', fontWeight: 600, color: 'rgb(114, 92, 63, 0.7)'}}>
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="cobros-dialog-total-row" style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.9)'}}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedCuenta.subtotal_acumulado)}</span>
                </div>
              </div>

              <div>
                <Label style={{fontSize: '1.7rem', fontWeight: 600}}>Propina (opcional)</Label>
                <div className="cobros-propina-row" style={{ marginTop: '0.25rem' }}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={propina}
                    onChange={e => {
                      const val = parseFloat(e.target.value)
                      setPropina(isNaN(val) ? 0 : val)
                    }}
                    className="cobros-propina-input"
                    placeholder="0.00"
                    style={{fontSize: '1.4rem'}}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPropina(
                        Math.round(Number(selectedCuenta.subtotal_acumulado) * 0.1)
                      )
                    }
                    style={{fontSize: '1.4rem', fontWeight: 800, color: 'rgb(114, 92, 63,0.6)'}}
                  >
                    10%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPropina(
                        Math.round(Number(selectedCuenta.subtotal_acumulado) * 0.15)
                      )
                    }
                    style={{fontSize: '1.4rem', fontWeight: 800, color: 'rgb(114, 92, 63,0.6)'}}
                  >
                    15%
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPropina(
                        Math.round(Number(selectedCuenta.subtotal_acumulado) * 0.2)
                      )
                    }
                    style={{fontSize: '1.4rem', fontWeight: 800, color: 'rgb(114, 92, 63,0.6)'}}
                  >
                    20%
                  </Button>
                </div>
              </div>

              <div>
                <Label style={{fontSize: '1.7rem', fontWeight: 600}}>Método de Pago</Label>
                <div className="cobros-payment-grid" style={{ marginTop: '0.25rem' }}>
                  <button
                    className="cobros-payment-btn"
                    style={{
                      background: metodoPago === 'efectivo' ? '#16a34a' : 'transparent',
                      color: metodoPago === 'efectivo' ? 'white' : 'var(--chocolate)',
                      borderColor:
                        metodoPago === 'efectivo' ? '#16a34a' : 'var(--caramel)',
                      fontSize: '1.4rem'
                    }}
                    onClick={() => setMetodoPago('efectivo')}
                  >
                    <Banknote size={30} className="inline" /> Efectivo
                  </button>
                  <button
                    className="cobros-payment-btn"
                    style={{
                      background: metodoPago === 'tarjeta' ? '#2563eb' : 'transparent',
                      color: metodoPago === 'tarjeta' ? 'white' : 'var(--chocolate)',
                      borderColor:
                        metodoPago === 'tarjeta' ? '#2563eb' : 'var(--caramel)',
                      fontSize: '1.4rem'
                    }}
                    onClick={() => setMetodoPago('tarjeta')}
                  >
                    <CreditCard size={30} className="inline" /> Tarjeta
                  </button>
                  <button
                    className="cobros-payment-btn"
                    style={{
                      background:
                        metodoPago === 'transferencia' ? '#7c3aed' : 'transparent',
                      color:
                        metodoPago === 'transferencia' ? 'white' : 'var(--chocolate)',
                      borderColor:
                        metodoPago === 'transferencia' ? '#7c3aed' : 'var(--caramel)',
                      fontSize: '1.4rem'
                    }}
                    onClick={() => setMetodoPago('transferencia')}
                  >
                    <Smartphone size={30} className="inline" /> Transf.
                  </button>
                </div>
              </div>

              <div className="cobros-final-total">
                <span className="label" style={{fontSize: '1.3rem', fontWeight: 600}}>
                  Total a Cobrar
                </span>
                <span className="value" style={{fontSize: '1.3rem', fontWeight: 600}}>
                  {formatCurrency(selectedCuenta.subtotal_acumulado + propina)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCobrarDialogOpen(false)} style={{fontSize: '1.4rem'}}>
              Cancelar
            </Button>
            <Button
              style={{ background: '#16a34a', color: 'white', fontSize: '1.4rem' }}
              onClick={handleCobrar}
            >
              <CheckCircle size={30} style={{ marginRight: '0.5rem'}} /> Confirmar Cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de detalle de cuenta cerrada */}
      <Dialog open={openDetalleCuenta} onOpenChange={setOpenDetalleCuenta}>
        <DialogContent style={{ maxWidth: '32rem' }}>
          <DialogHeader>
            <DialogTitle style={{fontSize: '1.7rem', color: 'var(--chocolate)', fontWeight: 700}}>
              Cuenta #{selectedCerrada?.id_cuenta}
            </DialogTitle>
          </DialogHeader>
          {selectedCerrada && (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)' }}>
                Mesa: {selectedCerrada.numero_mesa}
              </p>
              <p style={{ marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)' }}>
                Método de pago: <Badge style={{backgroundColor: 'rgb(114, 92, 63, 0.2)', color: 'var(--chocolate)', fontSize: '1.2rem', fontWeight: 700}}>{selectedCerrada.metodo_pago}</Badge>
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{fontSize: '1.4rem'}}>Producto</TableHead>
                    <TableHead className="text-right" style={{fontSize: '1.4rem'}}>Cant.</TableHead>
                    <TableHead className="text-right" style={{fontSize: '1.4rem'}}>Precio</TableHead>
                    <TableHead className="text-right" style={{fontSize: '1.4rem'}}>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCerrada.productos?.map((prod: any, idx: number) => (
                    <TableRow key={prod.id_producto + '-' + idx}>
                      <TableCell style={{fontSize: '1.2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)'}}>{prod.nombre_producto}</TableCell>
                      <TableCell className="text-right" style={{fontSize: '1.2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)'}} >{prod.cantidad}</TableCell>
                      <TableCell className="text-right" style={{fontSize: '1.2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)'}}>
                        {formatCurrency(prod.precio_unitario)}
                      </TableCell>
                      <TableCell className="text-right" style={{fontSize: '1.2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)'}}>
                        {formatCurrency(prod.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  color: 'rgb(114, 92, 63, 0.6)',
                }}
              >
                <span>Subtotal</span>
                <span>{formatCurrency(selectedCerrada.subtotal_acumulado)}</span>
              </div>
              {selectedCerrada.propina > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: 'rgb(114, 92, 63, 0.6)',
                  }}
                >
                  <span>Propina</span>
                  <span>{formatCurrency(selectedCerrada.propina)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  fontSize: '1.7rem',
                  fontWeight: 700,
                }}
              >
                <span>Total</span>
                <span>{formatCurrency(selectedCerrada.total)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetalleCuenta(false)} style={{ fontSize: '1.5rem', backgroundColor: 'var(--chocolate, 0.1)', color: 'white' }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para seleccionar motivo de eliminación */}
      <Dialog open={showEliminarDialog} onOpenChange={setShowEliminarDialog}>
        <DialogContent style={{ maxWidth: '30rem' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--chocolate)', fontSize: '1.7rem', fontWeight: 700}}>
              Motivo de eliminación
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Select
              value={motivoSeleccionado}
              onValueChange={v => setMotivoSeleccionado(v)}
            >
              <SelectTrigger style={{ borderColor: 'var(--caramel)' }}>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosMerma.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {motivoSeleccionado === 'Otro' && (
              <Input
                placeholder="Escribe el motivo"
                value={motivoPersonalizado}
                onChange={e => setMotivoPersonalizado(e.target.value)}
                className="input-cafe"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEliminarDialog(false)} style={{ fontSize: '1.4rem', backgroundColor: 'var(--chocolate, 0.1)', color: 'white' }}>
              Cancelar
            </Button>
            <Button
              style={{fontSize: '1.4rem', backgroundColor: 'var(--chocolate)', color: 'white' }}
              onClick={confirmarEliminacion}
            >
              Eliminar producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
