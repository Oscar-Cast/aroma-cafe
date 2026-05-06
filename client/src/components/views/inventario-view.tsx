'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Insumo } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Package, Plus, Edit2, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/inventario.css'

export function InventarioView() {
  const { toast } = useToast()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [ajusteInsumo, setAjusteInsumo] = useState<Insumo | null>(null)
  const [ajusteCantidad, setAjusteCantidad] = useState('')
  const [form, setForm] = useState({ nombre_insumo: '', unidad_medida: '', existencia_actual: '', nivel_minimo: '' })

  const cargar = async () => {
    try {
      const data = await api.getInsumos()
      setInsumos(data)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los insumos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const resetForm = () => { setForm({ nombre_insumo: '', unidad_medida: '', existencia_actual: '', nivel_minimo: '' }); setEditingInsumo(null) }

  const openEdit = (i: Insumo) => {
    setEditingInsumo(i)
    setForm({ nombre_insumo: i.nombre_insumo, unidad_medida: i.unidad_medida, existencia_actual: i.existencia_actual.toString(), nivel_minimo: i.nivel_minimo.toString() })
    setDialogOpen(true)
  }

  const openAjuste = (i: Insumo) => { setAjusteInsumo(i); setAjusteCantidad(''); setAjusteOpen(true) }

  const handleSubmit = async () => {
    if (!form.nombre_insumo || !form.unidad_medida || !form.existencia_actual || !form.nivel_minimo) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' })
      return
    }
    const data = { nombre_insumo: form.nombre_insumo, unidad_medida: form.unidad_medida, existencia_actual: parseFloat(form.existencia_actual), nivel_minimo: parseFloat(form.nivel_minimo) }
    try {
      if (editingInsumo) { await api.updateInsumo(editingInsumo.id_insumo, data); toast({ title: 'Insumo actualizado' }) }
      else { await api.createInsumo(data); toast({ title: 'Insumo creado' }) }
      cargar(); setDialogOpen(false); resetForm()
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  }

  const handleAjuste = async (tipo: 'entrada' | 'salida') => {
    if (!ajusteInsumo || !ajusteCantidad) return
    const cantidad = parseFloat(ajusteCantidad)
    const nueva = tipo === 'entrada' ? ajusteInsumo.existencia_actual + cantidad : Math.max(0, ajusteInsumo.existencia_actual - cantidad)
    try {
      await api.updateInsumo(ajusteInsumo.id_insumo, { existencia_actual: nueva })
      toast({ title: tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada' })
      cargar(); setAjusteOpen(false); setAjusteInsumo(null); setAjusteCantidad('')
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)

  const getStockStatus = (i: Insumo) => {
    const pct = (i.existencia_actual / (i.nivel_minimo * 3)) * 100
    if (i.existencia_actual <= i.nivel_minimo) return { color: 'red', label: 'Crítico', pct: Math.min(pct, 100) }
    if (i.existencia_actual <= i.nivel_minimo * 1.5) return { color: 'amber', label: 'Bajo', pct }
    return { color: 'green', label: 'Normal', pct: Math.min(pct, 100) }
  }

  const lowStock = insumos.filter(i => i.existencia_actual <= i.nivel_minimo)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando inventario...</div>

  return (
    <div className="inventario-page">
      <div className="inventario-header">
        <div>
          <h1>Inventario</h1>
          <p>Control de insumos y existencias</p>
        </div>
        <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus size={16} style={{ marginRight: '0.5rem' }} /> Nuevo Insumo
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="inventario-alert">
          <div className="icon"><AlertTriangle size={24} color="#dc2626" /></div>
          <div className="text">
            <div className="title">{lowStock.length} insumo(s) en nivel crítico</div>
            <div className="sub">Revisa los niveles y reabastece lo necesario.</div>
          </div>
        </div>
      )}

      <div className="inventario-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Insumo</TableHead><TableHead>Existencia</TableHead><TableHead>Nivel</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {insumos.map(i => {
              const s = getStockStatus(i)
              return (
                <TableRow key={i.id_insumo}>
                  <TableCell><div style={{ fontWeight: 500 }}>{i.nombre_insumo}</div><div style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>{i.unidad_medida}</div></TableCell>
                  <TableCell><div style={{ fontWeight: 600 }}>{i.existencia_actual} {i.unidad_medida}</div><div style={{ fontSize: '0.8rem', color: 'var(--caramel)' }}>Mín: {i.nivel_minimo}</div></TableCell>
                  <TableCell style={{ width: '12rem' }}>
                    <div className="inventario-progress"><div className={`fill ${s.color}`} style={{ width: `${s.pct}%` }} /></div>
                  </TableCell>
                  <TableCell className="text-center"><span className={`inventario-badge ${s.color}`}>{s.label}</span></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" style={{ borderColor: '#86efac', color: '#16a34a', marginRight: '0.25rem' }} onClick={() => openAjuste(i)}><TrendingUp size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(i)}><Edit2 size={14} /></Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)' }}>{editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><Label>Nombre</Label><Input value={form.nombre_insumo} onChange={e => setForm({ ...form, nombre_insumo: e.target.value })} /></div>
            <div><Label>Unidad de Medida</Label><Input value={form.unidad_medida} onChange={e => setForm({ ...form, unidad_medida: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><Label>Existencia Actual</Label><Input type="number" step="0.01" value={form.existencia_actual} onChange={e => setForm({ ...form, existencia_actual: e.target.value })} /></div>
              <div><Label>Nivel Mínimo</Label><Input type="number" step="0.01" value={form.nivel_minimo} onChange={e => setForm({ ...form, nivel_minimo: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button style={{ background: 'var(--chocolate)', color: 'white' }} onClick={handleSubmit}>{editingInsumo ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)' }}>Ajuste de Inventario</DialogTitle></DialogHeader>
          <p style={{ color: 'var(--caramel)', fontSize: '0.9rem' }}>{ajusteInsumo?.nombre_insumo} — Existencia actual: {ajusteInsumo?.existencia_actual} {ajusteInsumo?.unidad_medida}</p>
          <div><Label>Cantidad</Label><Input type="number" step="0.01" value={ajusteCantidad} onChange={e => setAjusteCantidad(e.target.value)} /></div>
          <DialogFooter style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="outline" style={{ borderColor: '#fca5a5', color: '#dc2626', flex: 1 }} onClick={() => handleAjuste('salida')} disabled={!ajusteCantidad}><TrendingDown size={14} style={{ marginRight: '0.25rem' }} /> Salida</Button>
            <Button style={{ background: '#16a34a', color: 'white', flex: 1 }} onClick={() => handleAjuste('entrada')} disabled={!ajusteCantidad}><TrendingUp size={14} style={{ marginRight: '0.25rem' }} /> Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
