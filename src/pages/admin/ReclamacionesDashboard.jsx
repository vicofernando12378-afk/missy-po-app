import { useState, useEffect } from 'react';

import { obtenerReclamaciones, actualizarEstadoReclamacion } from '../../services';

const ESTADOS_CFG = {
  recibido:    { label: 'Recibido',     bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200' },
  en_revision: { label: 'En Revisión',  bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200' },
  respondido:  { label: 'Respondido',   bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  cerrado:     { label: 'Cerrado',      bg: 'bg-gray-100',   text: 'text-gray-700',    border: 'border-gray-200' },
};

export default function ReclamacionesDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [procesando, setProcesando] = useState({});
  const [error, setError] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const estado = filtro === 'todos' ? null : filtro;
      const data = await obtenerReclamaciones({ estado, limite: 50 });
      setItems(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar el listado de reclamos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [filtro]);

  const handleCambiarEstado = async (id, estado) => {
    setProcesando(prev => ({ ...prev, [id]: true }));
    try {
      await actualizarEstadoReclamacion(id, estado);
      setItems(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
    } catch (e) {
      console.error(e);
      setError('Error al actualizar el estado del reclamo.');
    } finally {
      setProcesando(prev => ({ ...prev, [id]: false }));
    }
  };

  const formatFecha = (valor) => {
    if (!valor) return '—';
    const fecha = valor instanceof Date ? valor : new Date(valor);
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-brand text-3xl text-gray-850">Reclamos y Quejas</h1>
          <p className="text-gray-450 text-sm mt-1">
            Atención de solicitudes registradas desde el formulario público.
          </p>
        </div>
        <button
          onClick={cargar}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[
          ['todos', 'Todos'],
          ['recibido', 'Recibidos'],
          ['en_revision', 'En Revisión'],
          ['respondido', 'Respondidos'],
          ['cerrado', 'Cerrados'],
        ].map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setFiltro(valor)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filtro === valor
                ? 'bg-white text-gray-800 shadow-sm border-gray-200'
                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 mt-4 font-body">Cargando reclamos...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-gray-600 font-semibold">No hay reclamos en esta categoría</p>
          <p className="text-gray-400 text-sm mt-1">
            Los reclamos nuevos aparecerán aquí cuando los usuarios envíen el formulario.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(r => {
            const estadoCfg = ESTADOS_CFG[r.estado] || ESTADOS_CFG.recibido;
            const cliente = r.cliente || {};
            const detalle = r.detalle || {};
            const bien = r.bien || {};
            const isProcesando = procesando[r.id];

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800 text-sm">
                        {cliente.nombre} {cliente.apellido}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${estadoCfg.bg} ${estadoCfg.text} ${estadoCfg.border}`}>
                        {estadoCfg.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        #{r.codigo || r.id}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        📅 {formatFecha(r.creado_en)}
                        {cliente.email && <span className="ml-2">· ✉️ {cliente.email}</span>}
                        {cliente.telefono && <span className="ml-2">· 📞 {cliente.telefono}</span>}
                      </p>
                      <p>
                        📦 {bien.tipo || 'Producto'}
                        {bien.monto ? ` · S/ ${Number(bien.monto).toFixed(2)}` : ''}
                      </p>
                      <p>📌 {detalle.tipo || 'Reclamo'}: {detalle.descripcion || 'Sin detalle.'}</p>
                      {detalle.pedido && (
                        <p>🧾 Pedido relacionado: #{detalle.pedido}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <select
                      value={r.estado}
                      disabled={isProcesando}
                      onChange={(e) => handleCambiarEstado(r.id, e.target.value)}
                      className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    >
                      <option value="recibido">Recibido</option>
                      <option value="en_revision">En Revisión</option>
                      <option value="respondido">Respondido</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
