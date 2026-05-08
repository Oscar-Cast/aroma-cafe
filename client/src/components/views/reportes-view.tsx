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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

  const formatISODate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const formatShortDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // ═══════════════ EXPORTACIÓN XML ═══════════════
  const exportarXML = () => {
    if (!datos) return

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<reporte>\n'
    xml += `  <periodo inicio="${formatISODate(datos.periodo.inicio)}" fin="${formatISODate(datos.periodo.fin)}"/>\n`
    xml += `  <totales>\n    <ingresos>${datos.totalIngresos}</ingresos>\n    <egresos>${datos.totalEgresos}</egresos>\n    <saldo_neto>${datos.saldoNeto}</saldo_neto>\n    <ticket_promedio>${datos.ticketPromedio}</ticket_promedio>\n  </totales>\n`

    xml += '  <ventas_diarias>\n'
    datos.ventasDiarias.forEach((v: any) => {
      xml += `    <dia fecha="${formatISODate(v.fecha)}" total="${v.total}"/>\n`
    })
    xml += '  </ventas_diarias>\n'

    xml += '  <productos>\n'
    datos.productosVendidos.forEach((p: any) => {
      xml += `    <producto nombre="${p.nombre_producto}" categoria="${p.categoria}" cantidad="${p.cantidad_vendida}" total="${p.total_vendido}"/>\n`
    })
    xml += '  </productos>\n'

    xml += '  <metodos_pago>\n'
    datos.metodosPago.forEach((m: any) => {
      xml += `    <metodo nombre="${m.metodo_pago}" total="${m.total}"/>\n`
    })
    xml += '  </metodos_pago>\n'

    xml += '  <egresos>\n'
    datos.egresosDetalle.forEach((e: any) => {
      xml += `    <egreso concepto="${e.concepto}" total="${e.total}"/>\n`
    })
    xml += '  </egresos>\n'

    // Mermas
    xml += '  <mermas>\n'
    xml += '    <productos>\n'
    if (datos.mermasProductos) {
      datos.mermasProductos.forEach((m: any) => {
        xml += `      <merma_producto fecha="${formatISODate(m.fecha_hora)}" producto="${m.nombre_producto}" cantidad="${m.cantidad}" motivo="${m.motivo}" valor="${m.valor_perdida}"/>\n`
      })
    }
    xml += '    </productos>\n'
    xml += '    <insumos>\n'
    if (datos.mermasInsumos) {
      datos.mermasInsumos.forEach((m: any) => {
        xml += `      <merma_insumo fecha="${formatISODate(m.fecha_movimiento)}" insumo="${m.nombre_insumo}" cantidad="${m.cantidad}" unidad="${m.unidad_medida}" motivo="${m.tipo_movimiento === 'merma_caducidad' ? 'Caducidad' : 'Daño'}"/>\n`
      })
    }
    xml += '    </insumos>\n'
    xml += '  </mermas>\n'

    xml += '  <cierres_turno>\n'
    if (Array.isArray(cierres)) {
      cierres.forEach((c: any) => {
        xml += '    <turno>\n'
        xml += `      <fecha_apertura>${formatISODate(c.fecha_apertura)}</fecha_apertura>\n`
        xml += `      <fecha_cierre>${formatISODate(c.fecha_cierre)}</fecha_cierre>\n`
        xml += `      <responsable>${c.nombre_usuario || ''}</responsable>\n`
        xml += `      <fondo_inicial>${c.monto_inicial ?? 0}</fondo_inicial>\n`
        xml += `      <totales>\n        <ingresos>${c.total_ingresos ?? 0}</ingresos>\n        <egresos>${c.total_egresos ?? 0}</egresos>\n        <saldo>${c.saldo ?? 0}</saldo>\n        <ganancia>${(c.total_ingresos ?? 0) - (c.total_egresos ?? 0)}</ganancia>\n      </totales>\n`
        if (c.efectivo_contado != null) {
          xml += `      <arqueo>\n        <efectivo_contado>${c.efectivo_contado}</efectivo_contado>\n        <diferencia>${c.diferencia ?? 0}</diferencia>\n      </arqueo>\n`
        }
        xml += '    </turno>\n'
      })
    }
    xml += '  </cierres_turno>\n'
    xml += '</reporte>'

    const blob = new Blob([xml], { type: 'application/xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `reporte_${formatISODate(datos.periodo.inicio)}_${formatISODate(datos.periodo.fin)}.xml`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ═══════════════ EXPORTACIÓN PDF ═══════════════
  const exportarPDF = () => {
    if (!datos) return
    const ventana = window.open('', '_blank')
    if (!ventana) return

    // Mermas productos
    let filasMermasProd = ''
    if (datos.mermasProductos) {
      datos.mermasProductos.forEach((m: any) => {
        filasMermasProd += `<tr><td>${formatShortDate(m.fecha_hora)}</td><td>${m.nombre_producto}</td><td>${m.cantidad}</td><td>${m.motivo}</td><td>${formatCurrency(parseFloat(m.valor_perdida))}</td></tr>`
      })
    }

    // Mermas insumos
    let filasMermasIns = ''
    if (datos.mermasInsumos) {
      datos.mermasInsumos.forEach((m: any) => {
        filasMermasIns += `<tr><td>${formatShortDate(m.fecha_movimiento)}</td><td>${m.nombre_insumo}</td><td>${m.cantidad} ${m.unidad_medida}</td><td>${m.tipo_movimiento === 'merma_caducidad' ? 'Caducidad' : 'Daño'}</td></tr>`
      })
    }

    let filasCierres = ''
    cierres.forEach((c: any) => {
      const ganancia = (c.total_ingresos ?? 0) - (c.total_egresos ?? 0)
      filasCierres += `<tr>
        <td>${formatShortDate(c.fecha_apertura)}<br><small>${new Date(c.fecha_apertura).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })} - ${new Date(c.fecha_cierre).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}</small></td>
        <td>${c.nombre_usuario || ''}</td>
        <td>${formatCurrency(c.monto_inicial ?? 0)}</td>
        <td>${formatCurrency(c.total_ingresos ?? 0)}</td>
        <td>${formatCurrency(c.total_egresos ?? 0)}</td>
        <td>${formatCurrency(c.saldo ?? 0)}</td>
        <td>${formatCurrency(ganancia)}</td>
        <td>${c.efectivo_contado != null ? formatCurrency(c.efectivo_contado) : '-'}</td>
        <td>${c.diferencia != null ? formatCurrency(c.diferencia) : '-'}</td>
      </tr>`
    })

    const html = `<!DOCTYPE html><html><head><title>Reporte Aroma Café</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #4C3D19; border-bottom: 2px solid #CFBB99; }
        h2 { color: #4C3D19; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        th, td { border: 1px solid #CFBB99; padding: 8px; text-align: left; }
        th { background: #4C3D19; color: white; }
        .totales { display: flex; gap: 20px; margin: 20px 0; }
        .total { border: 1px solid #CFBB99; padding: 15px; border-radius: 8px; flex: 1; }
      </style></head><body>
      <h1>Reporte Aroma Café</h1>
      <p>Período: ${formatISODate(datos.periodo.inicio)} al ${formatISODate(datos.periodo.fin)}</p>
      <div class="totales">
        <div class="total"><strong>Ingresos:</strong> ${formatCurrency(datos.totalIngresos)}</div>
        <div class="total"><strong>Egresos:</strong> ${formatCurrency(datos.totalEgresos)}</div>
        <div class="total"><strong>Saldo neto:</strong> ${formatCurrency(datos.saldoNeto)}</div>
        <div class="total"><strong>Ticket prom.:</strong> ${formatCurrency(datos.ticketPromedio)}</div>
      </div>
      <h2>Ventas por día</h2>
      <table><tr><th>Día</th><th>Total</th></tr>
        ${datos.ventasDiarias.map((v:any) => `<tr><td>${formatShortDate(v.fecha)}</td><td>${formatCurrency(v.total)}</td></tr>`).join('')}
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
      <h2>Mermas – Productos</h2>
      <table><tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Motivo</th><th>Valor</th></tr>${filasMermasProd}</table>
      <h2>Mermas – Insumos</h2>
      <table><tr><th>Fecha</th><th>Insumo</th><th>Cant.</th><th>Motivo</th></tr>${filasMermasIns}</table>
      <h2>Cierres de turno</h2>
      <table>
        <tr><th>Fecha</th><th>Responsable</th><th>Fondo inicial</th><th>Ingresos</th><th>Egresos</th><th>Saldo</th><th>Ganancia</th><th>Efectivo contado</th><th>Diferencia</th></tr>
        ${filasCierres}
      </table>
    </body></html>`

    ventana.document.write(html)
    ventana.document.close()
    ventana.onload = () => ventana.print()
  }

  // ═══════════════ RENDER ═══════════════
  if (loading) return <div className="text-center py-12" style={{ color: 'var(--caramel)' }}>Cargando reportes...</div>
  if (!datos) return <div className="text-center py-12">No hay datos disponibles</div>

  const ventasData = datos.ventasDiarias.map((v: any) => ({
    fecha: formatDate(v.fecha),
    total: parseFloat(v.total)
  }))

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
          <div className="flex gap-1 ml-2">
            <Button variant="outline" size="sm" onClick={exportarXML}><FileText size={16} /> XML</Button>
            <Button variant="outline" size="sm" onClick={exportarPDF}><Printer size={16} /> PDF</Button>
          </div>
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

      <div className="reportes-table-container">
        <h2>Cierres de turno ({cierres.length})</h2>
        <div className="reportes-scroll">
          <table className="reportes-table">
            <thead><tr><th>Fecha</th><th>Responsable</th><th className="text-right">Fondo</th><th className="text-right">Ingresos</th><th className="text-right">Egresos</th><th className="text-right">Saldo</th><th className="text-right">Ganancia</th><th className="text-right">Contado</th><th className="text-right">Dif.</th></tr></thead>
            <tbody>
              {cierres.map((c: any) => {
                const ganancia = (c.total_ingresos ?? 0) - (c.total_egresos ?? 0)
                const diffClass = (c.diferencia ?? 0) < 0 ? 'text-red' : (c.diferencia ?? 0) > 0 ? 'text-blue' : 'text-green'
                return (
                  <tr key={c.id_cierre}>
                    <td>
                      <div>{new Date(c.fecha_apertura).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--caramel)' }}>
                        {new Date(c.fecha_apertura).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })} – {new Date(c.fecha_cierre).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </td>
                    <td>{c.nombre_usuario || ''}</td>
                    <td className="text-right">{formatCurrency(c.monto_inicial ?? 0)}</td>
                    <td className="text-right text-green">{formatCurrency(c.total_ingresos ?? 0)}</td>
                    <td className="text-right text-red">{formatCurrency(c.total_egresos ?? 0)}</td>
                    <td className="text-right">{formatCurrency(c.saldo ?? 0)}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>{formatCurrency(ganancia)}</td>
                    <td className="text-right">{c.efectivo_contado != null ? formatCurrency(c.efectivo_contado) : '–'}</td>
                    <td className={`text-right ${c.diferencia != null ? diffClass : ''}`}>
                      {c.diferencia != null ? formatCurrency(c.diferencia) : '–'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

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
