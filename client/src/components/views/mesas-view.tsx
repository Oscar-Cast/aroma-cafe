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
      const data = await api.getMesas({ todos: true });
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
          <h1 style={{fontSize: '4rem' }}>Mesas</h1>
          <p style={{fontSize: '2rem', fontWeight: '700', color: 'rgb(114, 92, 63,0.5)'}}>Gestiona las mesas del establecimiento</p>
        </div>
        <button className="btn-primary" style={{fontSize: '1.5rem'}} onClick={() => { resetForm(); setCreateOpen(true);}}>
          <Plus size={30} style={{ marginRight: '0.5rem', display: 'inline-flex' }} /> Nueva Mesa
        </button>
      </div>
      <div className="mesas-stats-grid">
        <Card className="mesas-stat-card">
          <div>
            <div className="label" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--chocolate)' }}>Total Mesas</div>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)', textAlign: 'center' }}>{mesas.length}</div>
          </div>
          <LayoutGrid size={40} style={{ color: 'var(--caramel)' }} />
        </Card>
        <Card className="mesas-stat-card" style={{ borderColor: '#86efac', background: '#f0fdf4' }}>
          <div>
            <div className="label" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--chocolate)' }}>Disponibles</div>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)', textAlign: 'center' }}>{mesas.filter(m => m.estado === 'disponible').length}</div>
          </div>
          <LayoutGrid size={40} style={{ color: '#16a34a' }} />
        </Card>
        <Card className="mesas-stat-card" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
          <div>
            <div className="label" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--chocolate)' }}>Ocupadas</div>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)', textAlign: 'center' }}>{mesas.filter(m => m.estado === 'ocupada').length}</div>
          </div>
          <Users size={40} style={{ color: '#dc2626' }} />
        </Card>
        <Card className="mesas-stat-card">
          <div>
            <div className="label" style={{ fontSize: '1.7rem', fontWeight: 600, color: 'var(--chocolate)' }}>Capacidad Total</div>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.6)', textAlign: 'center' }}>{mesas.reduce((sum, m) => sum + m.capacidad, 0)}</div>
          </div>
          <Users size={40} style={{ color: 'var(--caramel)' }} />
        </Card>
      </div>

      <Card className="mesas-table-card">
        <div style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--chocolate)', textAlign: 'center' }}>Lista de Mesas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Capacidad</TableHead>
              <TableHead style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Espacio</TableHead>
              <TableHead style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Ubicación</TableHead>
              <TableHead style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Estado</TableHead>
              <TableHead style={{fontSize:'1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)', textAlign: 'right'}}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mesas.map(m => (
              <TableRow key={m.id_mesa}>
                <TableCell style={{ fontWeight: 500, fontSize: '1.3rem' }}>{m.numero_mesa}</TableCell>
                <TableCell style={{fontWeight: 500, fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)'}}><Users size={20} className="inline" /> {m.capacidad} personas</TableCell>
                <TableCell style={{fontWeight: 500, fontSize: '1.3rem', color: 'rgb(114, 92, 63, 0.7)'}}><MapPin size={20} className="inline" /> {m.ubicacion}</TableCell>
                <TableCell ><span className={statusClass(m.estado)}>{m.estado}</span></TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <button className="btn-outline" style={{ marginRight: '0.25rem' }} onClick={() => openEdit(m)}>
                    <Pencil size={20} />
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(m)} disabled={m.estado === 'ocupada'}>
                    <Trash2 size={20} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)', fontWeight: 600, fontSize: '2rem' }}>Agregar Nueva Mesa</DialogTitle></DialogHeader>
          <div className="mesas-dialog-form"  >
            <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Nombre de la Mesa</Label>
            <Input value={form.numero_mesa} onChange={e => setForm({ ...form, numero_mesa: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div ><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Capacidad</Label >
              <Input min={1} max={20} value={form.capacidad} onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) || 1 })} />
              </div>
              <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Ubicación</Label>
                <Select value={form.ubicacion} onValueChange={v => setForm({ ...form, ubicacion: v as 'interior' | 'terraza' })}>
                  <SelectTrigger style={{ borderColor: 'var(--caramel)', fontSize: '1.2rem' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interior" style={{fontSize: '1.2rem'}}>Interior</SelectItem>
                    <SelectItem value="terraza" style={{fontSize: '1.2rem'}}>Terraza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v as Mesa['estado'] })}>
                <SelectTrigger style={{ borderColor: 'var(--caramel)', fontSize: '1.2rem' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible" style={{fontSize: '1.2rem'}} >Disponible</SelectItem>
                  <SelectItem value="ocupada" style={{fontSize: '1.2rem'}}>Ocupada</SelectItem>
                  <SelectItem value="reservada" style={{fontSize: '1.2rem'}}>Reservada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button className="btn-outline" onClick={() => setCreateOpen(false)} style={{backgroundColor: 'var(--chocolate)', color : 'white', fontSize: '1.3rem'}}>Cancelar</button>
            <button className="btn-primary" onClick={handleCreate} style= {{fontSize: '1.3rem'}}>Crear Mesa</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)', fontWeight: 600, fontSize: '2rem' }}>Editar Mesa</DialogTitle></DialogHeader>
          <div className="mesas-dialog-form">
            <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Nombre de la Mesa</Label>
            <Input value={form.numero_mesa} onChange={e => setForm({ ...form, numero_mesa: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Capacidad</Label><Input type="number" min={1} max={20} value={form.capacidad} onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) || 1 })} />
              </div>
              <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Ubicación</Label>
                <Select value={form.ubicacion} onValueChange={v => setForm({ ...form, ubicacion: v as 'interior' | 'terraza' })}>
                  <SelectTrigger style={{ borderColor: 'var(--caramel)', fontSize: '1.2rem' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interior" style={{ fontSize: '1.2rem' }}>Interior</SelectItem>
                    <SelectItem value="terraza" style={{ fontSize: '1.2rem' }}>Terraza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label style={{fontSize: '1.5rem',fontWeight: 600, color:'rgb(114, 92, 63, 0.7)'}}>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm({ ...form, estado: v as Mesa['estado'] })}>
                <SelectTrigger style={{ borderColor: 'var(--caramel)', fontSize: '1.2rem' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible" style={{ fontSize: '1.2rem' }}>Disponible</SelectItem>
                  <SelectItem value="ocupada" style={{ fontSize: '1.2rem' }}>Ocupada</SelectItem>
                  <SelectItem value="reservada" style={{ fontSize: '1.2rem' }}>Reservada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button className="btn-outline" onClick={() => setEditOpen(false)} style={{backgroundColor: 'var(--chocolate)', color : 'white', fontSize: '1.3rem'}}>Cancelar</button>
            <button className="btn-primary" onClick={handleEdit} style={{fontSize: '1.3rem'}}>Guardar Cambios</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
