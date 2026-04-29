'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
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

export function MesasView() {
  const { toast } = useToast()
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)
  const [formData, setFormData] = useState({
    numero_mesa: '',
    capacidad: 4,
    ubicacion: 'interior' as 'interior' | 'terraza',
    estado: 'disponible' as 'disponible' | 'ocupada' | 'reservada'
  })

  // Cargar mesas desde la API
  const cargarMesas = async () => {
    try {
      const data = await api.getMesas()
      setMesas(data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las mesas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarMesas()
  }, [])

  const resetForm = () => {
    setFormData({
      numero_mesa: '',
      capacidad: 4,
      ubicacion: 'interior',
      estado: 'disponible'
    })
  }

  const handleCreate = async () => {
    if (!formData.numero_mesa.trim()) {
      toast({ title: 'Error', description: 'El nombre de la mesa es requerido', variant: 'destructive' })
      return
    }

    try {
      await api.createMesa(formData)
      toast({ title: 'Mesa creada', description: `${formData.numero_mesa} ha sido agregada correctamente` })
      resetForm()
      setIsCreateDialogOpen(false)
      cargarMesas() // recargar lista
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la mesa', variant: 'destructive' })
    }
  }

  const handleEdit = async () => {
    if (!editingMesa) return

    try {
      await api.updateMesa(editingMesa.id_mesa, formData)
      toast({ title: 'Mesa actualizada', description: `${formData.numero_mesa} ha sido actualizada` })
      setIsEditDialogOpen(false)
      setEditingMesa(null)
      resetForm()
      cargarMesas() // recargar lista
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la mesa', variant: 'destructive' })
    }
  }

  const handleDelete = async (mesa: Mesa) => {
    if (mesa.estado === 'ocupada') {
      toast({ title: 'Error', description: 'No se puede eliminar una mesa ocupada', variant: 'destructive' })
      return
    }

    try {
      await api.deleteMesa(mesa.id_mesa)
      toast({ title: 'Mesa eliminada', description: `${mesa.numero_mesa} ha sido eliminada` })
      cargarMesas() // recargar lista
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la mesa', variant: 'destructive' })
    }
  }

  const openEditDialog = (mesa: Mesa) => {
    setEditingMesa(mesa)
    setFormData({
      numero_mesa: mesa.numero_mesa,
      capacidad: mesa.capacidad,
      ubicacion: mesa.ubicacion,
      estado: mesa.estado
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (estado: Mesa['estado']) => {
    const styles: Record<Mesa['estado'], string> = {
      'disponible': 'bg-green-100 text-green-700 border-green-200',
      'ocupada': 'bg-red-100 text-red-700 border-red-200',
      'reservada': 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return <Badge className={styles[estado]} variant="outline">{estado}</Badge>
  }

  const getUbicacionBadge = (ubicacion: Mesa['ubicacion']) => {
    return (
      <Badge variant="outline" className="bg-[#E5D7C4]/50 text-[#4C3D19] border-[#CFBB99]">
        <MapPin className="w-3 h-3 mr-1" />
        {ubicacion}
      </Badge>
    )
  }

  const mesasInterior = mesas.filter(m => m.ubicacion === 'interior')
  const mesasTerraza = mesas.filter(m => m.ubicacion === 'terraza')
  const mesasDisponibles = mesas.filter(m => m.estado === 'disponible').length
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length

  const MesaFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[#4C3D19]">Nombre de la Mesa</Label>
        <Input
          placeholder="Ej: Mesa 9"
          value={formData.numero_mesa}
          onChange={(e) => setFormData({ ...formData, numero_mesa: e.target.value })}
          className="border-[#CFBB99] focus:border-[#4C3D19]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[#4C3D19]">Capacidad (personas)</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={formData.capacidad}
            onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })}
            className="border-[#CFBB99] focus:border-[#4C3D19]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#4C3D19]">Ubicacion</Label>
          <Select 
            value={formData.ubicacion} 
            onValueChange={(v) => setFormData({ ...formData, ubicacion: v as 'interior' | 'terraza' })}
          >
            <SelectTrigger className="border-[#CFBB99]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interior">Interior</SelectItem>
              <SelectItem value="terraza">Terraza</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-[#4C3D19]">Estado</Label>
        <Select 
          value={formData.estado} 
          onValueChange={(v) => setFormData({ ...formData, estado: v as 'disponible' | 'ocupada' | 'reservada' })}
        >
          <SelectTrigger className="border-[#CFBB99]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="ocupada">Ocupada</SelectItem>
            <SelectItem value="reservada">Reservada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando mesas...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#4C3D19] rounded-full flex items-center justify-center">
            <LayoutGrid className="w-6 h-6 text-[#E5D7C4]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#4C3D19]">Mesas</h1>
            <p className="text-[#889063]">Gestiona las mesas del establecimiento</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Mesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#4C3D19]">Agregar Nueva Mesa</DialogTitle>
              <DialogDescription className="text-[#889063]">
                Configura los detalles de la nueva mesa
              </DialogDescription>
            </DialogHeader>
            <MesaFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false) }}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]"
                onClick={handleCreate}
              >
                Crear Mesa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-[#CFBB99]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#889063]">Total Mesas</p>
                <p className="text-3xl font-bold text-[#4C3D19]">{mesas.length}</p>
              </div>
              <LayoutGrid className="w-10 h-10 text-[#889063]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Disponibles</p>
                <p className="text-3xl font-bold text-green-800">{mesasDisponibles}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Ocupadas</p>
                <p className="text-3xl font-bold text-red-800">{mesasOcupadas}</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#889063]">Capacidad Total</p>
                <p className="text-3xl font-bold text-[#4C3D19]">{mesas.reduce((sum, m) => sum + m.capacidad, 0)}</p>
              </div>
              <Users className="w-10 h-10 text-[#889063]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Lista de Mesas</CardTitle>
          <CardDescription className="text-[#889063]">
            Interior: {mesasInterior.length} • Terraza: {mesasTerraza.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#CFBB99]">
                <TableHead className="text-[#4C3D19]">Mesa</TableHead>
                <TableHead className="text-[#4C3D19]">Capacidad</TableHead>
                <TableHead className="text-[#4C3D19]">Ubicacion</TableHead>
                <TableHead className="text-[#4C3D19]">Estado</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mesas.map((mesa) => (
                <TableRow key={mesa.id_mesa} className="border-[#CFBB99]/50">
                  <TableCell className="font-medium text-[#4C3D19]">
                    {mesa.numero_mesa}
                  </TableCell>
                  <TableCell className="text-[#889063]">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {mesa.capacidad} personas
                    </div>
                  </TableCell>
                  <TableCell>
                    {getUbicacionBadge(mesa.ubicacion)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(mesa.estado)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#CFBB99] text-[#4C3D19]"
                        onClick={() => openEditDialog(mesa)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(mesa)}
                        disabled={mesa.estado === 'ocupada'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#4C3D19]">Editar Mesa</DialogTitle>
            <DialogDescription className="text-[#889063]">
              Modifica los detalles de la mesa
            </DialogDescription>
          </DialogHeader>
          <MesaFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false) }}>
              Cancelar
            </Button>
            <Button 
              className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]"
              onClick={handleEdit}
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
