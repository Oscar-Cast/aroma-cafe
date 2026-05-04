'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DollarSign, TrendingUp, TrendingDown, Clock, Play, StopCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function CajaView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [turno, setTurno] = useState<any>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAbrirDialog, setShowAbrirDialog] = useState(false)
  const [montoInicial, setMontoInicial] = useState('500')
  const [showCerrarDialog, setShowCerrarDialog] = useState(false)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [diferencia, setDiferencia] = useState<number | null>(null)

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
      const hist = await api.getHistorialCierres()
      setHistorial(hist)
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
      const data = await api.getTurnoActivo();
      if (data.activo) {
        setTurno(data.turno);
        setMovimientos(data.movimientos || []);
        setEfectivoContado('0');         // ← inicia en cero
        setDiferencia(null);             // la diferencia se calculará al escribir
        setShowCerrarDialog(true);
      } else {
        toast({ title: 'Error', description: 'No hay turno activo', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo obtener el resumen', variant: 'destructive' });
    }
  };

  const handleCerrarTurno = async () => {
    // Leer el valor directamente del input para evitar inconsistencias de estado
    const inputElement = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
    const valorEnInput = inputElement ? inputElement.value : efectivoContado;
    const contado = parseFloat(valorEnInput) || 0;

    console.log('Valor en input:', valorEnInput, ' | contado enviado:', contado);

    try {
        const result = await api.cerrarTurno({ efectivo_contado: contado });
        toast({ title: 'Turno cerrado', description: `Saldo final: ${formatCurrency(result.cierre.saldo)}` });
        setShowCerrarDialog(false);
        setEfectivoContado('');
        setDiferencia(null);
        cargarDatos();
    } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
};
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })

  if (loading) return <div className="text-center py-12">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Encabezado y botones principales */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Caja</h1>
          <p className="text-[#889063]">Gestión de turnos y cierres</p>
        </div>
        <div className="flex gap-2">
          {!turno && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowAbrirDialog(true)}>
              <Play className="w-4 h-4 mr-2" /> Abrir Turno
            </Button>
          )}
          {turno && (
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={prepararCierre}>
              <StopCircle className="w-4 h-4 mr-2" /> Cerrar Turno
            </Button>
          )}
        </div>
      </div>

      {/* Contenido cuando no hay turno */}
      {!turno ? (
        <Card className="border-[#CFBB99] bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-center text-lg text-[#4C3D19]">No hay turno abierto. Inicia uno para operar.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-[#CFBB99]">
              <CardHeader><CardTitle className="text-sm text-[#889063]">Fondo Inicial</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(turno.monto_inicial)}</div></CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardHeader><CardTitle className="text-sm text-green-700">Ingresos</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-700">{formatCurrency(turno.totalIngresos)}</div></CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardHeader><CardTitle className="text-sm text-red-700">Egresos</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-700">{formatCurrency(turno.totalEgresos)}</div></CardContent>
            </Card>
            <Card className="border-[#CFBB99]">
              <CardHeader><CardTitle className="text-sm text-[#889063]">Saldo Actual</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatCurrency(turno.saldo)}</div></CardContent>
            </Card>
          </div>

          {/* Movimientos del turno */}
          <Card className="border-[#CFBB99]">
            <CardHeader><CardTitle className="text-[#4C3D19]">Movimientos del Turno</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Hora</TableHead>
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
                      <TableCell>{formatDate(mov.fecha_hora)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Historial de cierres */}
      <Card className="border-[#CFBB99]">
        <CardHeader><CardTitle className="text-[#4C3D19]">Historial de Cierres</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Egresos</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-right">Efectivo contado</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historial.map((c: any) => (
                <TableRow key={c.id_cierre}>
                  <TableCell>{formatDate(c.fecha_cierre)}</TableCell>
                  <TableCell>{c.nombre_usuario}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(c.total_ingresos)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(c.total_egresos)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(c.saldo)}</TableCell>
                  <TableCell className="text-right font-bold text-green-700">
                    {formatCurrency(c.total_ingresos - c.total_egresos)}
                  </TableCell>
                  <TableCell className="text-right">{c.efectivo_contado != null ? formatCurrency(c.efectivo_contado) : '-'}</TableCell>
                  <TableCell className="text-right">{c.diferencia != null ? formatCurrency(c.diferencia) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo abrir turno */}
      <Dialog open={showAbrirDialog} onOpenChange={setShowAbrirDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Abrir Nuevo Turno</DialogTitle>
            <DialogDescription>Monto inicial en caja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Monto Inicial</Label>
            <Input
              type="number"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirDialog(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAbrirTurno}>
              Abrir Turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo cierre detallado */}
      <Dialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Cierre de Turno</DialogTitle>
            <DialogDescription className="text-[#889063]">Resumen final del turno</DialogDescription>
          </DialogHeader>
          {turno && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                {/* Totales generales */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-green-700">Ingresos totales</p>
                    <p className="text-xl font-bold">{formatCurrency(turno.totalIngresos)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-sm text-red-700">Egresos totales</p>
                    <p className="text-xl font-bold">{formatCurrency(turno.totalEgresos)}</p>
                  </div>
                </div>

                {/* Métodos de pago y propinas */}
                <div className="bg-[#E5D7C4]/30 p-3 rounded">
                  <p className="font-medium text-[#4C3D19] mb-2">Métodos de pago y propinas</p>
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

                {/* Movimientos del turno */}
                <div className="bg-[#E5D7C4]/30 p-3 rounded">
                  <p className="font-medium text-[#4C3D19] mb-2">Movimientos del turno</p>
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
                            <TableCell colSpan={3} className="text-center text-[#889063]">No hay movimientos</TableCell>
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
                              <TableCell className="text-right">{formatCurrency(parseFloat(mov.monto || '0'))}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Arqueo de efectivo */}
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
                    <div className="bg-white p-3 rounded border border-[#CFBB99]">
                      <p className="font-medium text-[#4C3D19] mb-2">Arqueo de efectivo</p>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Fondo inicial:</span>
                          <span className="font-medium">{formatCurrency(turno.monto_inicial)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cobros en efectivo:</span>
                          <span className="font-medium text-green-600">+{formatCurrency(cobrosEfectivo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Egresos en efectivo:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(egresosEfectivo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Propinas a entregar (todas):</span>
                          <span className="font-medium text-amber-700">-{formatCurrency(propinasTotales)}</span>
                        </div>
                        <div className="border-t border-[#CFBB99] pt-2 flex justify-between font-semibold">
                          <span>Efectivo esperado en caja:</span>
                          <span className="text-[#4C3D19]">{formatCurrency(efectivoEsperado)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Label className="text-[#4C3D19] whitespace-nowrap">Efectivo contado:</Label>
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
                            className="w-36 border-[#CFBB99]"
                            placeholder="0.00"
                          />
                        </div>
                        {diferencia !== null && (
                          <div className={`flex justify-between font-semibold ${diferencia === 0 ? 'text-green-700' : diferencia > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            <span>Diferencia:</span>
                            <span>{diferencia === 0 ? 'Cuadre perfecto' : formatCurrency(diferencia)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#889063] mt-2">
                        Recuerde separar el fondo inicial ({formatCurrency(turno.monto_inicial)}) para el próximo turno.
                      </p>
                    </div>
                  )
                })()}

                {/* Totales finales */}
                <div className="bg-[#E5D7C4]/30 p-3 rounded">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Saldo del sistema (incluye fondo):</span>
                      <span className="font-medium">{formatCurrency(turno.saldo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Menos fondo inicial:</span>
                      <span className="font-medium">-{formatCurrency(turno.monto_inicial)}</span>
                    </div>
                    <div className="border-t border-[#CFBB99] pt-2 mt-2 flex justify-between font-bold text-[#4C3D19]">
                      <span>Ganancia bruta del turno:</span>
                      <span className="text-green-700">{formatCurrency(turno.totalIngresos - turno.totalEgresos)}</span>
                    </div>
                    {turno.desglose && (
                      <div className="flex justify-between text-sm mt-2">
                        <span>Propinas a entregar:</span>
                        <span className="font-medium text-amber-700">
                          {formatCurrency(
                            (turno.desglose.propinas_efectivo || 0) +
                            (turno.desglose.propinas_tarjeta || 0) +
                            (turno.desglose.propinas_transferencia || 0)
                          )}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-[#CFBB99] pt-2 mt-2 flex justify-between font-bold text-[#4C3D19]">
                      <span>Ganancia neta (después de propinas):</span>
                      <span className="text-green-700">
                        {formatCurrency(
                          turno.totalIngresos - turno.totalEgresos -
                          ((turno.desglose?.propinas_efectivo || 0) +
                           (turno.desglose?.propinas_tarjeta || 0) +
                           (turno.desglose?.propinas_transferencia || 0))
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#889063] mt-2">
                    * El fondo inicial se retira al finalizar el turno y no se considera ganancia.
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCerrarDialog(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCerrarTurno}>
              <StopCircle className="w-4 h-4 mr-2" /> Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
