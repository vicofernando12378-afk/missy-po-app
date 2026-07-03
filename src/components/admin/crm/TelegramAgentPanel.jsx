/**
 * TelegramAgentPanel.jsx — Admin UI for managing Telegram AI bot.
 * Features: personality config, voice toggle, conversation controls.
 */
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../../../services/firebase';

const TONE_OPTIONS = [
  { value: 'casual', label: 'Casual — Amigable, informal' },
  { value: 'profesional', label: 'Profesional — Formal, técnico' },
  { value: 'calido-profesional', label: 'Cálido-Profesional — Balance ideal para ventas' },
];

const DEFAULT_PERSONALITY = {
  name: 'Missy',
  description: 'Asistente de ventas amigable y experta en mascotas.',
  tone: 'calido-profesional',
  rules: [],
  greeting: '',
  fallback: '',
};

const DEFAULT_ESCALATION = {
  businessHours: { start: 9, end: 19, timezone: 'America/Lima' },
};

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('es-PE', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TelegramAgentPanel() {
  const [config, setConfig] = useState({
    systemPrompt: '',
    voiceEnabled: false,
    personality: { ...DEFAULT_PERSONALITY },
    escalation: { ...DEFAULT_ESCALATION },
  });
  const [conversations, setConversations] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    loadBotConfig();
    const q = query(collection(db, 'crm_conversations'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingChats(false);
    }, () => setLoadingChats(false));
    return unsubscribe;
  }, []);

  async function loadBotConfig() {
    setLoadingConfig(true);
    try {
      const docSnap = await getDoc(doc(db, 'crm_bot_config', 'telegram'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig({
          systemPrompt: data.systemPrompt || '',
          voiceEnabled: !!data.voiceEnabled,
          personality: { ...DEFAULT_PERSONALITY, ...data.personality },
          escalation: { ...DEFAULT_ESCALATION, ...data.escalation },
        });
      }
    } catch (err) {
      console.error('[TelegramAgentPanel] Error loading config:', err);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function handleSaveConfig(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'crm_bot_config', 'telegram'), {
        systemPrompt: config.systemPrompt.trim(),
        voiceEnabled: config.voiceEnabled,
        personality: config.personality,
        escalation: config.escalation,
        updatedAt: new Date(),
      }, { merge: true });
      alert('Configuración guardada.');
    } catch (err) {
      console.error('[TelegramAgentPanel] Error saving:', err);
      alert('Error al guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(chatId, newStatus) {
    try {
      await updateDoc(doc(db, 'crm_conversations', chatId), {
        status: newStatus,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('[TelegramAgentPanel] Status change error:', err);
    }
  }

  function updatePersonality(field, value) {
    setConfig(p => ({
      ...p,
      personality: { ...p.personality, [field]: value },
    }));
  }

  function addRule() {
    if (!newRule.trim()) return;
    setConfig(p => ({
      ...p,
      personality: {
        ...p.personality,
        rules: [...(p.personality.rules || []), newRule.trim()],
      },
    }));
    setNewRule('');
  }

  function removeRule(idx) {
    setConfig(p => ({
      ...p,
      personality: {
        ...p.personality,
        rules: p.personality.rules.filter((_, i) => i !== idx),
      },
    }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Left: Config */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
          <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
            🤖 Configuración del Bot
          </h3>
          <p className="text-xs text-gray-400 mb-6">Personalidad y comportamiento del agente IA.</p>

          {loadingConfig ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-5">
              {/* Personality Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Personalidad</h4>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del bot</label>
                  <input
                    type="text"
                    value={config.personality.name}
                    onChange={e => updatePersonality('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20"
                    placeholder="Missy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={config.personality.description}
                    onChange={e => updatePersonality('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral/20"
                    placeholder="Asistente de ventas amigable y experta en mascotas..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tono</label>
                  <select
                    value={config.personality.tone}
                    onChange={e => updatePersonality('tone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20"
                  >
                    {TONE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Saludo inicial</label>
                  <textarea
                    rows={2}
                    value={config.personality.greeting}
                    onChange={e => updatePersonality('greeting', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral/20"
                    placeholder="¡Hola! Soy Missy, tu asesora de mascotas..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reglas de conducta</label>
                  <div className="space-y-1 mb-2">
                    {(config.personality.rules || []).map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded-lg">
                        <span className="flex-1 text-gray-700">• {rule}</span>
                        <button type="button" onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRule}
                      onChange={e => setNewRule(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-coral/20"
                      placeholder="Nueva regla..."
                    />
                    <button type="button" onClick={addRule} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">+</button>
                  </div>
                </div>
              </div>

              {/* Escalation Section */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Escalación</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hora inicio</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.escalation.businessHours.start}
                      onChange={e => setConfig(p => ({
                        ...p,
                        escalation: { ...p.escalation, businessHours: { ...p.escalation.businessHours, start: parseInt(e.target.value) || 9 } },
                      }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hora fin</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.escalation.businessHours.end}
                      onChange={e => setConfig(p => ({
                        ...p,
                        escalation: { ...p.escalation, businessHours: { ...p.escalation.businessHours, end: parseInt(e.target.value) || 19 } },
                      }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Zona horaria</label>
                    <select
                      value={config.escalation.businessHours.timezone}
                      onChange={e => setConfig(p => ({
                        ...p,
                        escalation: { ...p.escalation, businessHours: { ...p.escalation.businessHours, timezone: e.target.value } },
                      }))}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                    >
                      <option value="America/Lima">Lima (GMT-5)</option>
                      <option value="America/Bogota">Bogotá (GMT-5)</option>
                      <option value="America/Mexico_City">CDMX (GMT-6)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Voice Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-700 block">Respuestas en Audio (TTS)</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">El bot responderá notas de voz usando IA</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.voiceEnabled}
                    onChange={e => setConfig(p => ({ ...p, voiceEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-coral" />
                </label>
              </div>

              {/* System Prompt (advanced) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  System Prompt (Avanzado)
                </label>
                <textarea
                  rows={6}
                  value={config.systemPrompt}
                  onChange={e => setConfig(p => ({ ...p, systemPrompt: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-coral/20 font-mono resize-y"
                  placeholder="Se genera automáticamente desde la personalidad y knowledge base. Solo editá si sabés lo que hacés."
                />
                <p className="text-[10px] text-gray-400 mt-1">Este prompt se genera automáticamente con la personalidad y knowledge base. Editing manual override.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-coral/15 text-xs"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración 💾'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right: Conversations */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
              💬 Conversaciones Activas
            </h3>
            <p className="text-xs text-gray-400 mb-6">Intervén conversaciones en tiempo real.</p>

            {loadingChats ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-16 text-center text-gray-300 italic text-sm">
                Sin conversaciones activas.
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto pr-1">
                {conversations.map((chat) => (
                  <div key={chat.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">Chat #{chat.externalId}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          chat.status === 'bot' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          chat.status === 'esperando_humano' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                          'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {chat.status === 'bot' ? '🤖 IA' :
                           chat.status === 'esperando_humano' ? '⏳ Ayuda' : '👤 Humano'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-1">{formatDate(chat.lastMessageAt)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {chat.status === 'bot' || chat.status === 'esperando_humano' ? (
                        <button
                          onClick={() => handleStatusChange(chat.id, 'humano')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow transition-all"
                        >
                          👤 Atender
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(chat.id, 'bot')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow transition-all"
                        >
                          🤖 Devolver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
