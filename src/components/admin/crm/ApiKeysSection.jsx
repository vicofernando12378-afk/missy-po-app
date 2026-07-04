/**
 * ApiKeysSection.jsx — Admin UI for managing API keys and integrations.
 *
 * Three tabs: Agente IA, Redes Sociales, Email.
 * Each field has a guide button (❓) that opens GuideModal.
 * Password fields have show/hide toggle (👁️).
 */

import { httpsCallable } from 'firebase/functions';
import { useState, useEffect } from 'react';

import { functions } from '../../../services/firebase';

import GuideModal from './GuideModal';

const TABS = [
  { id: 'agent', label: 'Agente IA', icon: '🤖' },
  { id: 'social', label: 'Redes Sociales', icon: '📱' },
  { id: 'email', label: 'Email', icon: '✉️' },
];

const FIELDS = {
  agent: [
    { key: 'TELEGRAM_BOT_TOKEN', label: 'Telegram Bot Token', type: 'password', guide: 'TELEGRAM_BOT_TOKEN', placeholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz' },
    { key: 'TELEGRAM_BOT_USERNAME', label: 'Username del Bot Telegram', type: 'text', guide: 'TELEGRAM_BOT_USERNAME', placeholder: 'Missypo_bot' },
    { key: 'DEEPSEEK_API_KEY', label: 'TokenHub API Key', type: 'password', guide: 'DEEPSEEK_API_KEY', placeholder: 'sk-...' },
    { key: 'DEEPSEEK_MODEL', label: 'Modelo de IA', type: 'select', options: [
      { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash — Recomendado (1M contexto, costo-beneficio)' },
      { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro — Potente (1M contexto, tareas complejas)' },
      { value: 'deepseek-v3.2', label: 'DeepSeek V3.2 — Estable (128K contexto, probado)' },
    ]},
    { key: 'QWEN_API_KEY', label: 'Qwen Cloud API Key (Voz)', type: 'password', guide: 'QWEN_API_KEY', placeholder: 'sk-...' },
    { key: 'QWEN_ASR_MODEL', label: 'Modelo ASR (Voz → Texto)', type: 'select', options: [
      { value: 'qwen3-asr-flash-filetrans', label: 'Qwen3 ASR Flash (batch) — 26 idiomas' },
      { value: 'qwen3-asr-flash-realtime', label: 'Qwen3 ASR Flash (realtime) — Streaming' },
    ]},
    { key: 'QWEN_TTS_MODEL', label: 'Modelo TTS (Texto → Voz)', type: 'select', options: [
      { value: 'qwen3-tts-flash', label: 'Qwen3 TTS Flash — $0.10/10K chars' },
      { value: 'cosyvoice-v3-flash', label: 'CosyVoice V3 Flash — $0.13/10K chars' },
    ]},
    { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key (Fallback)', type: 'password', guide: null, placeholder: 'sk-ant-...' },
  ],
  social: [
    { key: 'META_APP_SECRET', label: 'Meta App Secret', type: 'password', guide: 'META_APP_SECRET', placeholder: 'a1b2c3d4...' },
    { key: 'META_VERIFY_TOKEN', label: 'Meta Verify Token', type: 'text', guide: 'META_VERIFY_TOKEN', placeholder: 'tu_token_secreto' },
    { key: 'META_PAGE_ACCESS_TOKEN', label: 'Meta Page Access Token', type: 'password', guide: 'META_PAGE_ACCESS_TOKEN', placeholder: 'EAAx...' },
    { key: 'YOUTUBE_API_KEY', label: 'YouTube API Key', type: 'password', guide: 'YOUTUBE_API_KEY', placeholder: 'AIza...' },
    { key: 'YOUTUBE_CHANNEL_ID', label: 'YouTube Channel ID', type: 'text', guide: 'YOUTUBE_CHANNEL_ID', placeholder: 'UC...' },
    { key: 'TIKTOK_PIXEL_ID', label: 'TikTok Pixel ID', type: 'text', guide: 'TIKTOK_PIXEL_ID', placeholder: 'C...' },
  ],
  email: [
    { key: 'BREVO_API_KEY', label: 'Brevo API Key', type: 'password', guide: 'BREVO_API_KEY', placeholder: 'xkeysib-...' },
    { key: 'BREVO_SENDER_EMAIL', label: 'Email remitente', type: 'email', guide: 'BREVO_SENDER_EMAIL', placeholder: 'hola@missypoweb.com' },
    { key: 'BREVO_SENDER_NAME', label: 'Nombre remitente', type: 'text', guide: 'BREVO_SENDER_NAME', placeholder: 'Missy & Po' },
  ],
};

function ApiInput({ field, value, onChange, onGuide }) {
  const [visible, setVisible] = useState(false);
  const isPassword = field.type === 'password';
  const inputType = isPassword && !visible ? 'password' : 'text';

  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
          {field.label}
        </label>
        <select
          value={value || field.options[0].value}
          onChange={e => onChange(field.key, e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
        >
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase">
          {field.label}
        </label>
        {field.guide && (
          <button
            type="button"
            onClick={() => onGuide(field.guide)}
            className="text-xs text-coral hover:text-coral-dark font-semibold flex items-center gap-1"
          >
            ¿Cómo obtener? ❓
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type={inputType}
          value={value || ''}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral pr-12 font-mono"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"
            title={visible ? 'Ocultar' : 'Mostrar'}
          >
            {visible ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ApiKeysSection() {
  const [activeTab, setActiveTab] = useState('agent');
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [guideModal, setGuideModal] = useState(null);

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const getKeys = httpsCallable(functions, 'getApiKeysStatus');
      const result = await getKeys();
      setKeys(result.data.keys || {});
    } catch (err) {
      console.error('[ApiKeysSection] Error loading keys:', err);
      setError('Error al cargar configuración.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key, value) {
    setKeys(prev => ({ ...prev, [key]: value }));
    setSuccess('');
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const saveKeys = httpsCallable(functions, 'saveApiKeys');
      await saveKeys(keys);
      setSuccess('Configuración guardada correctamente.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('[ApiKeysSection] Error saving keys:', err);
      setError(err.message || 'Error al guardar configuración.');
    } finally {
      setSaving(false);
    }
  }

  const currentFields = FIELDS[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-coral shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Fields */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-coral border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-xs text-gray-400">Cargando configuración...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentFields.map(field => (
            <ApiInput
              key={field.key}
              field={field}
              value={keys[field.key]}
              onChange={handleChange}
              onGuide={setGuideModal}
            />
          ))}
        </div>
      )}

      {/* Status messages */}
      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-700 font-semibold">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
          ❌ {error}
        </div>
      )}

      {/* Save button */}
      {!loading && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-coral/15 text-xs"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración 💾'}
        </button>
      )}

      {/* Guide Modal */}
      {guideModal && (
        <GuideModal guideKey={guideModal} onClose={() => setGuideModal(null)} />
      )}
    </div>
  );
}
