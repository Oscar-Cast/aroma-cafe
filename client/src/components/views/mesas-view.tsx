'use client'

import { useState } from 'react'
import { Mesa } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, LayoutGrid, Users, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const mesasIniciales: Mesa[] = [
  { id_mesa: 1, numero_mesa: 'Mesa 1', capacidad: 4, ubicacion: 'interior', estado: 'disponible' },
  { id_mesa: 2, numero_mesa: 'Mesa 2', capacidad: 2, ubicacion: 'interior', estado: 'ocupada' },
  { id_mesa: 3, numero_mesa: 'Mesa 3', capacidad: 6, ubicacion: 'interior', estado: 'disponible' },
  { id_mesa: 4, numero_mesa: 'Mesa 4', capacidad: 4, ubicacion: 'interior', estado: 'ocupada' },
  { id_mesa: 5, numero_mesa: 'Mesa 5', capacidad: 2, ubicacion: 'terraza', estado: 'disponible' },
]

export function MesasView() {
  const { toast } = useToast()
  const [mesas, setMesas] = useState<Mesa[]>(mesasIniciales)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)
  const [formData, setFormData] = useState({ numero_mesa: '', capacidad: 4, ubicacion: 'interior' as 'interior' | 'terraza', estado: 'disponible' as Mesa['estado'] })

  const resetForm = () => setFormData({ numero_mesa: '', capacidad: 4, ubicacion: 'interior', estado: 'disponible' })

  const handleCreate = () => {
    if (!formData.numero_mesa.trim()) return toast({ title: 'Error', description: 'Nombre de mesa requerido', variant: 'destructive' })
    const nueva: Mesa = { id_mesa: Math.max(...mesas.map(m => m.id_mesa)) + 1, ...formData }
    setMesas(prev => [...prev, nueva])
    toast({ title: 'Mesa creada', description: `${formData.numero_mesa} agregada` })
    resetForm(); setIsCreateDialogOpen(false)
  }

  const handleEdit = () => {
    if (!editingMesa) return
    setMesas(prev => prev.map(m => m.id_mesa === editingMesa.id_mesa ? { ...m, ...formData } : m))
    toast({ title: 'Mesa actualizada' })
    setIsEditDialogOpen(false); setEditingMesa(null); resetForm()
  }

  const handleDelete = (mesa: Mesa) => {
    if (mesa.estado === 'ocupada') return toast({ title: 'Error', description: 'No se puede eliminar una mesa ocupada', variant: 'destructive' })
    setMesas(prev => prev.filter(m => m.id_mesa !== mesa.id_mesa))
    toast({ title: 'Mesa eliminada' })
  }

  const openEditDialog = (mesa: Mesa) => { setEditingMesa(mesa); setFormData({ numero_mesa: mesa.numero_mesa, capacidad: mesa.capacidad, ubicacion: mesa.ubicacion, estado: mesa.estado }); setIsEditDialogOpen(true) }

  const getStatusBadge = (estado: Mesa['estado']) => {
    const styles = { disponible: 'bg-green-100 text-green-700', ocupada: 'bg-red-100 text-red-700', reservada: 'bg-amber-100 text-amber-700' }
    return <Badge className={styles[estado]} variant="outline">{estado}</Badge>
  }

  const MesasForm = () => (
    <div className="space-y-4">
      <div className="space-y-2"><Label className="text-[#4C3D19]">Nombre</Label><Input value={formData.numero_mesa} onChange={(e) => setFormData({...formData, numero_mesa: e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label className="text-[#4C3D19]">Capacidad</Label><Input type="number" min={1} max={20} value={formData.capacidad} onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value) || 1})} /></div>
        <div className="space-y-2"><Label className="text-[#4C3D19]">Ubicación</Label><Select value={formData.ubicacion} onValueChange={(v) => setFormData({...formData, ubicacion: v as 'interior' | 'terraza'})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="interior">Interior</SelectItem><SelectItem value="terraza">Terraza</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-2"><Label className="text-[#4C3D19]">Estado</Label><Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v as Mesa['estado']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="disponible">Disponible</SelectItem><SelectItem value="ocupada">Ocupada</SelectItem><SelectItem value="reservada">Reservada</SelectItem></SelectContent></Select></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-12 h-12 bg-[#4C3D19] rounded-full flex items-center justify-center"><LayoutGrid className="w-6 h-6 text-[#E5D7C4]" /></div><div><h1 className="text-3xl font-bold text-[#4C3D19]">Mesas</h1><p className="text-[#889063]">Gestión de mesas</p></div></div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild><Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]"><Plus className="w-4 h-4 mr-2" />Nueva Mesa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[#4C3D19]">Agregar Mesa</DialogTitle></DialogHeader>
            <MesasForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false) }}>Cancelar</Button>
              <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={handleCreate}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border-[#CFBB99]"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[#889063]">Total Mesas</p><p className="text-3xl font-bold text-[#4C3D19]">{mesas.length}</p></div><LayoutGrid className="w-10 h-10 text-[#889063]" /></div></CardContent></Card>
        <Card className="border-green-200 bg-green-50"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-green-700">Disponibles</p><p className="text-3xl font-bold text-green-800">{mesas.filter(m => m.estado === 'disponible').length}</p></div><LayoutGrid className="w-5 h-5 text-green-700" /></div></CardContent></Card>
        <Card className="border-red-200 bg-red-50"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-red-700">Ocupadas</p><p className="text-3xl font-bold text-red-800">{mesas.filter(m => m.estado === 'ocupada').length}</p></div><Users className="w-5 h-5 text-red-700" /></div></CardContent></Card>
        <Card className="border-[#CFBB99]"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[#889063]">Capacidad Total</p><p className="text-3xl font-bold text-[#4C3D19]">{mesas.reduce((s, m) => s + m.capacidad, 0)}</p></div><Users className="w-10 h-10 text-[#889063]" /></div></CardContent></Card>
      </div>

      <Card className="border-[#CFBB99]">
        <CardHeader><CardTitle className="text-[#4C3D19]">Lista de Mesas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow className="border-[#CFBB99]"><TableHead className="text-[#4C3D19]">Mesa</TableHead><TableHead className="text-[#4C3D19]">Capacidad</TableHead><TableHead className="text-[#4C3D19]">Ubicación</TableHead><TableHead className="text-[#4C3D19]">Estado</TableHead><TableHead className="text-[#4C3D19] text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {mesas.map(mesa => (
                <TableRow key={mesa.id_mesa}><TableCell className="font-medium">{mesa.numero_mesa}</TableCell><TableCell className="text-[#889063]"><Users className="w-4 h-4 inline mr-1" />{mesa.capacidad}</TableCell><TableCell><Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{mesa.ubicacion}</Badge></TableCell><TableCell>{getStatusBadge(mesa.estado)}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openEditDialog(mesa)}><Pencil className="w-4 h-4" /></Button><Button variant="outline" size="sm" className="ml-1 border-red-200 text-red-600" disabled={mesa.estado === 'ocupada'} onClick={() => handleDelete(mesa)}><Trash2 className="w-4 h-4" /></Button></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-[#4C3D19]">Editar Mesa</DialogTitle></DialogHeader>
          <MesasForm />
          <DialogFooter><Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false) }}>Cancelar</Button><Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]" onClick={handleEdit}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
