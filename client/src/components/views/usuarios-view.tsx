'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { UserRole } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Users, Plus, Edit2, ShieldCheck, DollarSign, GlassWater, Utensils } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Usuario {
  id_usuario: number
  nombre_completo: string
  nombre_usuario: string
  rol: UserRole
  estado: 'activo' | 'inactivo'
  fecha_alta: string
}

const rolesInfo: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  administrador: { label: 'Administrador', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  cajero: { label: 'Cajero', icon: <DollarSign className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  mesero: { label: 'Mesero', icon: <Users className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  barra: { label: 'Barra', icon: <GlassWater className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
  cocina: { label: 'Cocina', icon: <Utensils className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
}

export function UsuariosView() {
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    nombre_completo: '', nombre_usuario: '', contrasena: '', rol: '' as UserRole | '', estado: 'activo' as 'activo' | 'inactivo'
  })

  const cargarUsuarios = async () => {
    try {
      const data = await api.getUsuarios()
      setUsuarios(data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los usuarios', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarUsuarios() }, [])

  const resetForm = () => {
    setFormData({ nombre_completo: '', nombre_usuario: '', contrasena: '', rol: '', estado: 'activo' })
    setEditingUsuario(null)
  }

  const openEditDialog = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      nombre_completo: usuario.nombre_completo,
      nombre_usuario: usuario.nombre_usuario,
      contrasena: '',
      rol: usuario.rol,
      estado: usuario.estado
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nombre_completo || !formData.nombre_usuario || !formData.rol || (!editingUsuario && !formData.contrasena)) {
      toast({ title: 'Error', description: 'Campos requeridos', variant: 'destructive' })
      return
    }
    try {
      if (editingUsuario) {
        await api.updateUsuario(editingUsuario.id_usuario, formData)
        toast({ title: 'Usuario actualizado' })
      } else {
        await api.createUsuario(formData)
        toast({ title: 'Usuario creado' })
      }
      cargarUsuarios()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
    }
  }

  const toggleEstado = async (usuario: Usuario) => {
    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await api.updateUsuario(usuario.id_usuario, { estado: nuevoEstado })
      toast({ title: 'Estado actualizado' })
      cargarUsuarios()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cambiar el estado', variant: 'destructive' })
    }
  }

  const handleBaja = async (id: number) => {
    try {
      await api.bajaUsuario(id)
      toast({ title: 'Usuario dado de baja' })
      cargarUsuarios()
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo dar de baja', variant: 'destructive' })
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return <div className="text-center py-12">Cargando usuarios...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-[#4C3D19]">Usuarios</h1></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild><Button className="bg-[#4C3D19]"><Plus className="w-4 h-4 mr-2" />Nuevo Usuario</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="text-[#4C3D19]">{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-[#4C3D19]">Nombre Completo</Label><Input value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} /></div>
              <div className="space-y-2"><Label className="text-[#4C3D19]">Nombre de Usuario</Label><Input value={formData.nombre_usuario} onChange={(e) => setFormData({...formData, nombre_usuario: e.target.value})} /></div>
              {!editingUsuario && <div className="space-y-2"><Label className="text-[#4C3D19]">Contraseña</Label><Input type="password" value={formData.contrasena} onChange={(e) => setFormData({...formData, contrasena: e.target.value})} /></div>}
              <div className="space-y-2"><Label className="text-[#4C3D19]">Rol</Label>
                <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v as UserRole})}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{(Object.keys(rolesInfo) as UserRole[]).map(rol => <SelectItem key={rol} value={rol}><div className="flex items-center gap-2">{rolesInfo[rol].icon}{rolesInfo[rol].label}</div></SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label className="text-[#4C3D19]">Activo</Label><Switch checked={formData.estado === 'activo'} onCheckedChange={(c) => setFormData({...formData, estado: c ? 'activo' : 'inactivo'})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#4C3D19]" onClick={handleSubmit}>{editingUsuario ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.keys(rolesInfo) as UserRole[]).map(rol => (
          <Card key={rol} className="border-[#CFBB99]"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-[#889063]">{rolesInfo[rol].label}</p><p className="text-2xl font-bold">{usuarios.filter(u => u.rol === rol && u.estado === 'activo').length}</p></div><div className={`w-10 h-10 rounded-full flex items-center justify-center ${rolesInfo[rol].color}`}>{rolesInfo[rol].icon}</div></div></CardContent></Card>
        ))}
      </div>

      <Card className="border-[#CFBB99]">
        <CardHeader><CardTitle className="text-[#4C3D19]">Lista de Usuarios</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Fecha Alta</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {usuarios.map(usuario => (
                <TableRow key={usuario.id_usuario}>
                  <TableCell><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#4C3D19] flex items-center justify-center text-[#E5D7C4] font-bold">{usuario.nombre_completo.charAt(0)}</div><div><p className="font-medium">{usuario.nombre_completo}</p><p className="text-sm text-[#889063]">@{usuario.nombre_usuario}</p></div></div></TableCell>
                  <TableCell><Badge variant="outline" className={rolesInfo[usuario.rol].color}><span className="flex items-center gap-1">{rolesInfo[usuario.rol].icon}{rolesInfo[usuario.rol].label}</span></Badge></TableCell>
                  <TableCell className="text-[#889063]">{formatDate(usuario.fecha_alta)}</TableCell>
                  <TableCell className="text-center"><Switch checked={usuario.estado === 'activo'} onCheckedChange={() => toggleEstado(usuario)} /></TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => openEditDialog(usuario)}><Edit2 className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleBaja(usuario.id_usuario)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
