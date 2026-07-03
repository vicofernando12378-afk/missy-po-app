/**
 * LeadDetailDrawer.jsx — Slide-in panel with full lead details.
 * Shows: editable fields, interaction timeline, tasks list.
 * Opened by clicking a LeadCard.
 */
import { useState, useEffect } from 'react';

import { getInteractionsByLead, recordInteraction } from '../../../services/crmInteractions';
import { updateLead, LEAD_STAGES, LEAD_SOURCES } from '../../../services/crmLeads';

const INTERACTION_TYPE_LABELS = {
  comment: 'Comentario',
  dm: 'DM / Mensaje directo',
  message: 'Mensaje',
  call: 'Llamada',
  email_open: 'Apertura de email',
  purchase: 'Compra',
};

const SOURCE_ICONS = {
  whatsapp: '💬', telegram: '✈️', instagram: '📷', facebook: '👤',
  tiktok: '🎵', youtube: '▶️', web: '🌐', manual: '✏️', club: '⭐',
};

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function LeadDetailDrawer({ lead, onClose, onLeadUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({});
  const [interactions, setInteractions] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // New interaction form
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('message');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setFields({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      petName: lead.petName || '',
      tags: (lead.tags || []).join(', '),
    });
    loadInteractions();
  }, [lead?.id]);

  async function loadInteractions() {
    if (!lead?.id) return;
    setLoadingInteractions(true);
    try {
      const data = await getInteractionsByLead(lead.id, 20);
      setInteractions(data);
    } catch (err) {
      console.error('[LeadDetailDrawer] Error loading interactions:', err);
    } finally {
      setLoadingInteractions(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateLead(lead.id, {
        name: fields.name.trim(),
        phone: fields.phone.trim() || null,
        email: fields.email.trim() || null,
        petName: fields.petName.trim() || null,
        tags: fields.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setEditing(false);
      onLeadUpdated?.();
    } catch (err) {
      console.error('[LeadDetailDrawer] Error saving lead:', err);
      alert('Error al guardar cambios.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await recordInteraction({
        leadId: lead.id,
        channel: 'manual',
        type: newNoteType,
        direction: 'outbound',
        content: newNote.trim(),
        aiHandled: false,
      });
      setNewNote('');
      await loadInteractions();
      onLeadUpdated?.();
    } catch (err) {
      console.error('[LeadDetailDrawer] Error adding note:', err);
      alert('Error al guardar la nota.');
    } finally {
      setAddingNote(false);
    }
  }

  if (!lead) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{SOURCE_ICONS[lead.source] || '❓'}</span>
              <h2 className="font-brand text-xl text-gray-800 truncate max-w-[260px]">
                {lead.name}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Etapa: <span className="font-semibold text-gray-600 capitalize">{lead.stage}</span>
              {' · '}Score: <span className="font-bold text-coral">{lead.score ?? 0}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl text-gray-500 hover:text-coral hover:border-coral transition-all cursor-pointer bg-transparent font-semibold"
              >✏️ Editar</button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all cursor-pointer border-none bg-transparent"
            >✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

          {/* Lead fields */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Datos del Lead</h3>
            {editing ? (
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Nombre *', type: 'text' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'phone', label: 'Teléfono', type: 'tel' },
                  { key: 'petName', label: 'Mascota', type: 'text' },
                  { key: 'tags', label: 'Tags (separados por coma)', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={fields[f.key]}
                      onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-coral text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow transition-all hover:bg-coral-dark"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios 💾'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold cursor-pointer bg-transparent"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Email', lead.email],
                  ['Teléfono', lead.phone],
                  ['Mascota', lead.petName],
                  ['Fuente', lead.source],
                  ['Puntos Club', lead.points ?? 0],
                  ['Creado', formatDate(lead.createdAt)],
                  ['Última interacción', formatDate(lead.lastInteractionAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-xs text-gray-400 font-semibold uppercase block">{label}</span>
                    <span className="text-gray-700 font-medium text-xs block mt-0.5">{value || '—'}</span>
                  </div>
                ))}

                {/* Tags */}
                {lead.tags?.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map(t => (
                        <span key={t} className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Add note */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agregar Nota / Interacción</h3>
            <form onSubmit={handleAddNote} className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={newNoteType}
                  onChange={e => setNewNoteType(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral flex-shrink-0"
                >
                  {Object.entries(INTERACTION_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Escribir nota sobre esta interacción..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral resize-none"
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold cursor-pointer border-none transition-all disabled:opacity-50"
              >
                {addingNote ? 'Guardando...' : 'Registrar interacción ✓'}
              </button>
            </form>
          </section>

          {/* Interaction timeline */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Timeline de Interacciones
            </h3>
            {loadingInteractions ? (
              <div className="py-4 text-center">
                <div className="w-5 h-5 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : interactions.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-4 italic">Sin interacciones registradas.</p>
            ) : (
              <div className="space-y-3">
                {interactions.map(inter => (
                  <div key={inter.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${inter.direction === 'inbound' ? 'bg-coral' : 'bg-gray-300'}`} />
                      <div className="w-px flex-1 bg-gray-100 mt-1" />
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-gray-600 capitalize">
                          {INTERACTION_TYPE_LABELS[inter.type] || inter.type}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${inter.direction === 'inbound' ? 'bg-coral/10 text-coral' : 'bg-gray-100 text-gray-400'}`}>
                          {inter.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                        </span>
                        {inter.aiHandled && (
                          <span className="text-[9px] bg-purple-50 text-purple-500 font-semibold px-1.5 py-0.5 rounded-full">IA</span>
                        )}
                      </div>
                      {inter.content && (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{inter.content}</p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1">{formatDate(inter.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
