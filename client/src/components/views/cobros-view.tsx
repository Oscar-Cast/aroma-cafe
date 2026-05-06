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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Receipt, CreditCard, Banknote, Smartphone, CheckCircle, Clock, Coffee } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/cobros.css'

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
      // Convertir subtotal_acumulado a número
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const openCobrarDialog = (cuenta: CuentaAbierta) => {
    setSelectedCuenta(cuenta)
    setPropina(0)          // reiniciar propina
    setMetodoPago('efectivo')
    setIsCobrarDialogOpen(true)
  }

  const handleCobrar = async () => {
    if (!selectedCuenta || !user) return
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

  const hoy = new Date().toISOString().split('T')[0]
  const totalCobradoHoy = cuentasCerradas
    .filter(c => c.fecha_cierre?.startsWith(hoy))
    .reduce((sum, c) => sum + c.total, 0)
  const propinasTotales = cuentasCerradas
    .filter(c => c.fecha_cierre?.startsWith(hoy))
    .reduce((sum, c) => sum + (c.propina || 0), 0)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando cobros...</div>

  return (
    <div className="cobros-page">
      <div className="cobros-header">
        <div className="cobros-icon"><Receipt /></div>
        <div>
          <h1>Cobros</h1>
          <p>Cierre de cuentas y registro de pagos</p>
        </div>
      </div>

      <div className="cobros-stats-grid">
        <div className="cobros-stat-card amber">
          <div className="cobros-stat-label">Por Cobrar</div>
          <div className="cobros-stat-value">{cuentasAbiertas.length}</div>
        </div>
        <div className="cobros-stat-card green">
          <div className="cobros-stat-label">Cobrado Hoy</div>
          <div className="cobros-stat-value">{formatCurrency(totalCobradoHoy)}</div>
        </div>
        <div className="cobros-stat-card blue">
          <div className="cobros-stat-label">Cuentas Cerradas Hoy</div>
          <div className="cobros-stat-value">{cuentasCerradas.filter(c => c.fecha_cierre?.startsWith(hoy)).length}</div>
        </div>
        <div className="cobros-stat-card purple">
          <div className="cobros-stat-label">Propinas Hoy</div>
          <div className="cobros-stat-value">{formatCurrency(propinasTotales)}</div>
        </div>
      </div>

      <Tabs defaultValue="abiertas">
        <TabsList className="cobros-tabs-list">
          <TabsTrigger value="abiertas">Cuentas Abiertas ({cuentasAbiertas.length})</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="abiertas" style={{ marginTop: '1rem' }}>
          <div className="cobros-grid">
            {cuentasAbiertas.map(cuenta => (
              <Card key={cuenta.id_cuenta} className="cobros-account-card">
                <div>
                  <div className="cobros-account-title">{cuenta.numero_mesa}</div>
                  <div className="cobros-account-time"><Clock size={12} className="inline" /> {formatTime(cuenta.fecha_apertura)} — Cuenta #{cuenta.id_cuenta}</div>
                </div>
                <div className="cobros-account-detail">
                  {cuenta.detalles.map((item, idx) => (
                    <div className="cobros-account-item" key={idx}>
                      <span>{item.cantidad}x {item.nombre_producto}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="cobros-account-total">
                  <span>Total</span>
                  <span>{formatCurrency(cuenta.subtotal_acumulado)}</span>
                </div>
                <button className="cobros-btn-cobrar" onClick={() => openCobrarDialog(cuenta)}>
                  <Receipt size={14} style={{ marginRight: '0.5rem' }} /> Cobrar Cuenta
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
          <Card className="cobros-historial-card">
            <div style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--chocolate)' }}>Historial de Cobros</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Propina</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuentasCerradas.map(c => (
                  <TableRow key={c.id_cuenta}>
                    <TableCell>#{c.id_cuenta}</TableCell>
                    <TableCell>{c.numero_mesa}</TableCell>
                    <TableCell>{formatCurrency(c.subtotal_acumulado)}</TableCell>
                    <TableCell>{c.propina ? formatCurrency(c.propina) : '-'}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(c.total)}</TableCell>
                    <TableCell><span className={`cobros-badge-pago ${c.metodo_pago}`}>{c.metodo_pago}</span></TableCell>
                    <TableCell style={{ fontSize: '0.85rem', color: 'var(--caramel)' }}>{formatDate(c.fecha_cierre)}</TableCell>
                  </TableRow>
                ))}
                {cuentasCerradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center" style={{ padding: '2rem', color: 'var(--caramel)' }}>
                      No hay cuentas cerradas aún
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para cobrar */}
      <Dialog open={isCobrarDialogOpen} onOpenChange={setIsCobrarDialogOpen}>
        <DialogContent style={{ maxWidth: '28rem' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--chocolate)' }}>Cobrar Cuenta</DialogTitle>
          </DialogHeader>
          {selectedCuenta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="cobros-dialog-detail">
                <div style={{ maxHeight: '12rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {selectedCuenta.detalles.map((item, idx) => (
                    <div className="cobros-dialog-item" key={idx}>
                      <span>{item.cantidad}x {item.nombre_producto}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="cobros-dialog-total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedCuenta.subtotal_acumulado)}</span>
                </div>
              </div>

              <div>
                <Label>Propina (opcional)</Label>
                <div className="cobros-propina-row" style={{ marginTop: '0.25rem' }}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={propina}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setPropina(isNaN(val) ? 0 : val);
                    }}
                    className="cobros-propina-input"
                    placeholder="0.00"
                  />
                  <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(Number(selectedCuenta.subtotal_acumulado) * 0.10))}>10%</Button>
                  <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(Number(selectedCuenta.subtotal_acumulado) * 0.15))}>15%</Button>
                  <Button variant="outline" size="sm" onClick={() => setPropina(Math.round(Number(selectedCuenta.subtotal_acumulado) * 0.20))}>20%</Button>
                </div>
              </div>

              <div>
                <Label>Método de Pago</Label>
                <div className="cobros-payment-grid" style={{ marginTop: '0.25rem' }}>
                  <button className="cobros-payment-btn" style={{ background: metodoPago === 'efectivo' ? '#16a34a' : 'transparent', color: metodoPago === 'efectivo' ? 'white' : 'var(--chocolate)', borderColor: metodoPago === 'efectivo' ? '#16a34a' : 'var(--caramel)' }} onClick={() => setMetodoPago('efectivo')}><Banknote size={14} className="inline" /> Efectivo</button>
                  <button className="cobros-payment-btn" style={{ background: metodoPago === 'tarjeta' ? '#2563eb' : 'transparent', color: metodoPago === 'tarjeta' ? 'white' : 'var(--chocolate)', borderColor: metodoPago === 'tarjeta' ? '#2563eb' : 'var(--caramel)' }} onClick={() => setMetodoPago('tarjeta')}><CreditCard size={14} className="inline" /> Tarjeta</button>
                  <button className="cobros-payment-btn" style={{ background: metodoPago === 'transferencia' ? '#7c3aed' : 'transparent', color: metodoPago === 'transferencia' ? 'white' : 'var(--chocolate)', borderColor: metodoPago === 'transferencia' ? '#7c3aed' : 'var(--caramel)' }} onClick={() => setMetodoPago('transferencia')}><Smartphone size={14} className="inline" /> Transf.</button>
                </div>
              </div>

              <div className="cobros-final-total">
                <span className="label">Total a Cobrar</span>
                <span className="value">{formatCurrency(selectedCuenta.subtotal_acumulado + propina)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCobrarDialogOpen(false)}>Cancelar</Button>
            <Button style={{ background: '#16a34a', color: 'white' }} onClick={handleCobrar}><CheckCircle size={14} style={{ marginRight: '0.5rem' }} /> Confirmar Cobro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
