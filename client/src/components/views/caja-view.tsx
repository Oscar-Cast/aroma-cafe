'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, StopCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/caja.css'

export function CajaView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [turno, setTurno] = useState<any>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAbrirDialog, setShowAbrirDialog] = useState(false)
  const [montoInicial, setMontoInicial] = useState('500')
  const [showCerrarDialog, setShowCerrarDialog] = useState(false)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [diferencia, setDiferencia] = useState<number | null>(null)

  // ═══════════════ LÓGICA (sin cambios) ═══════════════
  const cargarDatos = async () => {
    setLoading(true)
    try {
      const data = await api.getTurnoActivo()
      if (data.activo) {
        setTurno(data.turno)
        setMovimientos(data.movimientos || [])
      } else {
        setTurno(null)
        setMovimientos([])
      }
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo cargar la información de caja', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleAbrirTurno = async () => {
    const monto = parseFloat(montoInicial)
    if (isNaN(monto) || monto < 0) {
      toast({ title: 'Error', description: 'Ingresa un monto inicial válido', variant: 'destructive' })
      return
    }
    try {
      await api.abrirTurno({ monto_inicial: monto })
      toast({ title: 'Turno abierto' })
      setShowAbrirDialog(false)
      cargarDatos()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const prepararCierre = async () => {
    try {
      const data = await api.getTurnoActivo()
      if (data.activo) {
        setTurno(data.turno)
        setMovimientos(data.movimientos || [])
        setEfectivoContado('')
        setDiferencia(null)
        setShowCerrarDialog(true)
      } else {
        toast({ title: 'Error', description: 'No hay turno activo', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo obtener el resumen', variant: 'destructive' })
    }
  }

  const handleCerrarTurno = async () => {
    try {
      const contado = efectivoContado.trim() === '' ? undefined : parseFloat(efectivoContado)
      const result = await api.cerrarTurno({ efectivo_contado: contado })
      toast({ title: 'Turno cerrado', description: `Saldo final: ${formatCurrency(result.cierre.saldo)}` })
      setShowCerrarDialog(false)
      setEfectivoContado('')
      setDiferencia(null)
      cargarDatos()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando...</div>

  return (
    <div className="caja-page">
      {/* Encabezado */}
      <div className="caja-header">
        <div>
          <h1 className="caja-title">Caja</h1>
          <p className="caja-subtitle">Gestión de turnos y cierres</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!turno && (
            <Button className="caja-btn-abrir" onClick={() => setShowAbrirDialog(true)}>
              <Play size={16} style={{ marginRight: '0.5rem' }} /> Abrir Turno
            </Button>
          )}
          {turno && (
            <Button className="caja-btn-cerrar" onClick={prepararCierre}>
              <StopCircle size={16} style={{ marginRight: '0.5rem' }} /> Cerrar Turno
            </Button>
          )}
        </div>
      </div>

      {/* Sin turno */}
      {!turno ? (
        <Card className="caja-no-turno-card">
          <CardContent className="caja-no-turno-text">
            No hay turno abierto. Inicia uno para operar.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <div className="caja-summary-grid">
            <Card className="caja-summary-card"><CardHeader><CardTitle className="caja-summary-card-title">Fondo Inicial</CardTitle></CardHeader><CardContent><div className="caja-summary-card-amount">{formatCurrency(turno.monto_inicial)}</div></CardContent></Card>
            <Card className="caja-summary-card-success"><CardHeader><CardTitle className="caja-summary-card-title" style={{ color: '#16a34a' }}>Ingresos</CardTitle></CardHeader><CardContent><div className="caja-summary-card-amount" style={{ color: '#16a34a' }}>{formatCurrency(turno.totalIngresos)}</div></CardContent></Card>
            <Card className="caja-summary-card-danger"><CardHeader><CardTitle className="caja-summary-card-title" style={{ color: '#dc2626' }}>Egresos</CardTitle></CardHeader><CardContent><div className="caja-summary-card-amount" style={{ color: '#dc2626' }}>{formatCurrency(turno.totalEgresos)}</div></CardContent></Card>
            <Card className="caja-summary-card"><CardHeader><CardTitle className="caja-summary-card-title">Saldo Actual</CardTitle></CardHeader><CardContent><div className="caja-summary-card-amount">{formatCurrency(turno.saldo)}</div></CardContent></Card>
          </div>

          {/* Métodos de pago en vivo */}
          <div className="caja-metodos-grid">
            <Card className="caja-metodo-card">
              <CardHeader className="caja-summary-card-title">Efectivo</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ color: '#16a34a' }}>{turno?.desglose ? formatCurrency(turno.desglose.efectivo) : '$0.00'}</div>
                <div className="caja-arqueo-nota">Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_efectivo) : '$0.00'}</div>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card">
              <CardHeader className="caja-summary-card-title">Tarjeta</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ color: '#2563eb' }}>{turno?.desglose ? formatCurrency(turno.desglose.tarjeta) : '$0.00'}</div>
                <div className="caja-arqueo-nota">Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_tarjeta) : '$0.00'}</div>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card">
              <CardHeader className="caja-summary-card-title">Transferencia</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ color: '#7c3aed' }}>{turno?.desglose ? formatCurrency(turno.desglose.transferencia) : '$0.00'}</div>
                <div className="caja-arqueo-nota">Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_transferencia) : '$0.00'}</div>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card-warning">
              <CardHeader className="caja-summary-card-title" style={{ color: '#92400e' }}>Propinas totales</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ color: '#92400e' }}>
                  {turno?.desglose
                    ? formatCurrency(turno.desglose.propinas_efectivo + turno.desglose.propinas_tarjeta + turno.desglose.propinas_transferencia)
                    : '$0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movimientos del turno */}
          <Card className="caja-movimientos-card">
            <CardHeader><CardTitle className="caja-summary-card-title">Movimientos del Turno</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                <TableBody>
                  {movimientos.map((mov: any) => (
                    <TableRow key={mov.id_movimiento_fin}>
                      <TableCell><span style={{ color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626' }}>{mov.tipo}</span></TableCell>
                      <TableCell>{mov.concepto}</TableCell>
                      <TableCell className="text-right">{formatCurrency(parseFloat(mov.monto))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Diálogo abrir turno */}
      <Dialog open={showAbrirDialog} onOpenChange={setShowAbrirDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="caja-title" style={{ fontSize: '1.25rem' }}>Abrir Nuevo Turno</DialogTitle><DialogDescription>Monto inicial en caja</DialogDescription></DialogHeader>
          <div style={{ margin: '1rem 0' }}>
            <Label>Monto Inicial</Label>
            <Input type="number" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} className="caja-abrir-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirDialog(false)}>Cancelar</Button>
            <Button className="caja-abrir-btn" onClick={handleAbrirTurno}>Abrir Turno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo cierre detallado */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent style={{ maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="caja-title">Cierre de Turno</DialogTitle>
            <DialogDescription>Resumen final del turno</DialogDescription>
          </DialogHeader>
          {turno && (
            <ScrollArea className="caja-cierre-scroll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Totales */}
                <div className="caja-cierre-totales">
                  <div className="caja-cierre-total-box caja-cierre-total-box-success">
                    <div className="caja-cierre-total-label">Ingresos totales</div>
                    <div className="caja-cierre-total-amount">{formatCurrency(turno.totalIngresos)}</div>
                  </div>
                  <div className="caja-cierre-total-box caja-cierre-total-box-danger">
                    <div className="caja-cierre-total-label">Egresos totales</div>
                    <div className="caja-cierre-total-amount">{formatCurrency(turno.totalEgresos)}</div>
                  </div>
                </div>

                {/* Métodos */}
                <div className="caja-arqueo-bloque">
                  <div className="caja-arqueo-label">Métodos de pago y propinas</div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Método</TableHead><TableHead className="text-right">Total cobrado</TableHead><TableHead className="text-right">Propinas</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {['efectivo', 'tarjeta', 'transferencia'].map(metodo => (
                        <TableRow key={metodo}>
                          <TableCell style={{ textTransform: 'capitalize' }}>{metodo}</TableCell>
                          <TableCell className="text-right">{turno?.desglose ? formatCurrency(turno.desglose[metodo]) : '-'}</TableCell>
                          <TableCell className="text-right">{turno?.desglose ? formatCurrency(turno.desglose[`propinas_${metodo}`]) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Movimientos del turno */}
                <div className="caja-arqueo-bloque">
                  <div className="caja-arqueo-label">Movimientos del turno</div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {movimientos.map((mov: any) => (
                        <TableRow key={mov.id_movimiento_fin}>
                          <TableCell><span style={{ color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626' }}>{mov.tipo}</span></TableCell>
                          <TableCell>{mov.concepto}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(mov.monto || '0'))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Arqueo de efectivo */}
                {(() => {
                  const egresosEfectivo = movimientos.filter(m => m.tipo === 'egreso').reduce((sum, m) => sum + parseFloat(m.monto || '0'), 0)
                  const cobrosEfectivo = turno.desglose?.efectivo || 0
                  const propinasTotales = (turno.desglose?.propinas_efectivo || 0) + (turno.desglose?.propinas_tarjeta || 0) + (turno.desglose?.propinas_transferencia || 0)
                  const efectivoEsperado = parseFloat(turno.monto_inicial) + cobrosEfectivo - egresosEfectivo - propinasTotales
                  return (
                    <div className="caja-arqueo-bloque">
                      <div className="caja-arqueo-label">Arqueo de efectivo</div>
                      <div className="caja-arqueo-fila"><span>Fondo inicial</span><span>{formatCurrency(turno.monto_inicial)}</span></div>
                      <div className="caja-arqueo-fila"><span>Cobros en efectivo</span><span style={{ color: '#16a34a' }}>+{formatCurrency(cobrosEfectivo)}</span></div>
                      <div className="caja-arqueo-fila"><span>Egresos en efectivo</span><span style={{ color: '#dc2626' }}>-{formatCurrency(egresosEfectivo)}</span></div>
                      <div className="caja-arqueo-fila"><span>Propinas a entregar</span><span style={{ color: '#92400e' }}>-{formatCurrency(propinasTotales)}</span></div>
                      <div className="caja-arqueo-total"><span>Efectivo esperado</span><span>{formatCurrency(efectivoEsperado)}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <Label>Efectivo contado</Label>
                        <Input type="number" step="0.01" value={efectivoContado} onChange={e => { setEfectivoContado(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val)) { setDiferencia(val - efectivoEsperado); } else { setDiferencia(null); } }} className="caja-arqueo-input" placeholder="0.00" />
                      </div>
                      {diferencia !== null && (
                        <div className={`caja-arqueo-fila ${diferencia === 0 ? 'caja-diferencia-perfecta' : diferencia > 0 ? 'caja-diferencia-positiva' : 'caja-diferencia-negativa'}`} style={{ marginTop: '0.5rem' }}>
                          <span>Diferencia</span><span>{diferencia === 0 ? 'Cuadre perfecto' : formatCurrency(diferencia)}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarDialog(false)}>Cancelar</Button>
            <Button className="btn-danger" onClick={handleCerrarTurno}><StopCircle size={16} style={{ marginRight: '0.5rem' }} /> Confirmar Cierre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
