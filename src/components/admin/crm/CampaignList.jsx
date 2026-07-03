/**
 * CampaignList.jsx — List of email campaigns and dispatcher.
 * Shows: name, segment, subject, status, delivery stats.
 */
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { listSegments } from '../../../services/crmSegments';
import { db, auth } from '../../../services/firebase';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CampaignList({ onCreateNew, onEditCampaign }) {
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    // Load segments to map names
    listSegments().then(setSegments).catch(console.error);

    // Stream campaigns
    const q = query(collection(db, 'crm_campaigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error('[CampaignList] Stream error:', err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  function getSegmentName(id) {
    return segments.find(s => s.id === id)?.name || 'Segmento no encontrado';
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Deseas eliminar la campaña "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'crm_campaigns', id));
    } catch (err) {
      console.error('[CampaignList] Error deleting:', err);
      alert('Error al eliminar campaña.');
    }
  }

  // Trigger campaign dispatch via Firebase Cloud Function (Callable fetch)
  async function handleSendCampaign(campaignId, name) {
    if (!confirm(`¿Estás seguro de que deseas enviar la campaña "${name}" ahora mismo? Esta acción enviará correos reales.`)) return;
    
    setSendingId(campaignId);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No estás autenticado.');

      const token = await user.getIdToken();
      // Call Firebase function via standard HTTPS Callable protocol
      const response = await fetch('https://us-central1-missy-po.cloudfunctions.net/missy-po-crm-sendCampaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { campaignId } }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Error al despachar campaña.');
      }

      alert(`¡Campaña enviada con éxito a ${result.result?.sentCount ?? 0} leads!`);
    } catch (err) {
      console.error('[CampaignList] Error sending campaign:', err);
      alert(`Error al enviar campaña: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h3 className="font-brand text-lg text-gray-800">✉️ Campañas Promocionales</h3>
          <p className="text-xs text-gray-400">Crea, edita y envía correos masivos a tus segmentos de leads.</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-5 py-3 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all text-xs cursor-pointer border-none shadow-md shadow-coral/15 flex items-center gap-1.5"
        >
          <span>➕ Nueva Campaña</span>
        </button>
      </div>

      {/* Grid of campaigns */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-sm font-medium">Cargando historial de campañas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-20 text-center space-y-2 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="text-5xl">✉️</div>
          <h4 className="text-gray-800 font-semibold text-base">No hay campañas creadas</h4>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            Diseña tu primera campaña de email para fidelizar o calificar a tus leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((camp) => {
            const isSent = camp.status === 'enviada';
            const isSending = camp.status === 'enviando' || sendingId === camp.id;
            
            return (
              <div key={camp.id} className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all">
                {/* Info block */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-brand text-lg text-gray-850 font-bold">{camp.name}</h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      isSent ? 'bg-green-50 text-green-600 border border-green-150' : 
                      isSending ? 'bg-amber-50 text-amber-600 border border-amber-150 animate-pulse' :
                      'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 font-medium">
                    Asunto: <span className="font-normal text-gray-400 italic">&quot;{camp.subject}&quot;</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Segmento: <span className="font-semibold text-gray-500">{getSegmentName(camp.segmentId)}</span>
                    {' · '}Creado el: <span className="font-semibold text-gray-500">{formatDate(camp.createdAt)}</span>
                  </p>

                  {/* Delivery stats */}
                  {isSent && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 max-w-md">
                      {[
                        ['Enviados', camp.stats?.sent ?? 0, 'bg-gray-50 text-gray-600'],
                        ['Abiertos', camp.stats?.opened ?? 0, 'bg-green-50 text-green-600'],
                        ['Clics', camp.stats?.clicked ?? 0, 'bg-blue-50 text-blue-600'],
                        ['Rebotados', camp.stats?.bounced ?? 0, 'bg-red-50 text-red-600'],
                      ].map(([label, val, style]) => (
                        <div key={label} className={`p-2 rounded-xl text-center border border-gray-100 ${style}`}>
                          <span className="text-lg font-black block">{val}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider block opacity-70 mt-0.5">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions block */}
                <div className="flex md:flex-col justify-end items-end gap-2 flex-shrink-0 self-center md:self-stretch">
                  {!isSent && !isSending && (
                    <button
                      onClick={() => handleSendCampaign(camp.id, camp.name)}
                      className="w-full md:w-auto px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer border-none shadow-md shadow-green-600/10 flex items-center justify-center gap-1"
                    >
                      🚀 Enviar ahora
                    </button>
                  )}

                  <div className="flex gap-1">
                    {!isSent && !isSending && (
                      <button
                        onClick={() => onEditCampaign(camp)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="Editar campaña"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(camp.id, camp.name)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                      title="Eliminar campaña"
                    >
                      🗑️
                    </button>
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
