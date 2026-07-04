/**
 * GuideModal.jsx — Reusable modal for API key setup guides.
 * Shows step-by-step instructions with links and visual cues.
 */

import { useEffect } from 'react';

const GUIDES = {
  TELEGRAM_BOT_TOKEN: {
    title: 'Telegram Bot Token',
    icon: '🤖',
    steps: [
      { text: 'Abre Telegram y busca @BotFather', link: 'https://t.me/BotFather' },
      { text: 'Envía el comando /newbot' },
      { text: 'Escribe un nombre para tu bot (ej: "MissyPo Asistente")' },
      { text: 'Escribe un username único terminado en "bot" (ej: "MissyPoBot")' },
      { text: 'BotFather te dará un token. Cópialo y pégalo aquí.', highlight: true },
      { text: '⚠️ Nunca compartas este token. Si se compromete, revócalo con /revoke en BotFather.' },
    ],
    docsUrl: 'https://core.telegram.org/bots/tutorial',
  },
  DEEPSEEK_API_KEY: {
    title: 'TokenHub API Key',
    icon: '🧠',
    steps: [
      { text: 'Crea una cuenta en tokenhub.tencentmaas.com', link: 'https://tokenhub.tencentmaas.com' },
      { text: 'Ve a "API Keys" o "Dashboard" en el menú' },
      { text: 'Haz clic en "Create new API key"' },
      { text: 'Dale un nombre descriptivo (ej: "MissyPo-Bot")' },
      { text: 'Copia la key generada. Solo se muestra una vez.', highlight: true },
      { text: 'Modelos: deepseek-v4-flash (recomendado), deepseek-v4-pro (potente), deepseek-v3.2 (estable).' },
      { text: 'Crédito inicial: $1 USD. V4 Flash: ~$0.20/M tokens entrada, ~$0.40/M tokens salida.' },
    ],
    docsUrl: 'https://tokenhub.tencentmaas.com',
  },
  QWEN_API_KEY: {
    title: 'Qwen Cloud API Key (ASR + TTS)',
    icon: '🎙️',
    steps: [
      { text: 'Crea una cuenta en dashscope.aliyuncs.com', link: 'https://dashscope.aliyuncs.com' },
      { text: 'Ve a "API-KEY MANAGEMENT" en el menú superior' },
      { text: 'Haz clic en "Create new API key"' },
      { text: 'Dale un nombre (ej: "MissyPo-Voz") y confirma', highlight: true },
      { text: 'Modelos disponibles: qwen3-asr-flash (voz→texto), qwen3-tts-flash (texto→voz)' },
      { text: 'Precios: ASR ~$0.000035/seg, TTS ~$0.10/10K caracteres.' },
    ],
    docsUrl: 'https://www.alibabacloud.com/help/en/model-studio/developer-reference/qwen-real-time-speech-recognition',
  },
  META_APP_SECRET: {
    title: 'Meta App Secret',
    icon: '📸',
    steps: [
      { text: 'Ve a developers.facebook.com', link: 'https://developers.facebook.com' },
      { text: 'Selecciona tu App o crea una nueva (tipo "Business")' },
      { text: 'En Settings → Basic, encontrarás el App Secret', highlight: true },
      { text: 'Haz clic en "Show" para revelarlo y copiarlo.' },
      { text: '⚠️ Nunca compartas el App Secret. Se usa para validar webhooks.' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/instagram/ig-webhook-setup',
  },
  META_VERIFY_TOKEN: {
    title: 'Meta Verify Token',
    icon: '✅',
    steps: [
      { text: 'En developers.facebook.com, ve a tu App → Webhooks' },
      { text: 'Haz clic en "Edit Subscription" o "Configure Webhooks"' },
      { text: 'En "Verify token", escribe un token único que tú crees', highlight: true },
      { text: 'Este token lo configuraste también en tu Cloud Function.' },
      { text: 'No es un token de Meta — es un secreto compartido entre tu app y Meta.' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/graph-api/webhooks/getting-started',
  },
  META_PAGE_ACCESS_TOKEN: {
    title: 'Meta Page Access Token',
    icon: '📄',
    steps: [
      { text: 'Ve a developers.facebook.com → Graph API Explorer', link: 'https://developers.facebook.com/tools/explorer/' },
      { text: 'Selecciona tu App en el dropdown superior' },
      { text: 'En "User or Page", selecciona tu Página de Facebook' },
      { text: 'En permisos, asegúrate de tener: pages_manage_posts, pages_read_engagement, pages_messaging' },
      { text: 'Haz clic en "Generate Access Token"', highlight: true },
      { text: '⚠️ Token de corta duración. Para producción, intercámbialo por un token de larga duración con el endpoint /oauth/access_token.' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/pages-api/overview',
  },
  YOUTUBE_API_KEY: {
    title: 'YouTube Data API Key',
    icon: '📺',
    steps: [
      { text: 'Ve a console.cloud.google.com', link: 'https://console.cloud.google.com' },
      { text: 'Selecciona o crea un proyecto' },
      { text: 'En "APIs & Services" → "Library", busca "YouTube Data API v3" y hábilitala' },
      { text: 'Ve a "APIs & Services" → "Credentials"' },
      { text: 'Haz clic en "Create Credentials" → "API key"', highlight: true },
      { text: 'Restringe la key solo a YouTube Data API v3 en producción.' },
    ],
    docsUrl: 'https://developers.google.com/youtube/v3/getting-started',
  },
  YOUTUBE_CHANNEL_ID: {
    title: 'YouTube Channel ID',
    icon: '🆔',
    steps: [
      { text: 'Ve a youtube.com/account_advanced', link: 'https://www.youtube.com/account_advanced' },
      { text: 'Tu Channel ID aparece como una cadena que empieza con "UC"' },
      { text: 'Cópiala y pégala aquí.', highlight: true },
    ],
    docsUrl: 'https://support.google.com/youtube/answer/2579824',
  },
  TIKTOK_PIXEL_ID: {
    title: 'TikTok Pixel ID',
    icon: '🎵',
    steps: [
      { text: 'Ve to TikTok Ads Manager: ads.tiktok.com', link: 'https://ads.tiktok.com' },
      { text: 'Ve a "Assets" → "Events" → "Web Events"' },
      { text: 'Haz clic en "Manage" → "Set up Web Events"' },
      { text: 'Selecciona "TikTok Pixel" y dale un nombre' },
      { text: 'Copia el Pixel ID generado.', highlight: true },
      { text: 'Instala el pixel en tu sitio con el snippet de TikTok Events API.' },
    ],
    docsUrl: 'https://ads.tiktok.com/help/article/tiktok-pixel',
  },
  BREVO_API_KEY: {
    title: 'Brevo (Sendinblue) API Key',
    icon: '✉️',
    steps: [
      { text: 'Crea una cuenta en app.brevo.com', link: 'https://app.brevo.com' },
      { text: 'Ve a "SMTP & API" → "API Keys" en el menú superior' },
      { text: 'Haz clic en "Generate a new API key"' },
      { text: 'Dale un nombre (ej: "MissyPo-CRM") y selecciona "Full Access"', highlight: true },
      { text: 'Copia la key. Solo se muestra una vez.' },
    ],
    docsUrl: 'https://developers.brevo.com/reference/send-smtp-email',
  },
  BREVO_SENDER_EMAIL: {
    title: 'Brevo Sender Email',
    icon: '📧',
    steps: [
      { text: 'En app.brevo.com, ve a "Senders & IP"' },
      { text: 'Haz clic en "Add a new sender"' },
      { text: 'Ingresa tu email de envío (ej: hola@missypoweb.com)', highlight: true },
      { text: 'Verifica el email haciendo clic en el link de confirmación que recibirás.' },
      { text: 'También configura SPF/DKIM en tu DNS para mejor entregabilidad.' },
    ],
    docsUrl: 'https://help.brevo.com/hc/en/articles/210723525-What-are-the-allowlisted-Senders-and-domains',
  },
  BREVO_SENDER_NAME: {
    title: 'Brevo Sender Name',
    icon: '📛',
    steps: [
      { text: 'En la misma sección de "Add a new sender"' },
      { text: 'Escribe el nombre que aparecerá como remitente (ej: "Missy & Po")', highlight: true },
      { text: 'Este es el nombre que ven los destinatarios en su bandeja de entrada.' },
    ],
    docsUrl: 'https://help.brevo.com/hc/en/articles/210723525',
  },
};

export default function GuideModal({ guideKey, onClose }) {
  const guide = GUIDES[guideKey];

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!guide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{guide.icon}</span>
            <h2 className="font-brand text-lg text-gray-800">{guide.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-coral/10 text-coral font-bold text-xs flex items-center justify-center mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className={`text-sm leading-relaxed ${step.highlight ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                  {step.text}
                </p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-coral hover:text-coral-dark font-semibold"
                  >
                    Abrir enlace ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          {guide.docsUrl ? (
            <a
              href={guide.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-coral hover:text-coral-dark font-semibold"
            >
              📖 Documentación oficial ↗
            </a>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-coral hover:bg-coral-dark text-white rounded-xl text-xs font-bold transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
