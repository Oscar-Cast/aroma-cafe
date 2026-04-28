'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Insumo } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Package, Plus, Edit2, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function InventarioView() {
  const { toast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [isAjusteDialogOpen, setIsAjusteDialogOpen] = useState(false)
  const [ajusteInsumo, setAjusteInsumo] = useState<Insumo | null>(null)
  const [ajusteCantidad, setAjusteCantidad] = useState('')
  const [formData, setFormData] = useState({
    nombre_insumo: '', unidad_medida: '', existencia_actual: '', nivel_minimo: ''
  })

  const cargarInsumos = async () => {
    try {
      const data = await api.getInsumos()
      setInsumos(data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los insumos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarInsumos() }, [])

  const resetForm = () => {
    setFormData({ nombre_insumo: '', unidad_medida: '', existencia_actual: '', nivel_minimo: '' })
    setEditingInsumo(null)
  }

  const openEditDialog = (insumo: Insumo) => {
    setEditingInsumo(insumo)
    setFormData({
      nombre_insumo: insumo.nombre_insumo,
      unidad_medida: insumo.unidad_medida,
      existencia_actual: insumo.existencia_actual.toString(),
      nivel_minimo: insumo.nivel_minimo.toString()
    })
    setIsDialogOpen(true)
  }

  const openAjusteDialog = (insumo: Insumo) => {
    setAjusteInsumo(insumo)
    setAjusteCantidad('')
    setIsAjusteDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nombre_insumo || !formData.unidad_medida || !formData.existencia_actual || !formData.nivel_minimo) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' })
      return
    }
    const insumoData = {
      nombre_insumo: formData.nombre_insumo,
      unidad_medida: formData.unidad_medida,
      existencia_actual: parseFloat(formData.existencia_actual),
      nivel_minimo: parseFloat(formData.nivel_minimo)
    }
    try {
      if (editingInsumo) {
        await api.updateInsumo(editingInsumo.id_insumo, insumoData)
        toast({ title: 'Insumo actualizado' })
      } else {
        await api.createInsumo(insumoData)
        toast({ title: 'Insumo creado' })
      }
      cargarInsumos()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
    }
  }

  const handleAjuste = async (tipo: 'entrada' | 'salida') => {
    if (!ajusteInsumo || !ajusteCantidad) return
    const cantidad = parseFloat(ajusteCantidad)
    const nuevaExistencia = tipo === 'entrada'
      ? ajusteInsumo.existencia_actual + cantidad
      : Math.max(0, ajusteInsumo.existencia_actual - cantidad)
    try {
      await api.updateInsumo(ajusteInsumo.id_insumo, { existencia_actual: nuevaExistencia })
      toast({ title: tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada' })
      cargarInsumos()
      setIsAjusteDialogOpen(false)
      setAjusteInsumo(null)
      setAjusteCantidad('')
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo ajustar', variant: 'destructive' })
    }
  }

  const getStockStatus = (insumo: Insumo) => {
    const percentage = (insumo.existencia_actual / (insumo.nivel_minimo * 3)) * 100
    if (insumo.existencia_actual <= insumo.nivel_minimo) return { color: 'red', label: 'Crítico', percentage: Math.min(percentage, 100) }
    if (insumo.existencia_actual <= insumo.nivel_minimo * 1.5) return { color: 'amber', label: 'Bajo', percentage }
    return { color: 'green', label: 'Normal', percentage: Math.min(percentage, 100) }
  }

  const lowStockCount = insumos.filter(i => i.existencia_actual <= i.nivel_minimo).length

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando inventario...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4C3D19]">Inventario</h1>
          <p className="text-[#889063] mt-1">Control de insumos y existencias</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]"><Plus className="w-4 h-4 mr-2" />Nuevo Insumo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#4C3D19]">{editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
              <DialogDescription className="text-[#889063]">{editingInsumo ? 'Modifica los datos del insumo' : 'Agrega un nuevo insumo al inventario'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-[#4C3D19]">Nombre</Label><Input value={formData.nombre_insumo} onChange={(e) => setFormData({...formData, nombre_insumo: e.target.value})} className="border-[#CFBB99]" /></div>
              <div className="space-y-2"><Label className="text-[#4C3D19]">Unidad de Medida</Label><Input value={formData.unidad_medida} onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})} className="border-[#CFBB99]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[#4C3D19]">Existencia Actual</Label><Input type="number" step="0.01" value={formData.existencia_actual} onChange={(e) => setFormData({...formData, existencia_actual: e.target.value})} className="border-[#CFBB99]" /></div>
                <div className="space-y-2"><Label className="text-[#4C3D19]">Nivel Mínimo</Label><Input type="number" step="0.01" value={formData.nivel_minimo} onChange={(e) => setFormData({...formData, nivel_minimo: e.target.value})} className="border-[#CFBB99]" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={handleSubmit}>{editingInsumo ? 'Guardar Cambios' : 'Crear Insumo'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {lowStockCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
              <div><p className="font-semibold text-red-800">{lowStockCount} insumo(s) en nivel crítico</p><p className="text-sm text-red-600">Revisa los niveles de inventario.</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Control de Insumos</CardTitle>
          <CardDescription className="text-[#889063]">{insumos.length} insumos en inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFBB99]">
                <TableHead className="text-[#4C3D19]">Insumo</TableHead>
                <TableHead className="text-[#4C3D19]">Existencia</TableHead>
                <TableHead className="text-[#4C3D19]">Nivel</TableHead>
                <TableHead className="text-[#4C3D19] text-center">Estado</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumos.map(insumo => {
                const status = getStockStatus(insumo)
                return (
                  <TableRow key={insumo.id_insumo} className="border-[#CFBB99]">
                    <TableCell><p className="font-medium text-[#4C3D19]">{insumo.nombre_insumo}</p><p className="text-sm text-[#889063]">{insumo.unidad_medida}</p></TableCell>
                    <TableCell><p className="font-semibold text-[#4C3D19]">{insumo.existencia_actual} {insumo.unidad_medida}</p><p className="text-sm text-[#889063]">Mín: {insumo.nivel_minimo}</p></TableCell>
                    <TableCell className="w-[200px]"><Progress value={status.percentage} className={`h-2 ${status.color === 'red' ? '[&>div]:bg-red-500' : status.color === 'amber' ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} /></TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className={status.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' : status.color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200'}>{status.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="outline" className="border-green-300 text-green-600" onClick={() => openAjusteDialog(insumo)}><TrendingUp className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-[#889063] hover:text-[#4C3D19]" onClick={() => openEditDialog(insumo)}><Edit2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ajuste Dialog */}
      <Dialog open={isAjusteDialogOpen} onOpenChange={setIsAjusteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Ajuste de Inventario</DialogTitle>
            <DialogDescription className="text-[#889063]">{ajusteInsumo?.nombre_insumo} - Existencia actual: {ajusteInsumo?.existencia_actual} {ajusteInsumo?.unidad_medida}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-[#4C3D19]">Cantidad</Label><Input type="number" step="0.01" value={ajusteCantidad} onChange={(e) => setAjusteCantidad(e.target.value)} className="border-[#CFBB99]" /></div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 border-red-300 text-red-600" onClick={() => handleAjuste('salida')} disabled={!ajusteCantidad}><TrendingDown className="w-4 h-4 mr-2" />Salida</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAjuste('entrada')} disabled={!ajusteCantidad}><TrendingUp className="w-4 h-4 mr-2" />Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
