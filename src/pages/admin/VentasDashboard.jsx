import { useState, useEffect, useMemo } from 'react'
import { obtenerPedidosRango } from '../../services/firestore'

// ============================================================
// VENTAS DASHBOARD — KPIs y Gráficas de Ventas
// Missy & Po Pet Shop | Admin Panel
// ============================================================

const ESTADOS_COLOR = {
  recibido:   { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Recibido' },
  preparando: { bg: 'bg-amber-100',  text: 'text-amber-800',  label: 'Preparando' },
  enviado:    { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Enviado' },
  entregado:  { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Entregado' },
  cancelado:  { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Cancelado' },
}

const RANGOS = [
  { label: 'Últimos 7 días',  dias: 7 },
  { label: 'Últimos 30 días', dias: 30 },
  { label: 'Últimos 90 días', dias: 90 },
]

// Mini gráfica de barras SVG inline
function BarChart({ data }) {
  if (!data || data.length === 0) return null
  const maxVal = Math.max(...data.map(d => d.valor), 1)
  const barW = 100 / data.length
  return (
    <div className="flex items-end gap-1 h-20 w-full mt-2">
      {data.map((d, i) => {
        const heightPct = (d.valor / maxVal) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full bg-coral/80 rounded-t-md transition-all duration-500 hover:bg-coral"
              style={{ height: `${Math.max(heightPct, 2)}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">
                {d.label}: S/ {(d.valor / 100).toFixed(2)}
              </div>
            </div>
            <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function VentasDashboard() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState(30)

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await obtenerPedidosRango(rango)
      setPedidos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [rango])

  // ── KPIs calculados ──────────────────────────────────────
  const kpis = useMemo(() => {
    const activos = pedidos.filter(p => p.estado !== 'cancelado')
    const totalSoles = activos.reduce((s, p) => s + ((p.total_final || p.comprobante?.total || 0)), 0)
    const ticketProm = activos.length > 0 ? totalSoles / activos.length : 0
    const totalItems = activos.reduce((s, p) => s + (p.items || []).reduce((si, i) => si + i.cantidad, 0), 0)

    const porEstado = Object.entries(ESTADOS_COLOR).map(([key, cfg]) => ({
      estado: key,
      label: cfg.label,
      cantidad: pedidos.filter(p => p.estado === key).length,
      bg: cfg.bg, text: cfg.text
    }))

    const porMetodo = {}
    activos.forEach(p => {
      const m = p.pago?.metodo || 'Sin info'
      const key = m.toLowerCase().includes('yape') || m.toLowerCase().includes('plin') || m === 'transferencia'
        ? 'Yape / Plin' : m
      porMetodo[key] = (porMetodo[key] || 0) + (p.total_final || p.comprobante?.total || 0)
    })

    return { totalSoles, ticketProm, totalItems, pedidosCount: activos.length, porEstado, porMetodo }
  }, [pedidos])

  // ── Gráfica por día ──────────────────────────────────────
  const graficaPorDia = useMemo(() => {
    const dias = Math.min(rango, 14) // máximo 14 barras
    const resultado = []
    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - i)
      const key = fecha.toISOString().slice(0, 10) // YYYY-MM-DD
      const label = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
      const valor = pedidos
        .filter(p => {
          const d = p.creado_en instanceof Date ? p.creado_en : new Date(p.creado_en)
          return d.toISOString().slice(0, 10) === key && p.estado !== 'cancelado'
        })
        .reduce((s, p) => s + (p.total_final || p.comprobante?.total || 0), 0)
      resultado.push({ label, valor })
    }
    return resultado
  }, [pedidos, rango])

  // ── Top Productos ────────────────────────────────────────
  const topProductos = useMemo(() => {
    const conteo = {}
    pedidos
      .filter(p => p.estado !== 'cancelado')
      .forEach(p => {
        (p.items || []).forEach(item => {
          const key = item.sku || item.nombre
          if (!conteo[key]) conteo[key] = { nombre: item.nombre, sku: item.sku, imagen: item.imagen, cant: 0, total: 0 }
          conteo[key].cant += item.cantidad
          conteo[key].total += (item.precio_unitario || 0) * item.cantidad
        })
      })
    return Object.values(conteo).sort((a, b) => b.cant - a.cant).slice(0, 5)
  }, [pedidos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl text-gray-850">Dashboard de Ventas</h1>
          <p className="text-gray-450 text-sm mt-1">Métricas y tendencias del negocio en tiempo real.</p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1">
          {RANGOS.map(r => (
            <button
              key={r.dias}
              onClick={() => setRango(r.dias)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                rango === r.dias ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 mt-4 font-body">Calculando métricas de ventas...</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Ingresos Totales',
                value: `S/ ${(kpis.totalSoles / 100).toFixed(2)}`,
                icon: '💰',
                sub: `${kpis.pedidosCount} pedidos`,
                color: 'from-coral/10 to-white border-coral/20',
                textColor: 'text-coral',
              },
              {
                label: 'Ticket Promedio',
                value: `S/ ${(kpis.ticketProm / 100).toFixed(2)}`,
                icon: '🧾',
                sub: 'por pedido',
                color: 'from-indigo-50/50 to-white border-indigo-100',
                textColor: 'text-indigo-700',
              },
              {
                label: 'Unidades Vendidas',
                value: kpis.totalItems,
                icon: '📦',
                sub: 'productos despachados',
                color: 'from-emerald-50/30 to-white border-emerald-100',
                textColor: 'text-emerald-700',
              },
              {
                label: 'Pedidos Activos',
                value: kpis.pedidosCount,
                icon: '🛒',
                sub: `${pedidos.filter(p => p.estado_pedido === 'cancelado').length} cancelados`,
                color: 'from-amber-50/30 to-white border-amber-100',
                textColor: 'text-amber-700',
              },
            ].map(kpi => (
              <div key={kpi.label} className={`p-5 bg-gradient-to-br ${kpi.color} border rounded-3xl shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{kpi.label}</p>
                  <span className="text-2xl">{kpi.icon}</span>
                </div>
                <p className={`text-2xl font-brand ${kpi.textColor}`}>{kpi.value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Fila Principal ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Gráfica ingresos por día */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-brand text-lg text-gray-850 mb-1">Ingresos por Día</h2>
              <p className="text-xs text-gray-400 mb-4">Últimos {Math.min(rango, 14)} días (pedidos no cancelados)</p>
              {graficaPorDia.every(d => d.valor === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl">
                  <span className="text-3xl mb-2">📊</span>
                  <p className="text-gray-400 text-sm">Sin ventas en este rango de fechas</p>
                </div>
              ) : (
                <BarChart data={graficaPorDia} />
              )}
            </div>

            {/* Desglose por método de pago */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-brand text-lg text-gray-850 mb-4">Por Método de Pago</h2>
              {Object.keys(kpis.porMetodo).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(kpis.porMetodo).map(([metodo, total]) => {
                    const pct = kpis.totalSoles > 0 ? Math.round((total / kpis.totalSoles) * 100) : 0
                    return (
                      <div key={metodo}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700">{metodo}</span>
                          <span className="text-gray-500">S/ {(total / 100).toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-coral rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Fila Secundaria ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Estado de Pedidos */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-brand text-lg text-gray-850 mb-4">Pedidos por Estado</h2>
              <div className="space-y-2">
                {kpis.porEstado.map(e => (
                  <div key={e.estado} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${e.bg} ${e.text}`}>{e.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral/60 rounded-full"
                          style={{ width: pedidos.length > 0 ? `${(e.cantidad / pedidos.length) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-6 text-right">{e.cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Productos */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-brand text-lg text-gray-850 mb-4">🏆 Top Productos Vendidos</h2>
              {topProductos.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                  <span className="text-3xl block mb-2">📉</span>
                  <p className="text-gray-400 text-sm">Sin ventas en este período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProductos.map((prod, idx) => (
                    <div key={prod.sku} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0 ? 'bg-amber-400 text-white' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-amber-700/60 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{idx + 1}</span>
                      {prod.imagen && (
                        <img src={prod.imagen} alt={prod.nombre} className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{prod.nombre}</p>
                        <p className="text-[11px] text-gray-400">{prod.cant} uds · S/ {(prod.total / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
