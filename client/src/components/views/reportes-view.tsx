'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Printer, BarChart3, Coffee } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useToast } from '@/hooks/use-toast'

export function ReportesView() {
  const { toast } = useToast()
  const [datos, setDatos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('7d')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargarReportes = async () => {
    setLoading(true)
    try {
      let inicio = '', fin = ''
      const hoy = new Date().toISOString().split('T')[0]
      if (periodo === 'today') { inicio = hoy; fin = hoy }
      else if (periodo === '7d') {
        const h = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        inicio = h.toISOString().split('T')[0]; fin = hoy
      } else if (periodo === '30d') {
        const h = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
        inicio = h.toISOString().split('T')[0]; fin = hoy
      } else if (periodo === 'custom' && desde && hasta) {
        inicio = desde; fin = hasta
      } else {
        const h = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        inicio = h.toISOString().split('T')[0]; fin = hoy
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reportes/resumen?inicio=${inicio}&fin=${fin}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Error al cargar reporte')
      const data = await response.json()
      setDatos(data)
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los reportes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarReportes() }, [periodo, desde, hasta])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  // PDF: ventana emergente con estilo profesional
  const exportarPDF = () => {
    if (!datos) return
    const ventana = window.open('', '_blank')
    if (!ventana) return

    const html = `<!DOCTYPE html><html><head><title>Reporte Aroma Café</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #4C3D19; border-bottom: 2px solid #CFBB99; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #CFBB99; padding: 8px; text-align: left; }
        th { background: #4C3D19; color: white; }
        .totales { display: flex; gap: 20px; margin: 20px 0; }
        .total { border: 1px solid #CFBB99; padding: 15px; border-radius: 8px; flex: 1; }
      </style></head><body>
      <h1>Reporte Aroma Café</h1>
      <p>Período: ${datos.periodo.inicio} al ${datos.periodo.fin}</p>
      <div class="totales">
        <div class="total"><strong>Ingresos:</strong> ${formatCurrency(datos.totalIngresos)}</div>
        <div class="total"><strong>Egresos:</strong> ${formatCurrency(datos.totalEgresos)}</div>
        <div class="total"><strong>Saldo neto:</strong> ${formatCurrency(datos.saldoNeto)}</div>
        <div class="total"><strong>Ticket prom.:</strong> ${formatCurrency(datos.ticketPromedio)}</div>
      </div>
      <h2>Ventas por día</h2>
      <table><tr><th>Día</th><th>Total</th></tr>
        ${datos.ventasDiarias.map((v:any) => `<tr><td>${v.fecha}</td><td>${formatCurrency(v.total)}</td></tr>`).join('')}
      </table>
      <h2>Productos vendidos</h2>
      <table><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr>
        ${datos.productosVendidos.map((p:any) => `<tr><td>${p.nombre_producto}</td><td>${p.cantidad_vendida}</td><td>${formatCurrency(p.total_vendido)}</td></tr>`).join('')}
      </table>
      <h2>Egresos</h2>
      <table><tr><th>Concepto</th><th>Monto</th></tr>
        ${datos.egresosDetalle.map((e:any) => `<tr><td>${e.concepto}</td><td>${formatCurrency(e.total)}</td></tr>`).join('')}
      </table>
      <h2>Métodos de pago</h2>
      <table><tr><th>Método</th><th>Total</th></tr>
        ${datos.metodosPago.map((m:any) => `<tr><td>${m.metodo_pago}</td><td>${formatCurrency(m.total)}</td></tr>`).join('')}
      </table>
    </body></html>`;
    
    ventana.document.write(html);
    ventana.document.close();
    ventana.onload = () => ventana.print();
  };

  // XML enriquecido
  const exportarXML = () => {
    if (!datos) return
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<reporte>\n';
    xml += `  <periodo inicio="${datos.periodo.inicio}" fin="${datos.periodo.fin}"/>\n`;
    xml += `  <totales>\n    <ingresos>${datos.totalIngresos}</ingresos>\n    <egresos>${datos.totalEgresos}</egresos>\n    <saldo_neto>${datos.saldoNeto}</saldo_neto>\n    <ticket_promedio>${datos.ticketPromedio}</ticket_promedio>\n  </totales>\n`;
    xml += '  <ventas_diarias>\n'; datos.ventasDiarias.forEach((v:any) => xml += `    <dia fecha="${v.fecha}" total="${v.total}"/>\n`); xml += '  </ventas_diarias>\n';
    xml += '  <productos>\n'; datos.productosVendidos.forEach((p:any) => xml += `    <producto nombre="${p.nombre_producto}" categoria="${p.categoria}" cantidad="${p.cantidad_vendida}" total="${p.total_vendido}"/>\n`); xml += '  </productos>\n';
    xml += '  <metodos_pago>\n'; datos.metodosPago.forEach((m:any) => xml += `    <metodo nombre="${m.metodo_pago}" total="${m.total}"/>\n`); xml += '  </metodos_pago>\n';
    xml += '  <egresos>\n'; datos.egresosDetalle.forEach((e:any) => xml += `    <egreso concepto="${e.concepto}" total="${e.total}"/>\n`); xml += '  </egresos>\n';
    xml += '</reporte>';
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reporte_${datos.periodo.inicio}_${datos.periodo.fin}.xml`;
    a.click();
  };

  if (loading) return <div className="text-center py-12 text-[#889063]">Cargando reportes...</div>
  if (!datos) return <div className="text-center py-12">No hay datos disponibles</div>

  const ventasData = datos.ventasDiarias.map((v: any) => ({ fecha: formatDate(v.fecha), total: parseFloat(v.total) }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Controles y exportaciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-lg border border-[#CFBB99]">
        <div>
          <h1 className="text-2xl font-bold text-[#4C3D19]">Reportes administrativos</h1>
          <p className="text-sm text-[#889063]">{datos.periodo.inicio} – {datos.periodo.fin}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={periodo === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('today')}>Hoy</Button>
          <Button variant={periodo === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('7d')}>7 días</Button>
          <Button variant={periodo === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('30d')}>30 días</Button>
          <Button variant={periodo === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('custom')}>Personalizado</Button>
          <div className="flex gap-1 ml-2">
            <Button variant="outline" size="sm" onClick={exportarXML}><FileText className="w-4 h-4 mr-1" />XML</Button>
            <Button variant="outline" size="sm" onClick={exportarPDF}><Printer className="w-4 h-4 mr-1" />PDF</Button>
          </div>
        </div>
      </div>

      {periodo === 'custom' && (
        <div className="flex gap-3 items-end bg-white p-3 rounded border border-[#CFBB99]">
          <div><label className="text-xs text-[#889063] block">Desde</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="border border-[#CFBB99] rounded p-1.5 text-sm" /></div>
          <div><label className="text-xs text-[#889063] block">Hasta</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="border border-[#CFBB99] rounded p-1.5 text-sm" /></div>
          <Button size="sm" onClick={cargarReportes} disabled={!desde || !hasta} className="bg-[#4C3D19]">Aplicar</Button>
        </div>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-green-500 bg-white"><CardHeader className="pb-2"><CardTitle className="text-sm text-green-700">Ingresos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-800">{formatCurrency(datos.totalIngresos)}</div></CardContent></Card>
        <Card className="border-l-4 border-red-500 bg-white"><CardHeader className="pb-2"><CardTitle className="text-sm text-red-700">Egresos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-800">{formatCurrency(datos.totalEgresos)}</div></CardContent></Card>
        <Card className="border-l-4 border-[#4C3D19] bg-white"><CardHeader className="pb-2"><CardTitle className="text-sm text-[#4C3D19]">Saldo neto</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${datos.saldoNeto >= 0 ? 'text-[#4C3D19]' : 'text-red-700'}`}>{formatCurrency(datos.saldoNeto)}</div></CardContent></Card>
        <Card className="border-l-4 border-[#889063] bg-white"><CardHeader className="pb-2"><CardTitle className="text-sm text-[#889063]">Ticket prom.</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-[#4C3D19]">{formatCurrency(datos.ticketPromedio)}</div></CardContent></Card>
      </div>

      {/* Ventas diarias y gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#CFBB99] bg-white">
          <CardHeader><CardTitle className="text-lg text-[#4C3D19] flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Ventas por día</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <Table><TableHeader><TableRow><TableHead>Día</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>{ventasData.map((v:any) => <TableRow key={v.fecha}><TableCell>{v.fecha}</TableCell><TableCell className="text-right font-medium">{formatCurrency(v.total)}</TableCell></TableRow>)}</TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99] bg-white">
          <CardHeader><CardTitle className="text-lg text-[#4C3D19]">Gráfico de ingresos</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CFBB99" />
                  <XAxis dataKey="fecha" stroke="#889063" fontSize={12} />
                  <YAxis stroke="#889063" tickFormatter={v => `$${v}`} fontSize={12} />
                  <Tooltip formatter={(v:any) => [formatCurrency(Number(v)), 'Ingreso']} />
                  <Bar dataKey="total" fill="#4C3D19" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productos vendidos */}
      <Card className="border-[#CFBB99] bg-white">
        <CardHeader><CardTitle className="text-lg text-[#4C3D19] flex items-center gap-2"><Coffee className="w-5 h-5" /> Productos vendidos</CardTitle><CardDescription className="text-[#889063]">{datos.productosVendidos.length} productos</CardDescription></CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Categoría</TableHead><TableHead className="text-center">Cantidad</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {datos.productosVendidos.map((p:any) => (
                  <TableRow key={p.nombre_producto}><TableCell className="font-medium">{p.nombre_producto}</TableCell><TableCell className="text-[#889063]">{p.categoria}</TableCell><TableCell className="text-center">{p.cantidad_vendida}</TableCell><TableCell className="text-right">{formatCurrency(Number(p.total_vendido))}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Egresos y métodos de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#CFBB99] bg-white">
          <CardHeader><CardTitle className="text-lg text-[#4C3D19]">Egresos por concepto</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table><TableHeader><TableRow><TableHead>Concepto</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
                <TableBody>
                  {datos.egresosDetalle.map((e:any) => <TableRow key={e.concepto}><TableCell>{e.concepto}</TableCell><TableCell className="text-right text-red-600 font-medium">{formatCurrency(Number(e.total))}</TableCell></TableRow>)}
                  {datos.egresosDetalle.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-[#889063] py-4">Sin egresos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="border-[#CFBB99] bg-white">
          <CardHeader><CardTitle className="text-lg text-[#4C3D19]">Método de pago</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table><TableHeader><TableRow><TableHead>Método</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {datos.metodosPago.map((m:any) => <TableRow key={m.metodo_pago}><TableCell className="capitalize">{m.metodo_pago}</TableCell><TableCell className="text-right font-medium">{formatCurrency(Number(m.total))}</TableCell></TableRow>)}
                  {datos.metodosPago.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-[#889063] py-4">Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
