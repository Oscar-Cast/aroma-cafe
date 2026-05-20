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
import { Package, Plus, Edit2, AlertTriangle, TrendingUp } from 'lucide-react'
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
  const [form, setForm] = useState({
    nombre_insumo: '',
    unidad_medida: '',
    existencia_actual: '',
    nivel_minimo: '',
  })

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

  const resetForm = () => {
    setForm({ nombre_insumo: '', unidad_medida: '', existencia_actual: '', nivel_minimo: '' })
    setEditingInsumo(null)
  }

  const openEdit = (i: Insumo) => {
    setEditingInsumo(i)
    setForm({
      nombre_insumo: i.nombre_insumo,
      unidad_medida: i.unidad_medida,
      existencia_actual: i.existencia_actual.toString(),
      nivel_minimo: i.nivel_minimo.toString(),
    })
    setDialogOpen(true)
  }

  const openAjuste = (i: Insumo) => {
    setAjusteInsumo(i)
    setAjusteCantidad('')
    setAjusteOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.nombre_insumo || !form.unidad_medida || !form.existencia_actual || !form.nivel_minimo) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' })
      return
    }
    const data = {
      nombre_insumo: form.nombre_insumo,
      unidad_medida: form.unidad_medida,
      existencia_actual: parseFloat(form.existencia_actual),
      nivel_minimo: parseFloat(form.nivel_minimo),
    }
    try {
      if (editingInsumo) {
        await api.updateInsumo(editingInsumo.id_insumo, data)
        toast({ title: 'Insumo actualizado' })
      } else {
        await api.createInsumo(data)
        toast({ title: 'Insumo creado' })
      }
      cargar()
      setDialogOpen(false)
      resetForm()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  // ── AJUSTE (SOLO ENTRADA) ──
  const handleAjuste = async () => {
      if (!ajusteInsumo || !ajusteCantidad) return;
      const cantidad = parseFloat(ajusteCantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
          toast({ title: 'Error', description: 'Ingresa una cantidad válida', variant: 'destructive' });
          return;
      }
      // Forzar conversión a número para evitar concatenación
      const existenciaActual = Number(ajusteInsumo.existencia_actual) || 0;
      const nuevaExistencia = existenciaActual + cantidad;
    
      try {
          await api.updateInsumo(ajusteInsumo.id_insumo, { existencia_actual: nuevaExistencia });
          toast({ title: 'Entrada registrada', description: `+${cantidad} ${ajusteInsumo.unidad_medida}` });
          cargar();               // recarga la lista de insumos
          setAjusteOpen(false);
          setAjusteInsumo(null);
          setAjusteCantidad('');
      } catch (err: any) {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)

  // ── LÓGICA DE ESTADO ──
  const getStockStatus = (insumo: Insumo) => {
    const nivel: number = Number(insumo.nivel_minimo)
    const existencia: number = Number(insumo.existencia_actual)

    if (nivel <= 0) {
      return { color: 'red', label: 'Sin mínimo', percentage: 0 }
    }

    const maxVisual: number = Number(nivel * 3)
    const porcentaje: number = Math.min((existencia / maxVisual) * 100, 100)

    let color = 'green'
    let label = 'Normal'

    if (existencia <= nivel) {
      color = 'red'
      label = 'Crítico'
    } else if (existencia >= maxVisual) {
      color = 'red'
      label = 'Exceso'
    } else if (existencia <= nivel * 1.5) {
      color = 'amber'
      label = 'Bajo'
    }

    return { color, label, percentage: porcentaje }
  }

  const lowStock = insumos.filter((i) => parseFloat(i.existencia_actual) <= parseFloat(i.nivel_minimo)); //&& i.nivel_minimo > 0)

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando inventario...</div>

  return (
    <div className="inventario-page">
      <div className="inventario-header">
        <div>
          <h1 style={{ fontSize: '4rem', fontWeight: 600, color: 'var(--chocolate)' }}>Inventario</h1>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)' }}>Control de insumos y existencias</p>
        </div>
        <Button
          style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }}
          onClick={() => { resetForm(); setDialogOpen(true) }}
        >
          <Plus style={{height: 30, width: 30}} /> Nuevo Insumo
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="inventario-alert" style={{height: '7rem'}}>
          <div className="icon" style={{height: 75, width: 75}}><AlertTriangle size={60} color="#dc2626" /></div>
          <div className="text">
            <div className="title" style={{fontSize: '2rem', color: '#dc2626', textShadow: 'none', textAlign: 'left'}}>{lowStock.length} insumo(s) en nivel crítico</div>
            <div className="sub" style={{fontSize: '1.4rem', fontWeight: 700, color: 'rgb(220, 38, 38, 0.7)', }}>Revisa los niveles y reabastece lo necesario.</div>
          </div>
        </div>
      )}

      <div className="inventario-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{fontSize: '1.6rem', fontWeight: 600, color: 'rgb(114, 92, 63)'}}>Insumo</TableHead>
              <TableHead style={{fontSize: '1.6rem', fontWeight: 600, color: 'rgb(114, 92, 63)'}}>Existencia</TableHead>
              <TableHead style={{fontSize: '1.6rem', fontWeight: 600, color: 'rgb(114, 92, 63)'}}>Nivel</TableHead>
              <TableHead className="text-center" style={{fontSize: '1.6rem', fontWeight: 600, color: 'rgb(114, 92, 63)'}}>Estado</TableHead>
              <TableHead className="text-right" style={{fontSize: '1.6rem', fontWeight: 600, color: 'rgb(114, 92, 63)'}}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos.map(i => {
              const s = getStockStatus(i)
              return (
                <TableRow key={i.id_insumo}>
                  <TableCell>
                    <div style={{fontSize: '1.3rem', fontWeight: 500 }}>{i.nombre_insumo}</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.5)' }}>{i.unidad_medida}</div>
                  </TableCell>
                  <TableCell>
                    <div style={{fontSize: '1.3rem', fontWeight: 600 }}>{i.existencia_actual} {i.unidad_medida}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.5)' }}>Mín: {i.nivel_minimo}</div>
                  </TableCell>
                  <TableCell style={{ width: '12rem' }}>
                    <div className="inventario-progress">
                      <div className={`fill ${s.color}`} style={{ width: `${s.percentage}%` }} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                      <span className={`inventario-badge ${s.color}`} style={{fontSize: '1.3rem'}}>{s.label}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ borderColor: '#86efac', color: '#16a34a', marginRight: '0.25rem' }}
                      onClick={() => openAjuste(i)}
                    >
                      <TrendingUp style={{height: 30, width: 30}} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>
                      <Edit2 style={{height: 30, width: 30}} />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo nuevo/editar insumo */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--chocolate)', fontWeight: 700, fontSize: '1.7rem' }}>{editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Label style={{fontSize: '1.35rem', fontWeight: 700, color:'rgb(114, 92, 63, 0.7)'}}>Nombre</Label>
              <Input value={form.nombre_insumo} onChange={e => setForm({ ...form, nombre_insumo: e.target.value })} style={{fontSize: '1.3rem'}}/>
            </div>
            <div>
              <Label style={{fontSize: '1.35rem', fontWeight: 700, color:'rgb(114, 92, 63, 0.7)'}}>Unidad de Medida</Label>
              <Input value={form.unidad_medida} onChange={e => setForm({ ...form, unidad_medida: e.target.value })} style={{fontSize: '1.3rem'}} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <Label style={{fontSize: '1.35rem', fontWeight: 700, color:'rgb(114, 92, 63, 0.7)'}}>Existencia Actual</Label>
                <Input type="number" step="0.01" value={form.existencia_actual} onChange={e => setForm({ ...form, existencia_actual: e.target.value })} style={{fontSize: '1.3rem'}} />
              </div>
              <div>
                <Label style={{fontSize: '1.35rem', fontWeight: 700, color:'rgb(114, 92, 63, 0.7)'}}>Nivel Mínimo</Label>
                <Input type="number" step="0.01" value={form.nivel_minimo} onChange={e => setForm({ ...form, nivel_minimo: e.target.value })} style={{fontSize: '1.3rem'}} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} style={{fontSize: '1.4rem', background: 'rgb(114, 92, 63)', color: 'white'}}>Cancelar</Button>
            <Button style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.4rem' }} onClick={handleSubmit}>
              {editingInsumo ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo ajuste de inventario (solo entrada) */}
      <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--chocolate)', fontWeight: 700, fontSize: '1.7rem' }}>Agregar al inventario</DialogTitle>
          </DialogHeader>
          <p style={{fontSize: '1.35rem', fontWeight: 700, color:'rgb(114, 92, 63, 0.7)'}}>
            {ajusteInsumo?.nombre_insumo} — Existencia actual: {ajusteInsumo?.existencia_actual} {ajusteInsumo?.unidad_medida}
          </p>
          <div>
            <Label style={{fontSize: '1.35rem', fontWeight: 700, color:'rgb(114, 92, 63)'}}>Cantidad a agregar</Label>
            <Input
              type="number"
              step="0.01"
              value={ajusteCantidad}
              onChange={e => setAjusteCantidad(e.target.value)}
              placeholder="0.00"
              style={{fontSize: '1.35rem'}}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteOpen(false)} style={{fontSize: '1.4rem', background: 'rgb(114, 92, 63)', color: 'white'}}>
              Cancelar
            </Button>
            <Button
              style={{ background: '#16a34a', color: 'white', fontSize: '1.4rem' }}
              onClick={handleAjuste}
              disabled={!ajusteCantidad || parseFloat(ajusteCantidad) <= 0}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
