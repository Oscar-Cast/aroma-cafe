'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Mesa } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, LayoutGrid, Users, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/mesas.css'

export function MesasView() {
  const { toast } = useToast()
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)
  const [form, setForm] = useState({ numero_mesa: '', capacidad: 4, ubicacion: 'interior' as 'interior' | 'terraza', estado: 'disponible' as Mesa['estado'] })

  const cargar = async () => {
    try {
      const data = await api.getMesas()
      setMesas(data)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las mesas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const resetForm = () => setForm({ numero_mesa: '', capacidad: 4, ubicacion: 'interior', estado: 'disponible' })

  const handleCreate = async () => {
    if (!form.numero_mesa.trim()) {
      toast({ title: 'Error', description: 'El nombre de la mesa es requerido', variant: 'destructive' })
      return
    }
    try {
      await api.createMesa(form)
      toast({ title: 'Mesa creada', description: `${form.numero_mesa} agregada` })
      setCreateOpen(false)
      resetForm()
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleEdit = async () => {
    if (!editingMesa) return
    try {
      await api.updateMesa(editingMesa.id_mesa, form)
      toast({ title: 'Mesa actualizada' })
      setEditOpen(false)
      setEditingMesa(null)
      resetForm()
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (mesa: Mesa) => {
    if (mesa.estado === 'ocupada') {
      toast({ title: 'Error', description: 'No se puede eliminar una mesa ocupada', variant: 'destructive' })
      return
    }
    try {
      await api.deleteMesa(mesa.id_mesa)
      toast({ title: 'Mesa eliminada', description: `${mesa.numero_mesa} eliminada` })
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const openEdit = (mesa: Mesa) => {
    setEditingMesa(mesa)
    setForm({ numero_mesa: mesa.numero_mesa, capacidad: mesa.capacidad, ubicacion: mesa.ubicacion, estado: mesa.estado })
    setEditOpen(true)
  }

  const statusClass = (estado: Mesa['estado']) => `mesas-badge ${estado}`

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando mesas...</div>

  return (
    <div className="mesas-page">
      <div className="mesas-header">
        <div>
          <h1>Mesas</h1>
          <p>Gestiona las mesas del establecimiento</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus size={16} style={{ marginRight: '0.5rem' }} /> Nueva Mesa
        </button>
      </div>

      <div className="mesas-stats-grid">
        <Card className="mesas-stat-card">
          <div><div className="label">Total Mesas</div><div className="value">{mesas.length}</div></div>
          <LayoutGrid size={32} style={{ color: 'var(--caramel)' }} />
        </Card>
        <Card className="mesas-stat-card" style={{ borderColor: '#86efac', background: '#f0fdf4' }}>
          <div><div className="label">Disponibles</div><div className="value">{mesas.filter(m => m.estado === 'disponible').length}</div></div>
          <LayoutGrid size={28} style={{ color: '#16a34a' }} />
        </Card>
        <Card className="mesas-stat-card" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
          <div><div className="label">Ocupadas</div><div className="value">{mesas.filter(m => m.estado === 'ocupada').length}</div></div>
          <Users size={28} style={{ color: '#dc2626' }} />
        </Card>
        <Card className="mesas-stat-card">
          <div><div className="label">Capacidad Total</div><div className="value">{mesas.reduce((sum, m) => sum + m.capacidad, 0)}</div></div>
          <Users size={32} style={{ color: 'var(--caramel)' }} />
        </Card>
      </div>

      <Card className="mesas-table-card">
        <div style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--chocolate)' }}>Lista de Mesas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Mesa</TableHead><TableHead>Capacidad</TableHead><TableHead>Ubicación</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {mesas.map(m => (
              <TableRow key={m.id_mesa}>
                <TableCell style={{ fontWeight: 500 }}>{m.numero_mesa}</TableCell>
                <TableCell><Users size={14} className="inline" /> {m.capacidad} personas</TableCell>
                <TableCell><MapPin size={14} className="inline" /> {m.ubicacion}</TableCell>
                <TableCell><span className={statusClass(m.estado)}>{m.estado}</span></TableCell>
                <TableCell className="text-right">
                  <button className="btn-outline" style={{ marginRight: '0.25rem' }} onClick={() => openEdit(m)}><Pencil size={14} /></button>
                  <button className="btn-danger" onClick={() => handleDelete(m)} disabled={m.estado === 'ocupada'}><Trash2 size={14} /></button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)' }}>Agregar Nueva Mesa</DialogTitle></DialogHeader>
          <div className="mesas-dialog-form">
            <div><Label>Nombre de la Mesa</Label><Input value={form.numero_mesa} onChange={e => setForm({ ...form, numero_mesa: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Capacidad</Label><Input type="number" min={1} max={20} value={form.capacidad} onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>Ubicación</Label>
                <Select value={form.ubicacion} onValueChange={v => setForm({ ...form, ubicacion: v as 'interior' | 'terraza' })}>
                  <SelectTrigger style={{ borderColor: 'var(--caramel)' }}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="interior">Interior</SelectItem><SelectItem value="terraza">Terraza</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v as Mesa['estado'] })}>
                <SelectTrigger style={{ borderColor: 'var(--caramel)' }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="disponible">Disponible</SelectItem><SelectItem value="ocupada">Ocupada</SelectItem><SelectItem value="reservada">Reservada</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button className="btn-outline" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleCreate}>Crear Mesa</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)' }}>Editar Mesa</DialogTitle></DialogHeader>
          <div className="mesas-dialog-form">
            <div><Label>Nombre de la Mesa</Label><Input value={form.numero_mesa} onChange={e => setForm({ ...form, numero_mesa: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Capacidad</Label><Input type="number" min={1} max={20} value={form.capacidad} onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>Ubicación</Label>
                <Select value={form.ubicacion} onValueChange={v => setForm({ ...form, ubicacion: v as 'interior' | 'terraza' })}>
                  <SelectTrigger style={{ borderColor: 'var(--caramel)' }}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="interior">Interior</SelectItem><SelectItem value="terraza">Terraza</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v as Mesa['estado'] })}>
                <SelectTrigger style={{ borderColor: 'var(--caramel)' }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="disponible">Disponible</SelectItem><SelectItem value="ocupada">Ocupada</SelectItem><SelectItem value="reservada">Reservada</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button className="btn-outline" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleEdit}>Guardar Cambios</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
