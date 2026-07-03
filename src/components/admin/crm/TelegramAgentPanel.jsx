/**
 * TelegramAgentPanel.jsx — Admin UI for managing Telegram AI bot.
 * Allows editing prompt, toggling voice response, and taking over chat controls.
 */
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '../../../services/firebase';

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
  });
  const [conversations, setConversations] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBotConfig();

    // Stream conversations in real-time
    const q = query(collection(db, 'crm_conversations'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingChats(false);
    }, (err) => {
      console.error('[TelegramAgentPanel] Error streaming chats:', err);
      setLoadingChats(false);
    });

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
        updatedAt: new Date(),
      }, { merge: true });
      alert('Configuración guardada correctamente.');
    } catch (err) {
      console.error('[TelegramAgentPanel] Error saving config:', err);
      alert('Error al guardar configuración.');
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
      console.error('[TelegramAgentPanel] Error changing status:', err);
      alert('Error al actualizar estado.');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Columna Izquierda: Configuración del Bot (5 Columnas) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm">
          <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
            🤖 Configuración del Agente IA
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Ajusta la personalidad y alcances del bot de Telegram en tiempo real.
          </p>

          {loadingConfig ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* System Prompt (Dynamic Personality) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  Personalidad del Bot (System Prompt)
                </label>
                <textarea
                  rows={10}
                  required
                  value={config.systemPrompt}
                  onChange={e => setConfig(p => ({ ...p, systemPrompt: e.target.value }))}
                  placeholder="Ej: Eres Missy, la asistente virtual de Missy & Po Pet Shop. Ayuda a los tutores a buscar productos y consultar el estado de sus pedidos..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral font-sans resize-y"
                />
              </div>

              {/* Voice toggle */}
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

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-coral/15 text-xs font-ui"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración 💾'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Columna Derecha: Panel de Conversaciones Activas (7 Columnas) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">
              💬 Conversaciones Activas
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Intervén las conversaciones del bot de Telegram en tiempo real cuando sea necesario.
            </p>

            {loadingChats ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-16 text-center text-gray-300 italic text-sm">
                Sin conversaciones activas por el momento.
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto pr-1">
                {conversations.map((chat) => (
                  <div key={chat.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800">
                          Chat #{chat.externalId}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          chat.status === 'bot' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          chat.status === 'esperando_humano' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                          'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                          {chat.status === 'bot' ? 'Atendido por IA' :
                           chat.status === 'esperando_humano' ? 'Ayuda Requerida' : 'Agente Humano'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-1">
                        Último mensaje: {formatDate(chat.lastMessageAt)}
                      </p>
                    </div>

                    {/* Actions to override IA bot */}
                    <div className="flex gap-2 flex-shrink-0">
                      {chat.status === 'bot' || chat.status === 'esperando_humano' ? (
                        <button
                          onClick={() => handleStatusChange(chat.id, 'humano')}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow transition-all"
                        >
                          👤 Atender yo
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(chat.id, 'bot')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow transition-all"
                        >
                          🤖 Devolver al Bot
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
