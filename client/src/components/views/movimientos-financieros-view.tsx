'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function MovimientosFinancierosView() {
  const { toast } = useToast()
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [form, setForm] = useState({ tipo: 'ingreso', monto: '', concepto: '' })
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    try {
      const data = await api.getMovimientosFinancieros()
      setMovimientos(data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los movimientos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.monto || !form.concepto) {
      toast({ title: 'Error', description: 'Monto y concepto requeridos', variant: 'destructive' })
      return
    }
    try {
      await api.createMovimientoFinanciero({
        tipo: form.tipo,
        monto: parseFloat(form.monto),
        concepto: form.concepto
      })
      toast({ title: 'Movimiento registrado' })
      setForm({ tipo: 'ingreso', monto: '', concepto: '' })
      cargar()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatDate = (date: string) =>
    new Date(date).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando movimientos...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4C3D19]">Movimientos Financieros</h1>
        <p className="text-[#889063] mt-1">Registra ingresos y egresos manuales</p>
      </div>

      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Nuevo Movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="border-[#CFBB99]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="egreso">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Monto</Label>
                <Input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="border-[#CFBB99]" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#4C3D19]">Concepto</Label>
                <Input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="border-[#CFBB99]" placeholder="Ej: Compra de insumos" />
              </div>
            </div>
            <Button type="submit" className="bg-[#4C3D19] hover:bg-[#354024] text-[#E5D7C4]">
              <DollarSign className="w-4 h-4 mr-2" /> Registrar movimiento
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#CFBB99]">
        <CardHeader>
          <CardTitle className="text-[#4C3D19]">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[#4C3D19]">Fecha</TableHead>
                <TableHead className="text-[#4C3D19]">Tipo</TableHead>
                <TableHead className="text-[#4C3D19]">Concepto</TableHead>
                <TableHead className="text-[#4C3D19] text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos.map((mov) => (
                <TableRow key={mov.id_movimiento_fin}>
                  <TableCell className="text-[#889063]">{formatDate(mov.fecha_hora)}</TableCell>
                  <TableCell>
                    {mov.tipo === 'ingreso' ? (
                      <span className="text-green-600 font-medium"><TrendingUp className="inline w-4 h-4 mr-1" />Ingreso</span>
                    ) : (
                      <span className="text-red-600 font-medium"><TrendingDown className="inline w-4 h-4 mr-1" />Egreso</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#4C3D19]">{mov.concepto}</TableCell>
                  <TableCell className={`text-right font-semibold ${mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(parseFloat(mov.monto))}
                  </TableCell>
                </TableRow>
              ))}
              {movimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#889063] py-8">No hay movimientos registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
