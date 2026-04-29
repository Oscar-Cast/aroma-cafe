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
import { DollarSign, TrendingUp, TrendingDown, Clock, FileCheck, Play, StopCircle } from 'lucide-react'
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

  const cargarDatos = async () => {
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
    } catch (error) {
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
      toast({ title: 'Turno abierto', description: `Iniciaste el turno con ${formatCurrency(monto)}` })
      setShowAbrirDialog(false)
      cargarDatos()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo abrir el turno', variant: 'destructive' })
    }
  }

  const handleCerrarTurno = async () => {
    try {
      await api.cerrarTurno()
      toast({ title: 'Turno cerrado', description: 'El turno ha finalizado correctamente' })
      cargarDatos()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo cerrar el turno', variant: 'destructive' })
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando caja...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Caja</h1>
          <p className="text-[#889063] mt-1">Gestión de turnos y cierres</p>
        </div>
        <div className="flex gap-2">
          {!turno && (
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowAbrirDialog(true)}>
              <Play className="w-4 h-4 mr-2" /> Abrir Turno
            </Button>
          )}
          {turno && (
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCerrarTurno}>
              <StopCircle className="w-4 h-4 mr-2" /> Cerrar Turno
            </Button>
          )}
        </div>
      </div>

      {!turno ? (
        <Card className="border-[#CFBB99] bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-center text-lg text-[#4C3D19]">No hay un turno abierto. Inicia uno para comenzar operaciones.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumen del turno activo */}
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

          {/* Movimientos */}
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
                      <TableCell className="text-right">{formatCurrency(mov.monto)}</TableCell>
                      <TableCell>{formatDate(mov.fecha_hora)}</TableCell>
                    </TableRow>
                  ))}
                  {movimientos.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center">Sin movimientos</TableCell></TableRow>
                  )}
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
                </TableRow>
              ))}
              {historial.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center">No hay cierres anteriores</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo abrir turno */}
      <Dialog open={showAbrirDialog} onOpenChange={setShowAbrirDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Abrir Nuevo Turno</DialogTitle>
            <DialogDescription className="text-[#889063]">Ingresa el monto con el que inicia la caja</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#4C3D19]">Monto Inicial</Label>
              <Input type="number" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="border-[#CFBB99]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirDialog(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAbrirTurno}>Abrir Turno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
