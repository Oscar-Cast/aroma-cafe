'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { UserRole } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit2, Trash2, ShieldCheck, GlassWater, Utensils, DollarSign, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/usuarios.css'

interface Usuario {
  id_usuario: number
  nombre_completo: string
  nombre_usuario: string
  rol: UserRole
  estado: 'activo' | 'inactivo'
  fecha_alta: string
}

const rolesInfo: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  administrador: { label: 'Administrador', icon: <ShieldCheck size={16} />, color: 'bg-purple-100 text-purple-700' },
  cajero: { label: 'Cajero', icon: <DollarSign size={16} />, color: 'bg-green-100 text-green-700' },
  mesero: { label: 'Mesero', icon: <Users size={16} />, color: 'bg-blue-100 text-blue-700' },
  barra: { label: 'Barra', icon: <GlassWater size={16} />, color: 'bg-amber-100 text-amber-700' },
  cocina: { label: 'Cocina', icon: <Utensils size={16} />, color: 'bg-red-100 text-red-700' },
}

export function UsuariosView() {
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [form, setForm] = useState({ nombre_completo: '', nombre_usuario: '', contrasena: '', rol: '' as UserRole | '', estado: 'activo' as 'activo' | 'inactivo' })

  const cargar = async () => {
    try {
      const data = await api.getUsuarios()
      setUsuarios(data)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los usuarios', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const resetForm = () => { setForm({ nombre_completo: '', nombre_usuario: '', contrasena: '', rol: '', estado: 'activo' }); setEditingUsuario(null) }

  const openEdit = (u: Usuario) => {
    setEditingUsuario(u)
    setForm({ nombre_completo: u.nombre_completo, nombre_usuario: u.nombre_usuario, contrasena: '', rol: u.rol, estado: u.estado })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.nombre_completo || !form.nombre_usuario || !form.rol || (!editingUsuario && !form.contrasena)) {
      toast({ title: 'Error', description: 'Campos requeridos', variant: 'destructive' })
      return
    }
    try {
      if (editingUsuario) {
        await api.updateUsuario(editingUsuario.id_usuario, form)
        toast({ title: 'Usuario actualizado' })
      } else {
        await api.createUsuario(form)
        toast({ title: 'Usuario creado' })
      }
      cargar(); setDialogOpen(false); resetForm()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo guardar', variant: 'destructive' })
    }
  }

  const toggleEstado = async (u: Usuario) => {
    const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await api.updateUsuario(u.id_usuario, { estado: nuevoEstado } as any)
      toast({ title: 'Estado actualizado' })
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleBaja = async (id: number) => {
    try {
      await api.bajaUsuario(id)
      toast({ title: 'Usuario dado de baja' })
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando usuarios...</div>

  const countByRole = (rol: UserRole) => usuarios.filter(u => u.rol === rol && u.estado === 'activo').length

  return (
    <div className="usuarios-page">
      <div className="usuarios-header">
        <div>
          <h1>Usuarios</h1>
          <p>Gestión de permisos del sistema</p>
        </div>
        <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus size={16} style={{ marginRight: '0.5rem' }} /> Nuevo Usuario
        </Button>
      </div>

      <div className="usuarios-roles-grid">
        {(Object.keys(rolesInfo) as UserRole[]).map(rol => (
          <div className="usuarios-rol-card" key={rol}>
            <span className="rol-label">{rolesInfo[rol].label}</span>
            <span className="rol-count">{countByRole(rol)}</span>
          </div>
        ))}
      </div>

      <div className="usuarios-table-container">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Fecha Alta</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map(u => (
              <TableRow key={u.id_usuario}>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--chocolate)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{u.nombre_completo.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.nombre_completo}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>@{u.nombre_usuario}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className={rolesInfo[u.rol].color}>{rolesInfo[u.rol].icon}<span style={{ marginLeft: '0.25rem' }}>{rolesInfo[u.rol].label}</span></Badge></TableCell>
                <TableCell style={{ color: 'var(--caramel)' }}>{formatDate(u.fecha_alta)}</TableCell>
                <TableCell className="text-center"><Switch checked={u.estado === 'activo'} onCheckedChange={() => toggleEstado(u)} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Edit2 size={16} /></Button>
                  <Button variant="ghost" size="icon" style={{ color: '#ef4444' }} onClick={() => handleBaja(u.id_usuario)}><Trash2 size={16} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="usuarios-card">
        <h2>Niveles de Acceso por Rol</h2>
        <p className="desc">Descripción de permisos para cada rol</p>
        <div className="usuarios-permisos-grid">
          <div className="usuarios-permiso-item" style={{ background: '#f3e8ff', border: '1px solid #d8b4fe' }}>
            <h3 style={{ color: '#7e22ce' }}>Administrador</h3>
            <ul><li>Control total del sistema</li><li>Gestión de usuarios</li><li>Configuración de productos y precios</li><li>Acceso a todos los reportes</li><li>Auditoría financiera</li></ul>
          </div>
          <div className="usuarios-permiso-item" style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
            <h3 style={{ color: '#15803d' }}>Cajero</h3>
            <ul><li>Registro de pedidos</li><li>Procesamiento de pagos</li><li>Cierre de caja</li><li>Cambiar pedido a "Entregado"</li></ul>
          </div>
          <div className="usuarios-permiso-item" style={{ background: '#dbeafe', border: '1px solid #93c5fd' }}>
            <h3 style={{ color: '#1d4ed8' }}>Mesero</h3>
            <ul><li>Registro de pedidos en mesas</li><li>Seguimiento del estado</li><li>Cambiar de "Listo" a "Entregado"</li></ul>
          </div>
          <div className="usuarios-permiso-item" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
            <h3 style={{ color: '#b45309' }}>Barra</h3>
            <ul><li>Ver pedidos de bebidas</li><li>Solo Bebidas Calientes y Frías</li><li>Cambiar a "En Preparación" y "Listo"</li></ul>
          </div>
          <div className="usuarios-permiso-item" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
            <h3 style={{ color: '#b91c1c' }}>Cocina</h3>
            <ul><li>Ver pedidos de alimentos</li><li>Solo categoría "Alimentos"</li><li>Cambiar a "En Preparación" y "Listo"</li></ul>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)' }}>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><Label>Nombre Completo</Label><Input value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} /></div>
            <div><Label>Nombre de Usuario</Label><Input value={form.nombre_usuario} onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} /></div>
            {!editingUsuario && <div><Label>Contraseña</Label><Input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} /></div>}
            <div><Label>Rol</Label>
              <Select value={form.rol} onValueChange={v => setForm({ ...form, rol: v as UserRole })}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{(Object.keys(rolesInfo) as UserRole[]).map(r => <SelectItem key={r} value={r}>{rolesInfo[r].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Label>Activo</Label><Switch checked={form.estado === 'activo'} onCheckedChange={c => setForm({ ...form, estado: c ? 'activo' : 'inactivo' })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={handleSubmit}>{editingUsuario ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
