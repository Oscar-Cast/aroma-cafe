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

  // ═══════════════ LÓGICA  ═══════════════
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

  if (loading) return <div className="text-center py-12 text-[var(--caramel)]">Cargando...</div>

  // ═══════════════ VISTA ═══════════════
  return (
    <div className="caja-page">
      {/* Encabezado */}
      <div className="caja-header">
        <div>
          <h1 className="caja-title">Caja</h1>
          <p className="caja-subtitle">Gestión de turnos y cierres</p>
        </div>
        <div className="flex gap-2">
          {!turno && (
            <Button className="caja-btn-abrir" onClick={() => setShowAbrirDialog(true)}>
              <Play className="w-4 h-4 mr-2" /> Abrir Turno
            </Button>
          )}
          {turno && (
            <Button className="caja-btn-cerrar" onClick={prepararCierre}>
              <StopCircle className="w-4 h-4 mr-2" /> Cerrar Turno
            </Button>
          )}
        </div>
      </div>

      {/* Sin turno abierto */}
      {!turno ? (
        <Card className="caja-no-turno-card">
          <CardContent className="caja-no-turno-text">
            No hay turno abierto. Inicia uno para operar.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="caja-summary-grid">
            <Card className="caja-summary-card">
              <CardHeader><CardTitle className="caja-summary-card-title">Fondo Inicial</CardTitle></CardHeader>
              <CardContent><div className="caja-summary-card-amount">{formatCurrency(turno.monto_inicial)}</div></CardContent>
            </Card>
            <Card className="caja-summary-card-success">
              <CardHeader><CardTitle className="text-sm font-medium text-green-700">Ingresos</CardTitle></CardHeader>
              <CardContent><div className="caja-summary-card-amount text-green-700">{formatCurrency(turno.totalIngresos)}</div></CardContent>
            </Card>
            <Card className="caja-summary-card-danger">
              <CardHeader><CardTitle className="text-sm font-medium text-red-700">Egresos</CardTitle></CardHeader>
              <CardContent><div className="caja-summary-card-amount text-red-700">{formatCurrency(turno.totalEgresos)}</div></CardContent>
            </Card>
            <Card className="caja-summary-card">
              <CardHeader><CardTitle className="caja-summary-card-title">Saldo Actual</CardTitle></CardHeader>
              <CardContent><div className="caja-summary-card-amount">{formatCurrency(turno.saldo)}</div></CardContent>
            </Card>
          </div>

          {/* Métodos de pago en vivo */}
          <div className="caja-metodos-grid">
            <Card className="caja-metodo-card">
              <CardHeader className="pb-2"><CardTitle className="caja-summary-card-title">Efectivo</CardTitle></CardHeader>
              <CardContent>
                <div className="caja-metodo-amount text-green-700">
                  {turno?.desglose ? formatCurrency(turno.desglose.efectivo) : '$0.00'}
                </div>
                <p className="text-xs text-[var(--caramel)]">
                  Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_efectivo) : '$0.00'}
                </p>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card">
              <CardHeader className="pb-2"><CardTitle className="caja-summary-card-title">Tarjeta</CardTitle></CardHeader>
              <CardContent>
                <div className="caja-metodo-amount text-blue-600">
                  {turno?.desglose ? formatCurrency(turno.desglose.tarjeta) : '$0.00'}
                </div>
                <p className="text-xs text-[var(--caramel)]">
                  Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_tarjeta) : '$0.00'}
                </p>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card">
              <CardHeader className="pb-2"><CardTitle className="caja-summary-card-title">Transferencia</CardTitle></CardHeader>
              <CardContent>
                <div className="caja-metodo-amount text-purple-600">
                  {turno?.desglose ? formatCurrency(turno.desglose.transferencia) : '$0.00'}
                </div>
                <p className="text-xs text-[var(--caramel)]">
                  Propinas: {turno?.desglose ? formatCurrency(turno.desglose.propinas_transferencia) : '$0.00'}
                </p>
              </CardContent>
            </Card>
            <Card className="caja-metodo-card-warning">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-700">Propinas totales</CardTitle></CardHeader>
              <CardContent>
                <div className="caja-metodo-amount text-amber-700">
                  {turno?.desglose
                    ? formatCurrency(
                        turno.desglose.propinas_efectivo +
                        turno.desglose.propinas_tarjeta +
                        turno.desglose.propinas_transferencia
                      )
                    : '$0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movimientos del turno */}
          <Card className="caja-movimientos-card">
            <CardHeader><CardTitle className="text-lg font-bold text-[var(--chocolate)]">Movimientos del Turno</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov: any) => (
                    <TableRow key={mov.id_movimiento_fin}>
                      <TableCell>
                        <span className={mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                          {mov.tipo}
                        </span>
                      </TableCell>
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
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--chocolate)]">Abrir Nuevo Turno</DialogTitle>
            <DialogDescription>Monto inicial en caja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Monto Inicial</Label>
            <Input type="number" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="caja-abrir-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirDialog(false)}>Cancelar</Button>
            <Button className="caja-abrir-btn" onClick={handleAbrirTurno}>Abrir Turno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cierre detallado */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[var(--chocolate)]">Cierre de Turno</DialogTitle>
            <DialogDescription className="text-[var(--caramel)]">Resumen final del turno</DialogDescription>
          </DialogHeader>
          {turno && (
            <ScrollArea className="caja-cierre-scroll">
              <div className="space-y-4">
                {/* Resumen de totales */}
                <div className="caja-cierre-totales">
                  <div className="caja-cierre-total-box caja-cierre-total-box-success">
                    <p className="caja-cierre-total-label">Ingresos totales</p>
                    <p className="caja-cierre-total-amount">{formatCurrency(turno.totalIngresos)}</p>
                  </div>
                  <div className="caja-cierre-total-box caja-cierre-total-box-danger">
                    <p className="caja-cierre-total-label">Egresos totales</p>
                    <p className="caja-cierre-total-amount">{formatCurrency(turno.totalEgresos)}</p>
                  </div>
                </div>

                {/* Métodos de pago y propinas */}
                <div className="caja-arqueo-bloque">
                  <p className="text-lg font-bold text-[var(--chocolate)] mb-2">Métodos de pago y propinas</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Total cobrado</TableHead>
                        <TableHead className="text-right">Propinas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {['efectivo', 'tarjeta', 'transferencia'].map(metodo => (
                        <TableRow key={metodo}>
                          <TableCell className="capitalize">{metodo}</TableCell>
                          <TableCell className="text-right">
                            {turno?.desglose ? formatCurrency(turno.desglose[metodo]) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {turno?.desglose ? formatCurrency(turno.desglose[`propinas_${metodo}`]) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Movimientos del turno (resumen) */}
                <div className="caja-arqueo-bloque">
                  <p className="text-lg font-bold text-[var(--chocolate)] mb-2">Movimientos del turno</p>
                  <div className="max-h-40 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimientos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-[var(--caramel)]">
                              No hay movimientos registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          movimientos.map((mov: any) => (
                            <TableRow key={mov.id_movimiento_fin}>
                              <TableCell>
                                <span className={mov.tipo === 'ingreso' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                  {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                                </span>
                              </TableCell>
                              <TableCell>{mov.concepto}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(parseFloat(mov.monto || '0'))}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Arqueo de efectivo + Totales finales (un único bloque) */}
                {(() => {
                  const egresosEfectivo = movimientos
                    .filter(m => m.tipo === 'egreso')
                    .reduce((sum, m) => sum + parseFloat(m.monto || '0'), 0)
                  const cobrosEfectivo = turno.desglose?.efectivo || 0
                  const propinasTotales =
                    (turno.desglose?.propinas_efectivo || 0) +
                    (turno.desglose?.propinas_tarjeta || 0) +
                    (turno.desglose?.propinas_transferencia || 0)
                  const efectivoEsperado =
                    parseFloat(turno.monto_inicial) + cobrosEfectivo - egresosEfectivo - propinasTotales

                  return (
                    <>
                      {/* Arqueo de efectivo */}
                      <div className="caja-arqueo-bloque">
                        <p className="caja-arqueo-label">Arqueo de efectivo</p>
                        <div className="space-y-2">
                          <div className="caja-arqueo-fila">
                            <span>Fondo inicial:</span>
                            <span className="font-medium">{formatCurrency(turno.monto_inicial)}</span>
                          </div>
                          <div className="caja-arqueo-fila">
                            <span>Cobros en efectivo:</span>
                            <span className="font-medium text-green-600">+{formatCurrency(cobrosEfectivo)}</span>
                          </div>
                          <div className="caja-arqueo-fila">
                            <span>Egresos en efectivo:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(egresosEfectivo)}</span>
                          </div>
                          <div className="caja-arqueo-fila">
                            <span>Propinas a entregar (todas):</span>
                            <span className="font-medium text-amber-700">-{formatCurrency(propinasTotales)}</span>
                          </div>
                          <div className="caja-arqueo-total">
                            <span>Efectivo esperado en caja:</span>
                            <span className="text-[var(--chocolate)]">{formatCurrency(efectivoEsperado)}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Label className="text-[var(--chocolate)] whitespace-nowrap">Efectivo contado:</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={efectivoContado}
                              onChange={(e) => {
                                setEfectivoContado(e.target.value)
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val)) {
                                  setDiferencia(val - efectivoEsperado)
                                } else {
                                  setDiferencia(null)
                                }
                              }}
                              className="caja-arqueo-input"
                              placeholder="0.00"
                            />
                          </div>
                          {diferencia !== null && (
                            <div
                              className={`flex justify-between font-semibold ${
                                diferencia === 0
                                  ? 'caja-diferencia-perfecta'
                                  : diferencia > 0
                                  ? 'caja-diferencia-positiva'
                                  : 'caja-diferencia-negativa'
                              }`}
                            >
                              <span>Diferencia:</span>
                              <span>{diferencia === 0 ? 'Cuadre perfecto' : formatCurrency(diferencia)}</span>
                            </div>
                          )}
                        </div>
                        <p className="caja-arqueo-nota">
                          Recuerde separar el fondo inicial ({formatCurrency(turno.monto_inicial)}) para el próximo turno.
                        </p>
                      </div>

                      {/* Totales finales */}
                      <div className="caja-arqueo-bloque">
                        <div className="text-sm space-y-1">
                          <div className="caja-arqueo-fila">
                            <span>Saldo del sistema (incluye fondo):</span>
                            <span className="font-medium">{formatCurrency(turno.saldo)}</span>
                          </div>
                          <div className="caja-arqueo-fila">
                            <span>Menos fondo inicial:</span>
                            <span className="font-medium">-{formatCurrency(turno.monto_inicial)}</span>
                          </div>
                          <div className="caja-arqueo-total">
                            <span>Ganancia bruta del turno:</span>
                            <span className="text-green-700">
                              {formatCurrency(turno.totalIngresos - turno.totalEgresos)}
                            </span>
                          </div>
                          {turno.desglose && (
                            <div className="caja-arqueo-fila mt-2">
                              <span>Propinas a entregar:</span>
                              <span className="font-medium text-amber-700">
                                {formatCurrency(propinasTotales)}
                              </span>
                            </div>
                          )}
                          <div className="caja-arqueo-total">
                            <span>Ganancia neta (después de propinas):</span>
                            <span className="text-green-700">
                              {formatCurrency(
                                turno.totalIngresos - turno.totalEgresos - propinasTotales
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="caja-arqueo-nota">
                          * El fondo inicial se retira al finalizar el turno y no se considera ganancia.
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarDialog(false)}>
              Cancelar
            </Button>
            <Button className="btn-danger" onClick={handleCerrarTurno}>
              <StopCircle className="w-4 h-4 mr-2" /> Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
