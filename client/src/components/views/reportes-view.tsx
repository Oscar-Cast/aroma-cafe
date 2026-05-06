'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, Printer, BarChart3, Coffee } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import '@/styles/reportes.css'

export function ReportesView() {
  const { toast } = useToast()
  const [datos, setDatos] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cierres, setCierres] = useState<any[]>([])
  const [periodo, setPeriodo] = useState('7d')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargarReportes = async () => {
    setLoading(true)
    try {
      let inicio = '', fin = ''
      const hoy = new Date().toISOString().split('T')[0]
      if (periodo === 'today') {
        inicio = hoy; fin = hoy
      } else if (periodo === '7d') {
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

      const respResumen = await fetch(`/api/reportes/resumen?inicio=${inicio}&fin=${fin}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!respResumen.ok) throw new Error('Error al cargar reporte de ventas')
      const dataVentas = await respResumen.json()
      setDatos(dataVentas)

      const respCierres = await fetch(`/api/caja/historial?inicio=${inicio}&fin=${fin}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (respCierres.ok) {
        const dataCierres = await respCierres.json()
        setCierres(dataCierres)
      } else {
        setCierres([])
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los reportes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarReportes() }, [periodo, desde, hasta])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  const exportarXML = () => { /* ... misma lógica de antes ... */ }
  const exportarPDF = () => { /* ... misma lógica de antes ... */ }

  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando reportes...</div>
  if (!datos) return <div className="text-center py-12">No hay datos disponibles</div>

  const ventasData = datos.ventasDiarias.map((v: any) => ({ fecha: formatDate(v.fecha), total: parseFloat(v.total) }))

  return (
    <div className="reportes-page">
      <div className="reportes-header">
        <div>
          <h1>Reportes administrativos</h1>
          <div className="periodo-info">{datos.periodo.inicio} – {datos.periodo.fin}</div>
        </div>
        <div className="reportes-controles">
          <Button variant={periodo === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('today')}>Hoy</Button>
          <Button variant={periodo === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('7d')}>7 días</Button>
          <Button variant={periodo === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('30d')}>30 días</Button>
          <Button variant={periodo === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setPeriodo('custom')}>Personalizado</Button>
          <Button variant="outline" size="sm" onClick={exportarXML}><FileText size={16} /> XML</Button>
          <Button variant="outline" size="sm" onClick={exportarPDF}><Printer size={16} /> PDF</Button>
        </div>
      </div>

      {periodo === 'custom' && (
        <div className="reportes-fecha-filtro">
          <div><label>Desde</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></div>
          <div><label>Hasta</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></div>
          <Button size="sm" onClick={cargarReportes} disabled={!desde || !hasta} style={{ background: 'var(--chocolate)', color: 'white' }}>Aplicar</Button>
        </div>
      )}

      <div className="reportes-totales">
        <div className="reportes-total-card ingresos"><div className="label">Ingresos</div><div className="value">{formatCurrency(datos.totalIngresos)}</div></div>
        <div className="reportes-total-card egresos"><div className="label">Egresos</div><div className="value">{formatCurrency(datos.totalEgresos)}</div></div>
        <div className="reportes-total-card saldo"><div className="label">Saldo neto</div><div className="value">{formatCurrency(datos.saldoNeto)}</div></div>
        <div className="reportes-total-card ticket"><div className="label">Ticket prom.</div><div className="value">{formatCurrency(datos.ticketPromedio)}</div></div>
      </div>

      <div className="reportes-grid">
        <div className="reportes-table-container">
          <h2><BarChart3 size={20} /> Ventas por día</h2>
          <div className="reportes-scroll">
            <table className="reportes-table">
              <thead><tr><th>Día</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {ventasData.map((v: any) => (
                  <tr key={v.fecha}><td>{v.fecha}</td><td className="text-right">{formatCurrency(v.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="reportes-table-container">
          <h2>Gráfico de ingresos</h2>
          <div style={{ height: '18rem' }}>
            <ResponsiveContainer>
              <BarChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--caramel)" />
                <XAxis dataKey="fecha" stroke="var(--caramel)" fontSize={12} />
                <YAxis stroke="var(--caramel)" tickFormatter={v => `$${v}`} fontSize={12} />
                <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Ingreso']} />
                <Bar dataKey="total" fill="var(--chocolate)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="reportes-table-container">
        <h2><Coffee size={20} /> Productos vendidos ({datos.productosVendidos.length})</h2>
        <div className="reportes-scroll">
          <table className="reportes-table">
            <thead><tr><th>Producto</th><th>Categoría</th><th className="text-center">Cantidad</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {datos.productosVendidos.map((p: any) => (
                <tr key={p.nombre_producto}>
                  <td style={{ fontWeight: 500 }}>{p.nombre_producto}</td>
                  <td style={{ color: 'var(--caramel)' }}>{p.categoria}</td>
                  <td className="text-center">{p.cantidad_vendida}</td>
                  <td className="text-right">{formatCurrency(Number(p.total_vendido))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mermas (productos e insumos) */}
      {datos.mermasProductos && datos.mermasInsumos && (
        <div className="reportes-grid">
          <div className="reportes-table-container">
            <h2>Mermas – Productos</h2>
            <div className="reportes-scroll">
              <table className="reportes-table">
                <thead><tr><th>Fecha</th><th>Producto</th><th className="text-center">Cant.</th><th>Motivo</th><th className="text-right">Valor</th></tr></thead>
                <tbody>
                  {datos.mermasProductos.map((m: any) => (
                    <tr key={m.id_merma_prod}>
                      <td>{formatDate(m.fecha_hora)}</td>
                      <td>{m.nombre_producto}</td>
                      <td className="text-center">{m.cantidad}</td>
                      <td>{m.motivo}</td>
                      <td className="text-right text-red">{formatCurrency(parseFloat(m.valor_perdida))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="reportes-table-container">
            <h2>Mermas – Insumos</h2>
            <div className="reportes-scroll">
              <table className="reportes-table">
                <thead><tr><th>Fecha</th><th>Insumo</th><th className="text-center">Cant.</th><th>Motivo</th></tr></thead>
                <tbody>
                  {datos.mermasInsumos.map((m: any) => (
                    <tr key={m.id_movimiento}>
                      <td>{formatDate(m.fecha_movimiento)}</td>
                      <td>{m.nombre_insumo}</td>
                      <td className="text-center">{m.cantidad} {m.unidad_medida}</td>
                      <td>{m.tipo_movimiento === 'merma_caducidad' ? 'Caducidad' : 'Daño'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cierres de turno */}
      <div className="reportes-table-container">
        <h2>Cierres de turno ({cierres.length})</h2>
        <div className="reportes-scroll">
          <table className="reportes-table">
            <thead><tr><th>Fecha</th><th>Responsable</th><th className="text-right">Fondo</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th><th className="text-right">Saldo</th><th className="text-right">Ganancia</th><th className="text-right">Contado</th><th className="text-right">Dif.</th></tr></thead>
            <tbody>
              {cierres.map((c: any) => {
                const ganancia = c.total_ingresos - c.total_egresos
                const diffClass = c.diferencia < 0 ? 'text-red' : c.diferencia > 0 ? 'text-blue' : 'text-green'
                return (
                  <tr key={c.id_cierre}>
                    <td>
                      <div>{new Date(c.fecha_apertura).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--caramel)' }}>
                        {new Date(c.fecha_apertura).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })} – {new Date(c.fecha_cierre).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </td>
                    <td>{c.nombre_usuario}</td>
                    <td className="text-right">{formatCurrency(c.monto_inicial)}</td>
                    <td className="text-right text-green">{formatCurrency(c.total_ingresos)}</td>
                    <td className="text-right text-red">{formatCurrency(c.total_egresos)}</td>
                    <td className="text-right">{formatCurrency(c.saldo)}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(ganancia)}</td>
                    <td className="text-right">{c.efectivo_contado != null ? formatCurrency(c.efectivo_contado) : '–'}</td>
                    <td className={`text-right ${c.diferencia != null ? diffClass : ''}`}>{c.diferencia != null ? formatCurrency(c.diferencia) : '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Egresos y métodos de pago */}
      <div className="reportes-grid">
        <div className="reportes-table-container">
          <h2>Egresos por concepto</h2>
          <div className="reportes-scroll">
            <table className="reportes-table">
              <thead><tr><th>Concepto</th><th className="text-right">Monto</th></tr></thead>
              <tbody>
                {datos.egresosDetalle.map((e: any) => (
                  <tr key={e.concepto}><td>{e.concepto}</td><td className="text-right text-red">{formatCurrency(Number(e.total))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="reportes-table-container">
          <h2>Método de pago</h2>
          <div className="reportes-scroll">
            <table className="reportes-table">
              <thead><tr><th>Método</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {datos.metodosPago.map((m: any) => (
                  <tr key={m.metodo_pago}><td style={{ textTransform: 'capitalize' }}>{m.metodo_pago}</td><td className="text-right" style={{ fontWeight: 500 }}>{formatCurrency(Number(m.total))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
