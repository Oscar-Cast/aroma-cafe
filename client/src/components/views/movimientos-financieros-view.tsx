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
        <h1>Movimientos de Caja</h1>
        <p>Registra ingresos y egresos manuales durante el turno</p>
      </div>

      <Card className="movcaja-form-card">
        <form onSubmit={handleSubmit}>
          <div className="movcaja-form-grid">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger style={{ borderColor: 'var(--caramel)' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Concepto</Label>
              <Input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Compra de insumos" />
            </div>
          </div>
          <button type="submit" className="movcaja-submit-btn">
            <DollarSign size={16} style={{ marginRight: '0.5rem' }} /> Registrar movimiento
          </button>
        </form>
      </Card>

      <Card className="movcaja-historial-card">
        <div style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--chocolate)' }}>Historial</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Monto</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map(m => (
              <TableRow key={m.id_movimiento_fin}>
                <TableCell className="text-sm">{formatDate(m.fecha_hora)}</TableCell>
                <TableCell>
                  {m.tipo === 'ingreso' ? (
                    <span className="text-green"><TrendingUp size={14} className="inline" /> Ingreso</span>
                  ) : (
                    <span className="text-red"><TrendingDown size={14} className="inline" /> Egreso</span>
                  )}
                </TableCell>
                <TableCell>{m.concepto}</TableCell>
                <TableCell className={`text-right ${m.tipo === 'ingreso' ? 'text-green' : 'text-red'}`} style={{ fontWeight: 600 }}>
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
