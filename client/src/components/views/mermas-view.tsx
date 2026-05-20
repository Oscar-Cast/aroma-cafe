'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/api/client'
import { MermaProducto, Producto, Insumo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/mermas.css'

const motivosMerma = ['Caducidad', 'Daño en transporte', 'Daño en almacén', 'Producto defectuoso', 'Error de preparación', 'Devolución de cliente', 'Otro']

export function MermasView() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState('productos')
  const [mermasProd, setMermasProd] = useState<MermaProducto[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [showDialogProd, setShowDialogProd] = useState(false)
  const [showDialogInsumo, setShowDialogInsumo] = useState(false)
  const [formProd, setFormProd] = useState({ id_producto: '', cantidad: '', motivo: '', motivoOtro: '' })
  const [formInsumo, setFormInsumo] = useState({ id_insumo: '', cantidad: '', motivo: '' })

  const cargarDatos = async () => {
    try {
      const [mermas, prods, movs, ins] = await Promise.all([
        api.getMermas(), api.getProductos(), api.getMovimientosInventario(), api.getInsumos()
      ])
      setMermasProd(mermas)
      setProductos(prods)
      setMovimientos(movs.filter((m: any) => m.tipo_movimiento.startsWith('merma')))
      setInsumos(ins)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' })
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleProdSubmit = async () => {
    if (!formProd.id_producto || !formProd.cantidad || !formProd.motivo) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' }); return
    }
    const motivo = formProd.motivo === 'Otro' ? formProd.motivoOtro : formProd.motivo
    try {
      await api.createMerma({ id_producto: parseInt(formProd.id_producto), cantidad: parseInt(formProd.cantidad), motivo })
      toast({ title: 'Merma de producto registrada' })
      cargarDatos(); setShowDialogProd(false); setFormProd({ id_producto: '', cantidad: '', motivo: '', motivoOtro: '' })
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  }

  const handleInsumoSubmit = async () => {
    if (!formInsumo.id_insumo || !formInsumo.cantidad || !formInsumo.motivo) {
      toast({ title: 'Error', description: 'Completa todos los campos', variant: 'destructive' }); return
    }
    try {
      await api.createMovimientoInventario({
        id_insumo: parseInt(formInsumo.id_insumo),
        tipo_movimiento: 'merma_caducidad',
        cantidad: parseFloat(formInsumo.cantidad)
      })
      toast({ title: 'Merma de insumo registrada' })
      cargarDatos(); setShowDialogInsumo(false); setFormInsumo({ id_insumo: '', cantidad: '', motivo: '' })
    } catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(v)

  return (
    <div className="mermas-page">
      <div className="mermas-header">
        <div>
          <h1 style={{fontSize: '4rem'}}>Mermas</h1>
          <p style={{fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Registro de pérdidas de productos e insumos</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList  style={{background: 'var(--chocolate, 0.1)', height: '3rem'}} >
          <TabsTrigger value="productos" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Productos</TabsTrigger>
          <TabsTrigger value="insumos" style={{fontSize: '1.3rem', color: 'white', backgroundColor: 'var(--chocolate)', height: '2rem'}}>Insumos</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" style={{ marginTop: '1rem' }}>
          <div className="mermas-section-header">
            <h2 style={{fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Mermas de productos</h2>
            <Button style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }} onClick={() => setShowDialogProd(true)} >
              <Plus style={{height: 30, width: 30}} /> Registrar merma
            </Button>
          </div>
          <div className="mermas-table-container">
            <table className="mermas-table">
              <thead><tr>
                <th style={{fontSize: '1.4rem'}}>Fecha</th>
                <th style={{fontSize: '1.4rem'}}>Producto</th>
                <th className="text-center" style={{fontSize: '1.4rem'}}>Cantidad</th>
                <th style={{fontSize: '1.4rem'}}>Motivo</th>
                <th style={{fontSize: '1.4rem'}}>Registrado por</th>
                <th className="text-right" style={{fontSize: '1.4rem'}}>Valor</th>
              </tr></thead>
              <tbody>
                {mermasProd.map(m => {
                  const prod = productos.find(p => p.id_producto === m.id_producto)
                  const valor = m.cantidad * (prod?.precio || 0)
                  return (
                    <tr key={m.id_merma_prod}>
                      <td style={{ fontSize: '1.2rem' }}>{formatDate(m.fecha_hora)}</td>
                      <td style={{ fontSize: '1.2rem', fontWeight: 500 }}>{m.nombre_producto || prod?.nombre_producto}</td>
                      <td className="text-center" style={{ fontSize: '1.2rem' }}>{m.cantidad}</td>
                      <td style={{ fontSize: '1.2rem' }}>{m.motivo}</td>
                      <td style={{ fontSize: '1.2rem' }}>{m.nombre_usuario}</td>
                      <td className="text-right text-red" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgb(220, 20, 60, 0.6)' }}>{formatCurrency(valor)}</td>
                    </tr>
                  )
                })}
                {mermasProd.length === 0 && (
                  <tr><td colSpan={6} className="mermas-empty">No hay mermas de productos registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="insumos" style={{ marginTop: '1rem' }}>
          <div className="mermas-section-header">
            <h2 style={{fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Mermas de insumos</h2>
            <Button style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }} onClick={() => setShowDialogInsumo(true)} >
              <Plus style={{height: 30, width: 30}} /> Registrar merma
            </Button>
          </div>
          <div className="mermas-table-container">
            <table className="mermas-table">
              <thead><tr>
                <th style={{fontSize: '1.4rem'}}>Fecha</th>
                <th style={{fontSize: '1.4rem'}}>Insumo</th>
                <th className="text-center" style={{fontSize: '1.4rem'}}>Cantidad</th>
                <th style={{fontSize: '1.4rem'}}>Unidad</th>
                <th style={{fontSize: '1.4rem'}}>Motivo</th>
                <th style={{fontSize: '1.4rem'}}>Registrado por</th>
              </tr></thead>
              <tbody>
                {movimientos.map((mov: any) => {
                  const ins = insumos.find(i => i.id_insumo === mov.id_insumo)
                  return (
                    <tr key={mov.id_movimiento}>
                      <td style={{ fontSize: '1.2rem' }}>{formatDate(mov.fecha_movimiento)}</td>
                      <td style={{ fontSize: '1.2rem', fontWeight: 500 }}>{ins?.nombre_insumo || 'N/A'}</td>
                      <td className="text-center" style={{ fontSize: '1.2rem' }}>{mov.cantidad}</td>
                      <td style={{ fontSize: '1.2rem' }}>{ins?.unidad_medida || ''}</td>
                      <td style={{ fontSize: '1.2rem' }}>{mov.tipo_movimiento === 'merma_caducidad' ? 'Caducidad' : 'Daño'}</td>
                      <td style={{ fontSize: '1.2rem' }}>{mov.nombre_usuario}</td>
                    </tr>
                  )
                })}
                {movimientos.length === 0 && (
                  <tr><td colSpan={6} className="mermas-empty">No hay mermas de insumos registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialogProd} onOpenChange={setShowDialogProd}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)', fontSize: '1.7rem', fontWeight: 700 }}>Registrar merma de producto</DialogTitle></DialogHeader>
          <div className="mermas-dialog-form">
            <div>
              <label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Producto</label>
              <select value={formProd.id_producto} onChange={e => setFormProd({ ...formProd, id_producto: e.target.value })}>
                <option value="" style={{fontSize: '1.3rem'}}>Selecciona</option>
                {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} — {formatCurrency(p.precio)}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Cantidad</label>
              <input type="number" min="1" value={formProd.cantidad} onChange={e => setFormProd({ ...formProd, cantidad: e.target.value })} />
            </div>
            <div>
              <label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Motivo</label>
              <select value={formProd.motivo} onChange={e => setFormProd({ ...formProd, motivo: e.target.value })}>
                <option value="" style={{fontSize: '1.3rem'}}>Selecciona</option>
                {motivosMerma.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {formProd.motivo === 'Otro' && <div><label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Especifica</label><textarea value={formProd.motivoOtro} onChange={e => setFormProd({ ...formProd, motivoOtro: e.target.value })} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogProd(false)} style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }}>Cancelar</Button>
            <Button style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }} onClick={handleProdSubmit}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialogInsumo} onOpenChange={setShowDialogInsumo}>
        <DialogContent>
          <DialogHeader><DialogTitle style={{ color: 'var(--chocolate)', fontSize: '1.7rem', fontWeight: 700 }}>Registrar merma de insumo</DialogTitle></DialogHeader>
          <div className="mermas-dialog-form">
            <div>
              <label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Insumo</label>
            <select value={formInsumo.id_insumo} onChange={e => setFormInsumo({ ...formInsumo, id_insumo: e.target.value })}>
              <option value="" style={{fontSize: '1.3rem'}}>Selecciona</option>
              {insumos.map(i => <option key={i.id_insumo} value={i.id_insumo}>{i.nombre_insumo} ({i.unidad_medida})</option>)}
            </select>
            </div>
            <div><label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Cantidad</label><input type="number" step="0.01" value={formInsumo.cantidad} onChange={e => setFormInsumo({ ...formInsumo, cantidad: e.target.value })} /></div>
            <div><label style={{fontSize: '1.3rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Motivo</label><select value={formInsumo.motivo} onChange={e => setFormInsumo({ ...formInsumo, motivo: e.target.value })}>
              <option value="" style={{fontSize: '1.3rem'}}>Selecciona</option>
              {motivosMerma.filter(m => m !== 'Otro').map(m => <option key={m} value={m}>{m}</option>)}
            </select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialogInsumo(false)} style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }}>Cancelar</Button>
            <Button style={{ background: 'var(--chocolate)', color: 'white', fontSize: '1.3rem' }} onClick={handleInsumoSubmit}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
