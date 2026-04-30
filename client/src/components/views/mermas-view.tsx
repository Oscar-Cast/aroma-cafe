'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { MermaProducto, Producto, Insumo } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const motivosMerma = [
  'Caducidad', 'Daño en transporte', 'Daño en almacén', 'Producto defectuoso',
  'Error de preparación', 'Devolución de cliente', 'Otro'
]

export function MermasView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('productos')
  // Productos
  const [mermasProd, setMermasProd] = useState<MermaProducto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [showDialogProd, setShowDialogProd] = useState(false)
  // Insumos
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [showDialogInsumo, setShowDialogInsumo] = useState(false)
  // Formularios
  const [formProd, setFormProd] = useState({ id_producto: '', cantidad: '', motivo: '', motivoOtro: '' })
  const [formInsumo, setFormInsumo] = useState({ id_insumo: '', cantidad: '', motivo: '', motivoOtro: '' })

  const cargarDatos = async () => {
    try {
      const [mermasData, productosData, movsData, insumosData] = await Promise.all([
        api.getMermas(),
        api.getProductos(),
        api.getMovimientosInventario(),
        api.getInsumos()
      ])
      setMermasProd(mermasData)
      setProductos(productosData)
      setMovimientos(movsData.filter((m: any) => m.tipo_movimiento.startsWith('merma')))
      setInsumos(insumosData)
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    }
  }

  useEffect(() => { cargarDatos() }, [])

  // Registro merma producto
  const handleProdSubmit = async () => {
    if (!formProd.id_producto || !formProd.cantidad || !formProd.motivo) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' })
      return
    }
    const motivoFinal = formProd.motivo === 'Otro' ? formProd.motivoOtro : formProd.motivo
    try {
      await api.createMerma({
        id_producto: parseInt(formProd.id_producto),
        cantidad: parseInt(formProd.cantidad),
        motivo: motivoFinal
      })
      toast({ title: 'Merma de producto registrada' })
      cargarDatos()
      setShowDialogProd(false)
      setFormProd({ id_producto: '', cantidad: '', motivo: '', motivoOtro: '' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  // Registro merma insumo
  const handleInsumoSubmit = async () => {
    if (!formInsumo.id_insumo || !formInsumo.cantidad || !formInsumo.motivo) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' })
      return
    }
    const motivoFinal = formInsumo.motivo === 'Otro' ? formInsumo.motivoOtro : formInsumo.motivo
    try {
      // Usamos el endpoint de registro de movimiento de inventario, con tipo merma_caducidad o merma_dano
      await api.createMovimientoInventario({
        id_insumo: parseInt(formInsumo.id_insumo),
        tipo_movimiento: motivoFinal === 'Caducidad' ? 'merma_caducidad' : 'merma_dano',
        cantidad: parseFloat(formInsumo.cantidad)
      })
      toast({ title: 'Merma de insumo registrada' })
      cargarDatos()
      setShowDialogInsumo(false)
      setFormInsumo({ id_insumo: '', cantidad: '', motivo: '', motivoOtro: '' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4C3D19]">Mermas</h1>
        <p className="text-[#889063] mt-1">Registro de pérdidas de productos e insumos</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#CFBB99]/30">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="insumos">Insumos</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-6 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#4C3D19]">Mermas de productos</h2>
            <Button className="bg-[#4C3D19]" onClick={() => setShowDialogProd(true)}>
              <Plus className="w-4 h-4 mr-2" /> Registrar merma
            </Button>
          </div>

          <Card className="border-[#CFBB99]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mermasProd.map(m => {
                    const prod = productos.find(p => p.id_producto === m.id_producto)
                    const valor = m.cantidad * (prod?.precio || 0)
                    return (
                      <TableRow key={m.id_merma_prod}>
                        <TableCell className="text-sm">{formatDate(m.fecha_hora)}</TableCell>
                        <TableCell className="font-medium">{m.nombre_producto || prod?.nombre_producto}</TableCell>
                        <TableCell className="text-center">{m.cantidad}</TableCell>
                        <TableCell>{m.motivo}</TableCell>
                        <TableCell>{m.nombre_usuario}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(valor)}</TableCell>
                      </TableRow>
                    )
                  })}
                  {mermasProd.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-[#889063]">No hay mermas de productos</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insumos" className="space-y-6 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#4C3D19]">Mermas de insumos</h2>
            <Button className="bg-[#4C3D19]" onClick={() => setShowDialogInsumo(true)}>
              <Plus className="w-4 h-4 mr-2" /> Registrar merma
            </Button>
          </div>

          <Card className="border-[#CFBB99]">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Registrado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov: any) => {
                    const ins = insumos.find(i => i.id_insumo === mov.id_insumo)
                    return (
                      <TableRow key={mov.id_movimiento}>
                        <TableCell className="text-sm">{formatDate(mov.fecha_movimiento)}</TableCell>
                        <TableCell className="font-medium">{ins?.nombre_insumo || 'N/A'}</TableCell>
                        <TableCell className="text-center">{mov.cantidad}</TableCell>
                        <TableCell>{ins?.unidad_medida || ''}</TableCell>
                        <TableCell>{mov.tipo_movimiento === 'merma_caducidad' ? 'Caducidad' : 'Daño'}</TableCell>
                        <TableCell>{mov.nombre_usuario}</TableCell>
                      </TableRow>
                    )
                  })}
                  {movimientos.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-[#889063]">No hay mermas de insumos</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo merma producto */}
      <Dialog open={showDialogProd} onOpenChange={setShowDialogProd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Registrar merma de producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={formProd.id_producto} onValueChange={(v) => setFormProd({ ...formProd, id_producto: v })}>
                <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {productos.map(p => <SelectItem key={p.id_producto} value={p.id_producto.toString()}>{p.nombre_producto} - {formatCurrency(p.precio)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" min="1" value={formProd.cantidad} onChange={e => setFormProd({ ...formProd, cantidad: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={formProd.motivo} onValueChange={(v) => setFormProd({ ...formProd, motivo: v })}>
                <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {motivosMerma.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {formProd.motivo === 'Otro' && <div className="space-y-2"><Label>Especifica</Label><Textarea value={formProd.motivoOtro} onChange={e => setFormProd({ ...formProd, motivoOtro: e.target.value })} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogProd(false)}>Cancelar</Button>
            <Button className="bg-[#4C3D19]" onClick={handleProdSubmit}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo merma insumo */}
      <Dialog open={showDialogInsumo} onOpenChange={setShowDialogInsumo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Registrar merma de insumo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Insumo</Label>
              <Select value={formInsumo.id_insumo} onValueChange={(v) => setFormInsumo({ ...formInsumo, id_insumo: v })}>
                <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {insumos.map(i => <SelectItem key={i.id_insumo} value={i.id_insumo.toString()}>{i.nombre_insumo} ({i.unidad_medida})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" step="0.01" value={formInsumo.cantidad} onChange={e => setFormInsumo({ ...formInsumo, cantidad: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={formInsumo.motivo} onValueChange={(v) => setFormInsumo({ ...formInsumo, motivo: v })}>
                <SelectTrigger className="border-[#CFBB99]"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {motivosMerma.filter(m => m !== 'Otro').map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogInsumo(false)}>Cancelar</Button>
            <Button className="bg-[#4C3D19]" onClick={handleInsumoSubmit}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
