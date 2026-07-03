/**
 * SegmentList.jsx — List of CRM segments.
 * Shows name, rules summary, materialized leadCount, lastComputedAt.
 */
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { listLeads } from '../../../services/crmLeads';
import { listSegments, deleteSegment, updateSegment } from '../../../services/crmSegments';
import { evaluateSegment } from '../../../services/crmSegments';
import { db } from '../../../services/firebase';

function formatRulesSummary(rules) {
  if (!rules || rules.length === 0) return 'Sin reglas';
  return rules.map(r => `${r.field} ${r.operator} "${r.value}"`).join(' AND ');
}

function formatDate(ts) {
  if (!ts) return 'Nunca';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SegmentList({ onCreateNew, onEditSegment }) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculatingId, setRecalculatingId] = useState(null);

  useEffect(() => {
    loadSegments();
  }, []);

  async function loadSegments() {
    setLoading(true);
    try {
      const data = await listSegments();
      setSegments(data);
    } catch (err) {
      console.error('[SegmentList] Error loading segments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Estás seguro de que deseas eliminar el segmento "${name}"?`)) return;
    try {
      await deleteSegment(id);
      setSegments(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('[SegmentList] Error deleting segment:', err);
      alert('Error al eliminar segmento.');
    }
  }

  // Instant local recalculation & update in Firestore
  async function handleRecalculate(segment) {
    setRecalculatingId(segment.id);
    try {
      // 1. Fetch all leads
      const leads = await listLeads({ max: 1000 });
      // 2. Filter matching leads
      const matchingLeadIds = leads
        .filter(lead => evaluateSegment(lead, segment.rules))
        .map(lead => lead.id);

      // 3. Update doc in Firestore
      const segRef = doc(db, 'crm_segments', segment.id);
      await updateDoc(segRef, {
        leadIds: matchingLeadIds,
        leadCount: matchingLeadIds.length,
        lastComputedAt: serverTimestamp(),
      });

      // 4. Update local state
      setSegments(prev => prev.map(s =>
        s.id === segment.id
          ? { ...s, leadIds: matchingLeadIds, leadCount: matchingLeadIds.length, lastComputedAt: { toDate: () => new Date() } }
          : s,
      ));
    } catch (err) {
      console.error('[SegmentList] Error recalculating segment:', err);
      alert('Hubo un error al recalcular el segmento.');
    } finally {
      setRecalculatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="font-brand text-lg text-gray-800">🏷️ Segmentos del CRM</h3>
          <p className="text-xs text-gray-400">Crea agrupaciones de leads para enviarles campañas segmentadas de email.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-5 py-3 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all text-xs cursor-pointer border-none shadow-md shadow-coral/15 flex items-center gap-1.5"
        >
          <span>➕ Crear Segmento</span>
        </button>
      </div>

      {/* Main table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 text-sm font-medium">Cargando segmentos...</p>
          </div>
        ) : segments.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="text-5xl">🏷️</div>
            <h4 className="text-gray-800 font-semibold text-base">No hay segmentos creados</h4>
            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              Crea tu primer segmento dinámico para agrupar clientes por tags, origen, score u otras reglas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Nombre del Segmento</th>
                  <th className="px-6 py-4">Filtros (Reglas AND)</th>
                  <th className="px-6 py-4 text-center">Leads Coincidentes</th>
                  <th className="px-6 py-4">Último Cálculo</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {segments.map((seg) => (
                  <tr key={seg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{seg.name}</p>
                      {seg.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{seg.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-mono block max-w-xs truncate" title={formatRulesSummary(seg.rules)}>
                        {formatRulesSummary(seg.rules)}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-coral text-base">
                      {seg.leadCount ?? 0}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                      {formatDate(seg.lastComputedAt)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleRecalculate(seg)}
                        disabled={recalculatingId === seg.id}
                        className="px-2.5 py-1.5 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all cursor-pointer border-none font-bold disabled:opacity-50"
                        title="Recalcular ahora"
                      >
                        {recalculatingId === seg.id ? '⏳...' : '🔄 Recalcular'}
                      </button>
                      <button
                        onClick={() => onEditSegment(seg)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="Editar segmento"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(seg.id, seg.name)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="Eliminar segmento"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
