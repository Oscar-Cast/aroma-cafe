'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, DollarSign, Coffee, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function ReportesView() {
  const [resumen, setResumen] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await api.getResumenVentas()
        setResumen(data)
      } catch (error) {
        console.error('Error cargando reportes', error)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
  const COLORS = ['#4C3D19', '#354024', '#889063', '#CFBB99', '#E5D7C4']

  if (loading) return <div className="text-center py-12">Cargando reportes...</div>
  if (!resumen) return <div className="text-center py-12">No hay datos disponibles</div>

  const ventasData = resumen.graficaVentas.map((v: any) => ({ ...v, fecha: formatDate(v.fecha) }))
  const totalVentasSemana = resumen.graficaVentas.reduce((sum: number, v: any) => sum + v.total, 0)

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-[#4C3D19]">Reportes</h1></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#CFBB99]"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-[#889063]">Ventas (7 días)</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-[#4C3D19]">{formatCurrency(totalVentasSemana)}</div></CardContent></Card>
        {resumen.resumenFinanciero && (
          <>
            <Card className="border-green-200 bg-green-50"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-green-700">Último Cierre - Ingresos</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-700">{formatCurrency(resumen.resumenFinanciero.total_ingresos)}</div></CardContent></Card>
            <Card className="border-[#CFBB99]"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-[#889063]">Último Cierre - Saldo</CardTitle><BarChart3 className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(resumen.resumenFinanciero.saldo)}</div></CardContent></Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#CFBB99]"><CardHeader><CardTitle className="text-[#4C3D19]">Ventas de los Últimos 7 Días</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={ventasData}><CartesianGrid strokeDasharray="3 3" stroke="#CFBB99" /><XAxis dataKey="fecha" stroke="#889063" /><YAxis stroke="#889063" tickFormatter={(v) => `$${v}`} /><Tooltip formatter={(v: number) => [formatCurrency(v), 'Ventas']} /><Bar dataKey="total" fill="#4C3D19" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>

        <Card className="border-[#CFBB99]"><CardHeader><CardTitle className="text-[#4C3D19]">Productos Más Vendidos</CardTitle></CardHeader><CardContent><div className="h-[300px] flex items-center">
          {resumen.productosPopulares.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={resumen.productosPopulares} dataKey="cantidad_vendida" nameKey="nombre_producto" cx="50%" cy="50%" outerRadius={100} label={({ nombre_producto, percent }) => `${nombre_producto} (${(percent * 100).toFixed(0)}%)`}>{resumen.productosPopulares.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          ) : <div className="w-full text-center"><Package className="w-12 h-12 mx-auto" /><p>No hay datos</p></div>}
        </div></CardContent></Card>
      </div>
    </div>
  )
}
