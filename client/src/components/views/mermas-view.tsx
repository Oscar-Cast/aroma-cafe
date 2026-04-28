'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { MermaProducto, Producto } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, Plus, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const motivosMerma = ['Caducidad', 'Daño en transporte', 'Daño en almacén', 'Producto defectuoso', 'Error de preparación', 'Devolución de cliente', 'Otro']

export function MermasView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [mermas, setMermas] = useState<MermaProducto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ id_producto: '', cantidad: '', motivo: '', motivoOtro: '' })
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      const [mermasData, productosData] = await Promise.all([
        api.getMermas(),
        api.getProductos()
      ])
      setMermas(mermasData)
      setProductos(productosData)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const resetForm = () => { setFormData({ id_producto: '', cantidad: '', motivo: '', motivoOtro: '' }) }

  const handleSubmit = async () => {
    if (!formData.id_producto || !formData.cantidad || !formData.motivo) {
      toast({ title: 'Error', description: 'Completa todos los campos requeridos', variant: 'destructive' })
      return
    }
    const motivoFinal = formData.motivo === 'Otro' ? formData.motivoOtro : formData.motivo
    try {
      await api.createMerma({
        id_producto: parseInt(formData.id_producto),
        cantidad: parseInt(formData.cantidad),
        motivo: motivoFinal
      })
      toast({ title: 'Merma registrada' })
      cargarDatos()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar la merma', variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const totalPerdida = mermas.reduce((sum, m) => {
    const producto = productos.find(p => p.id_producto === m.id_producto)
    return sum + (m.cantidad * (producto?.precio || 0))
  }, 0)

  const mermasPorMotivo = mermas.reduce((acc: Record<string, number>, m) => {
    acc[m.motivo] = (acc[m.motivo] || 0) + m.cantidad
    return acc
  }, {})

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando mermas...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-[#4C3D19]">Mermas</h1><p className="text-[#889063] mt-1">Registro de pérdidas de productos</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]"><Plus className="w-4 h-4 mr-2" />Registrar Merma</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#4C3D19]">Registrar Merma</DialogTitle>
              <DialogDescription className="text-[#889063]">Documenta la pérdida de un producto</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-[#4C3D19]">Producto</Label>
                <Select value={formData.id_producto} onValueChange={(value) => setFormData({...formData, id_producto: value})}>
                  <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona un producto" /></SelectTrigger>
                  <SelectContent>{productos.map(p => <SelectItem key={p.id_producto} value={p.id_producto.toString()}>{p.nombre_producto} - {formatCurrency(p.precio)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-[#4C3D19]">Cantidad</Label><Input type="number" min="1" value={formData.cantidad} onChange={(e) => setFormData({...formData, cantidad: e.target.value})} className="border-[#CFBB99]" /></div>
              <div className="space-y-2"><Label className="text-[#4C3D19]">Motivo</Label>
                <Select value={formData.motivo} onValueChange={(value) => setFormData({...formData, motivo: value})}>
                  <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona el motivo" /></SelectTrigger>
                  <SelectContent>{motivosMerma.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {formData.motivo === 'Otro' && <div className="space-y-2"><Label className="text-[#4C3D19]">Especifica</Label><Textarea value={formData.motivoOtro} onChange={(e) => setFormData({...formData, motivoOtro: e.target.value})} className="border-[#CFBB99]" /></div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={handleSubmit}>Registrar Merma</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-red-700">Pérdida Total</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-700">{formatCurrency(totalPerdida)}</div></CardContent></Card>
        <Card className="border-[#CFBB99]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-[#889063]">Total Mermas</CardTitle><Calendar className="h-4 w-4 text-[#889063]" /></CardHeader><CardContent><div className="text-2xl font-bold text-[#4C3D19]">{mermas.length}</div></CardContent></Card>
        <Card className="border-[#CFBB99]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-[#889063]">Unidades Perdidas</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-[#4C3D19]">{mermas.reduce((s, m) => s + m.cantidad, 0)}</div></CardContent></Card>
      </div>

      <Card className="border-[#CFBB99]">
        <CardHeader><CardTitle className="text-[#4C3D19]">Historial de Mermas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFBB99]">
                <TableHead className="text-[#4C3D19]">Fecha</TableHead><TableHead className="text-[#4C3D19]">Producto</TableHead><TableHead className="text-[#4C3D19] text-center">Cantidad</TableHead><TableHead className="text-[#4C3D19]">Motivo</TableHead><TableHead className="text-[#4C3D19]">Registrado por</TableHead><TableHead className="text-[#4C3D19] text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mermas.map(merma => {
                const producto = productos.find(p => p.id_producto === merma.id_producto)
                const valor = merma.cantidad * (producto?.precio || 0)
                return (
                  <TableRow key={merma.id_merma_prod} className="border-[#CFBB99]">
                    <TableCell className="text-[#889063]">{formatDate(merma.fecha_hora)}</TableCell>
                    <TableCell className="font-medium text-[#4C3D19]">{merma.nombre_producto || producto?.nombre_producto}</TableCell>
                    <TableCell className="text-center font-semibold">{merma.cantidad}</TableCell>
                    <TableCell className="text-[#889063]">{merma.motivo}</TableCell>
                    <TableCell className="text-[#889063]">{merma.nombre_usuario}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{formatCurrency(valor)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
