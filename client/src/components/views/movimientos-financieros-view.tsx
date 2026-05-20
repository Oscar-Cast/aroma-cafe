'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/movimientos-caja.css'

export function MovimientosFinancierosView() {
  const { toast } = useToast()
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState('ingreso')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')

  const cargar = async () => {
    try {
      const data = await api.getMovimientosFinancieros()
      setMovimientos(data)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monto || !concepto) {
      toast({ title: 'Error', description: 'Monto y concepto son requeridos', variant: 'destructive' })
      return
    }
    try {
      await api.createMovimientoFinanciero({ tipo, monto: parseFloat(monto), concepto })
      toast({ title: 'Movimiento registrado' })
      setMonto('')
      setConcepto('')
      setTipo('ingreso')
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
  const formatDate = (s: string) => new Date(s).toLocaleString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando movimientos...</div>

  return (
    <div className="movcaja-page">
      <div className="movcaja-header">
        <h1 style={{fontSize: '4rem'}}>Movimientos de Caja</h1>
        <p style={{fontSize: '2rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Registra ingresos y egresos manuales durante el turno</p>
      </div>

      <Card className="movcaja-form-card">
        <form onSubmit={handleSubmit}>
          <div className="movcaja-form-grid">
            <div>
              <Label style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--chocolate)' }}>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger style={{ borderColor: 'var(--caramel)', fontSize: '1.25rem' }} ><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso" style={{fontSize:'1.25rem'}}>Ingreso</SelectItem>
                  <SelectItem value="egreso" style={{fontSize:'1.25rem'}}>Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--chocolate)' }}>Monto</Label>
              <Input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={{fontSize: '1.25rem'}} />
            </div>
            <div>
              <Label style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--chocolate)' }}>Concepto</Label>
              <Input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Compra de insumos" style={{fontSize: '1.25rem'}} />
            </div>
          </div>
          <button type="submit" className="movcaja-submit-btn" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', color: 'white' }}>
            <DollarSign  style={{ height: 20, width: 20 }} /> Registrar movimiento
          </button>
        </form>
      </Card>

      <Card className="movcaja-historial-card">
        <div style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--chocolate)' }}>Historial</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Fecha</TableHead>
              <TableHead style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Tipo</TableHead>
              <TableHead style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Concepto</TableHead>
              <TableHead className="text-right" style={{fontSize: '1.5rem', fontWeight: 700, color: 'rgb(114, 92, 63, 0.7)'}}>Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map(m => (
              <TableRow key={m.id_movimiento_fin}>
                <TableCell className="text-sm" style={{fontSize: '1.25rem', fontWeight: 600, color: 'rgb(114, 92, 63, 0.8)'}}>{formatDate(m.fecha_hora)}</TableCell>
                <TableCell style={{fontSize: '1.25rem', fontWeight: 600, color: 'rgb(114, 92, 63, 0.8)'}}>
                  {m.tipo === 'ingreso' ? (
                    <span className="text-green"><TrendingUp size={30} className="inline " style={{color: 'green'}} /> Ingreso</span>
                  ) : (
                    <span className="text-red"><TrendingDown size={30} className="inline" style={{color: 'red'}} /> Egreso</span>
                  )}
                </TableCell>
                <TableCell style={{fontSize: '1.25rem', fontWeight: 600, color: 'rgb(114, 92, 63, 0.8)'}}>{m.concepto}</TableCell>
                <TableCell className={`text-right ${m.tipo === 'ingreso' ? 'text-green' : 'text-red'}`} style={{ fontWeight: 600, fontSize: '1.25rem', color: 'rgb(114, 92, 63, 0.7)' }}>
                  {formatCurrency(parseFloat(m.monto))}
                </TableCell>
              </TableRow>
            ))}
            {movimientos.length === 0 && <TableRow><TableCell colSpan={4} className="movcaja-empty">No hay movimientos registrados</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
