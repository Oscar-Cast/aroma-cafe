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
          <h1 className="caja-title" style={{ color: 'var(--chocolate)', fontSize: '4rem'}}>Caja</h1>
          <p className="caja-subtitle" style={{fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>Gestión de turnos y cierres</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!turno && (
            <Button className="caja-btn-abrir" onClick={() => setShowAbrirDialog(true)} style={{fontSize: '1.3rem', color: 'white'}}>
              <Play style={{height: 30, width: 30}} /> Abrir Turno
            </Button>
          )}
          {turno && (
            <Button className="caja-btn-cerrar" onClick={prepararCierre} style={{fontSize: '1.3rem', color: 'white'}}>
              <StopCircle style={{height: 30, width: 30}} /> Cerrar Turno
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
            <Card className="caja-summary-card">
              <CardHeader>
                <CardTitle className="caja-summary-card-title" style={{fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63)'}}>Fondo Inicial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="caja-summary-card-amount" style={{fontSize: '2rem', fontWeight: 800, color: 'rgb(114, 92, 63, 0.7)'}}>{formatCurrency(turno.monto_inicial)}</div>
              </CardContent>
            </Card>
            <Card className="caja-summary-card-success">
              <CardHeader>
                <CardTitle className="caja-summary-card-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="caja-summary-card-amount" style={{ color: '#16a34a', fontSize: '2rem', fontWeight: 800, color: ' rgb(22, 163, 74,0.7)' }}>{formatCurrency(turno.totalIngresos)}</div>
              </CardContent>
            </Card>
            <Card className="caja-summary-card-danger">
              <CardHeader>
                <CardTitle className="caja-summary-card-title" style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="caja-summary-card-amount" style={{ color: '#dc2626', fontSize: '2rem', fontWeight: 800, color: 'rgb(220, 38, 38, 0.7)' }}>{formatCurrency(turno.totalEgresos)}</div>
              </CardContent>
            </Card>
            <Card className="caja-summary-card">
              <CardHeader>
                <CardTitle className="caja-summary-card-title" style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63)' }}>Saldo Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="caja-summary-card-amount" style={{ fontSize: '2rem', fontWeight: 800, color: 'rgb(114, 92, 63, 0.7)' }}>{formatCurrency(turno.saldo)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Métodos de pago en vivo */}
          <div className="caja-metodos-grid">
            <Card className="caja-metodo-card">
              <CardHeader className="caja-summary-card-title" style={{fontSize: '2rem', fontWeight: 700, color: '#16a34a'}}>Efectivo</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{fontSize: '2rem', fontWeight: 800, color: 'rgb(22, 163, 74, 0.7)' }}>{turno?.desglose ? formatCurrency(turno.desglose.efectivo) : '$0.00'}</div>
                <div className="caja-arqueo-nota" style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)', }}>Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_efectivo) : '$0.00'}</div>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card">
              <CardHeader className="caja-summary-card-title" style={{fontSize: '2rem', fontWeight: 700, color: '#2563eb'}}>Tarjeta</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ fontSize: '2rem', fontWeight: 800, color: 'rgb(37, 99, 235, 0.7)' }}>{turno?.desglose ? formatCurrency(turno.desglose.tarjeta) : '$0.00'}</div>
                <div className="caja-arqueo-nota" style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)', }}>Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_tarjeta) : '$0.00'}</div>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card">
              <CardHeader className="caja-summary-card-title" style={{fontSize: '2rem', fontWeight: 700, color: '#7c3aed'}}>Transferencia</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ fontSize: '2rem', fontWeight: 800, color: 'rgb(124, 58, 237, 0.7)' }}>{turno?.desglose ? formatCurrency(turno.desglose.transferencia) : '$0.00'}</div>
                <div className="caja-arqueo-nota" style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)', }}>Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_transferencia) : '$0.00'}</div>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card-warning">
              <CardHeader className="caja-summary-card-title" style={{fontSize: '2rem', fontWeight: 700, color: '#92400e'}}>Propinas totales</CardHeader>
              <CardContent>
                <div className="caja-metodo-amount" style={{ fontSize: '2rem', fontWeight: 800, color: 'rgb(146, 64, 14, 0.7)' }}>
                  {turno?.desglose
                    ? formatCurrency(turno.desglose.propinas_efectivo + turno.desglose.propinas_tarjeta + turno.desglose.propinas_transferencia)
                    : '$0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movimientos del turno */}
          <Card className="caja-movimientos-card">
            <CardHeader>
              <CardTitle className="caja-summary-card-title" style={{ fontSize: '2rem', fontWeight: 700 }}>Movimientos del Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ fontSize: '1.6rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700 }}>Tipo</TableHead>
                    <TableHead style={{ fontSize: '1.6rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700 }}>Concepto</TableHead>
                    <TableHead className="text-right" style={{ fontSize: '1.6rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700 }}>Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov: any) => (
                    <TableRow key={mov.id_movimiento_fin}>
                      <TableCell><span style={{ color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626', fontSize: '1.4rem' }}>{mov.tipo}</span></TableCell>
                      <TableCell style={{fontSize: '1.4rem', color: 'rgb(114, 92, 63)' }}>{mov.concepto}</TableCell>
                      <TableCell className="text-right" style={{fontSize: '1.4rem', color: 'rgb(220, 38, 38, 0.7)', fontWeight: 700}}>{formatCurrency(parseFloat(mov.monto))}</TableCell>
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
          <DialogHeader>
            <DialogTitle className="caja-title" style={{ fontSize: '2rem', fontWeight: 700 }}>Abrir Nuevo Turno</DialogTitle>
            <DialogDescription style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Monto inicial en caja</DialogDescription>
          </DialogHeader>
          <div style={{ margin: '1rem 0' }}>
            <Label style={{fontSize: '1.6rem', fontWeight: 600}}>Monto Inicial</Label>
            <Input type="number" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} className="caja-abrir-input" style={{fontSize: '1.4rem'}} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirDialog(false)} style={{fontSize: '1.4rem', background: 'rgb(114, 92, 63)', color: 'white'}}>Cancelar</Button>
            <Button className="caja-abrir-btn" onClick={handleAbrirTurno} style={{fontSize: '1.4rem', background: 'rgb(114, 92, 63)', color: 'white'}}>Abrir Turno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo cierre detallado */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent style={{ maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle className="caja-title" style={{ fontSize: '2rem', fontWeight: 700 }}>Cierre de Turno</DialogTitle>
            <DialogDescription style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Resumen final del turno</DialogDescription>
          </DialogHeader>
          {turno && (
            <ScrollArea className="caja-cierre-scroll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Totales */}
                <div className="caja-cierre-totales">
                  <div className="caja-cierre-total-box caja-cierre-total-box-success">
                    <div className="caja-cierre-total-label" style={{fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Ingresos totales</div>
                    <div className="caja-cierre-total-amount"style={{fontSize: '1.3rem', color: 'rgb(22, 163, 74,0.7'}}>{formatCurrency(turno.totalIngresos)}</div>
                  </div>
                  <div className="caja-cierre-total-box caja-cierre-total-box-danger">
                    <div className="caja-cierre-total-label" style={{fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}} >Egresos totales</div>
                    <div className="caja-cierre-total-amount" style={{fontSize: '1.3rem', color: 'rgb(220, 38, 38, 0.7)'}}>{formatCurrency(turno.totalEgresos)}</div>
                  </div>
                </div>

                {/* Métodos */}
                <div className="caja-arqueo-bloque">
                  <div className="caja-arqueo-label" style={{fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Métodos de pago y propinas</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63)',fontWeight: 700}}>Método</TableHead>
                        <TableHead className="text-right"style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63)', fontWeight: 700}}>Total cobrado</TableHead>
                        <TableHead className="text-right"style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63)', fontWeight: 700}}>Propinas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {['efectivo', 'tarjeta', 'transferencia'].map(metodo => (
                        <TableRow key={metodo}>
                          <TableCell style={{ textTransform: 'capitalize', fontSize: '1.1rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>{metodo}</TableCell>
                          <TableCell className="text-right" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>
                            {turno?.desglose ? formatCurrency(turno.desglose[metodo]) : '-'}
                          </TableCell>
                          <TableCell className="text-right" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>
                            {turno?.desglose ? formatCurrency(turno.desglose[`propinas_${metodo}`]) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Movimientos del turno */}
                <div className="caja-arqueo-bloque">
                  <div className="caja-arqueo-label" style={{fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Movimientos del turno</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63)',fontWeight: 700}}>Tipo</TableHead>
                        <TableHead style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63)',fontWeight: 700}}>Concepto</TableHead>
                        <TableHead className="text-right" style={{fontSize: '1.2rem', color: 'rgb(114, 92, 63)', fontWeight: 700}}>Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientos.map((mov: any) => (
                        <TableRow key={mov.id_movimiento_fin}>
                          <TableCell><span style={{ color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626', fontSize: '1.1rem' }}>{mov.tipo}</span></TableCell>
                          <TableCell style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>{mov.concepto}</TableCell>
                          <TableCell className="text-right" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>
                            {formatCurrency(parseFloat(mov.monto || '0'))}
                          </TableCell>
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
                      <div className="caja-arqueo-label" style={{fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Arqueo de efectivo</div>
                      <div className="caja-arqueo-fila">
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Fondo inicial</span>
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>{formatCurrency(turno.monto_inicial)}</span>
                      </div>
                      <div className="caja-arqueo-fila">
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Cobros en efectivo</span>
                        <span style={{fontSize: '1.1rem', color: '#16a34a', fontWeight: 700}}>+{formatCurrency(cobrosEfectivo)}</span>
                      </div>
                      <div className="caja-arqueo-fila">
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Egresos en efectivo</span>
                        <span style={{ fontSize: '1.1rem', color: '#dc2626', fontWeight: 700 }}>-{formatCurrency(egresosEfectivo)}</span>
                      </div>
                      <div className="caja-arqueo-fila">
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 700}}>Propinas a entregar</span>
                        <span style={{fontSize: '1.1rem', color: '#92400e', fontWeight: 700 }}>-{formatCurrency(propinasTotales)}</span>
                      </div>
                      <div className="caja-arqueo-total">
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 500}}>Efectivo esperado</span>
                        <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63, 0.7)', fontWeight: 500}}>{formatCurrency(efectivoEsperado)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <Label style={{fontSize: '1.3rem'}}>Efectivo contado</Label>
                        <Input type="number" step="0.01" value={efectivoContado} onChange={e => { setEfectivoContado(e.target.value); const val = parseFloat(e.target.value); if (!isNaN(val)) { setDiferencia(val - efectivoEsperado); } else { setDiferencia(null); } }} className="caja-arqueo-input" placeholder="0.00" />
                      </div>
                      {diferencia !== null && (
                        <div className={`caja-arqueo-fila ${diferencia === 0 ? 'caja-diferencia-perfecta' : diferencia > 0 ? 'caja-diferencia-positiva' : 'caja-diferencia-negativa'}`} style={{ marginTop: '0.5rem' }}>
                          <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63)', fontWeight: 700}}>Diferencia</span>
                          <span style={{fontSize: '1.1rem', color: 'rgb(114, 92, 63)', fontWeight: 700}}>{diferencia === 0 ? 'Cuadre perfecto' : formatCurrency(diferencia)}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarDialog(false)} style={{ background: 'rgb(114, 92, 63)', color: 'white', fontSize: '1.3rem' }}>Cancelar</Button>
            <Button className="btn-danger" onClick={handleCerrarTurno} style={{ background: 'rgb(114, 92, 63)', color: 'white', fontSize: '1.3rem' }}><StopCircle style={{height:25, width:25}} /> Confirmar Cierre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
