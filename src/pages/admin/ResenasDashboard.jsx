import { useState, useEffect } from 'react'
import { obtenerResenas, actualizarEstadoResena, eliminarResena } from '../../services/firestore'

// ============================================================
// RESEÑAS DASHBOARD — Moderación de Opiniones de Clientes
// Missy & Po Pet Shop | Admin Panel
// ============================================================

const ESTADO_CFG = {
  pendiente: { label: 'Pendiente',  bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-200' },
  aprobada:  { label: 'Aprobada',   bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  rechazada: { label: 'Rechazada',  bg: 'bg-red-50',     text: 'text-red-800',    border: 'border-red-200' },
}

function Estrellas({ calificacion, size = 'text-base' }) {
  return (
    <div className={`flex gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= calificacion ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  )
}

export default function ResenasDashboard() {
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos') // 'todos' | 'pendiente' | 'aprobada' | 'rechazada'
  const [procesando, setProcesando] = useState({})

  const cargar = async () => {
    setLoading(true)
    try {
      const estado = filtro === 'todos' ? null : filtro
      const data = await obtenerResenas(estado)
      setResenas(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [filtro])

  const handleCambiarEstado = async (id, nuevoEstado) => {
    setProcesando(prev => ({ ...prev, [id]: true }))
    try {
      await actualizarEstadoResena(id, nuevoEstado)
      setResenas(prev => prev.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r))
    } catch (e) {
      console.error(e)
    } finally {
      setProcesando(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleEliminar = async (id, autorNombre) => {
    if (!window.confirm(`¿Eliminar la reseña de "${autorNombre}"? Esta acción es permanente.`)) return
    setProcesando(prev => ({ ...prev, [id]: true }))
    try {
      await eliminarResena(id)
      setResenas(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setProcesando(prev => ({ ...prev, [id]: false }))
    }
  }

  const counts = {
    todos:     resenas.length,
    pendiente: resenas.filter(r => r.estado === 'pendiente').length,
    aprobada:  resenas.filter(r => r.estado === 'aprobada').length,
    rechazada: resenas.filter(r => r.estado === 'rechazada').length,
  }

  // Stats globales
  const calificacionProm = resenas.length > 0
    ? (resenas.reduce((s, r) => s + (r.calificacion || 0), 0) / resenas.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-brand text-3xl text-gray-850">Moderación de Reseñas</h1>
        <p className="text-gray-450 text-sm mt-1">
          Aprueba o rechaza las opiniones de tus clientes antes de que aparezcan en la tienda.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Reseñas', value: resenas.length, icon: '💬', color: 'bg-gray-50' },
          { label: 'Pendientes', value: counts.pendiente, icon: '⏳', color: 'bg-amber-50' },
          { label: 'Aprobadas', value: counts.aprobada, icon: '✅', color: 'bg-emerald-50' },
          { label: 'Calificación Prom.', value: `${calificacionProm} ★`, icon: '⭐', color: 'bg-yellow-50' },
        ].map(s => (
          <div key={s.label} className={`p-4 ${s.color} rounded-2xl border border-gray-100 flex items-center gap-3`}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-brand text-gray-850">{s.value}</p>
              <p className="text-[11px] text-gray-450 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1 w-fit">
        {[
          ['todos', `Todas (${resenas.length})`],
          ['pendiente', `Pendientes`],
          ['aprobada', `Aprobadas`],
          ['rechazada', `Rechazadas`],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filtro === val ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 mt-4 font-body">Cargando reseñas...</p>
        </div>
      ) : resenas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-5xl block mb-3">💬</span>
          <p className="text-gray-600 font-semibold">No hay reseñas en esta categoría</p>
          <p className="text-gray-400 text-sm mt-1">
            Cuando los clientes dejen opiniones en los productos, aparecerán aquí para moderación.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenas.map(resena => {
            const estadoCfg = ESTADO_CFG[resena.estado] || ESTADO_CFG.pendiente
            const isProcesando = procesando[resena.id]
            return (
              <div
                key={resena.id}
                className={`bg-white rounded-3xl border ${
                  resena.estado === 'pendiente' ? 'border-amber-100 shadow-sm shadow-amber-50' : 'border-gray-100'
                } p-6 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Datos de la reseña */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="w-9 h-9 rounded-full bg-coral/10 flex items-center justify-center font-bold text-coral text-sm shrink-0">
                        {(resena.autor_nombre || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{resena.autor_nombre || 'Anónimo'}</p>
                        <p className="text-[11px] text-gray-400">
                          {resena.creado_en instanceof Date
                            ? resena.creado_en.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <span className={`ml-auto sm:ml-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${estadoCfg.bg} ${estadoCfg.text} ${estadoCfg.border}`}>
                        {estadoCfg.label}
                      </span>
                    </div>

                    <div className="mb-2">
                      <Estrellas calificacion={resena.calificacion || 0} />
                    </div>

                    <p className="text-xs text-gray-500 font-semibold mb-1">
                      📦 {resena.producto_nombre || 'Producto desconocido'}
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 mt-2">
                      "{resena.comentario || 'Sin comentario.'}"
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                    {resena.estado !== 'aprobada' && (
                      <button
                        onClick={() => handleCambiarEstado(resena.id, 'aprobada')}
                        disabled={isProcesando}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200 disabled:opacity-50"
                      >
                        ✅ Aprobar
                      </button>
                    )}
                    {resena.estado !== 'rechazada' && (
                      <button
                        onClick={() => handleCambiarEstado(resena.id, 'rechazada')}
                        disabled={isProcesando}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all border border-red-200 disabled:opacity-50"
                      >
                        ✕ Rechazar
                      </button>
                    )}
                    {resena.estado === 'aprobada' && (
                      <button
                        onClick={() => handleCambiarEstado(resena.id, 'pendiente')}
                        disabled={isProcesando}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-all border border-amber-200 disabled:opacity-50"
                      >
                        ↩ Revisar
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(resena.id, resena.autor_nombre)}
                      disabled={isProcesando}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
