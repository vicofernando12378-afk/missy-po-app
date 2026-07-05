/**
 * escalation.js — Smart escalation logic for the Telegram sales assistant.
 *
 * Detects frustration signals, checks business hours, and triggers
 * automatic escalation to human agents when needed.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const FRUSTRATION_KEYWORDS = [
  // Escalation requests (legit)
  'hablar con alguien', 'persona real', 'quiero hablar con un',
  'atención al cliente', 'supervisor', 'gerente',
  // Frustration signals (strong)
  'estoy molesto', 'estoy molesta', 'qué asco', 'terrible', 'pésimo', 'basura',
  'no me ayuda', 'inútil', 'debería saber', 'no sabes nada', 'para qué sirves',
  // Threats (strong)
  'defensa al consumidor',
];

const FRUSTRATION_PATTERNS = [
  /[A-ZÁÉÍÓÚ\s]{20,}!/g,   // ALL CAPS with exclamation (20+ chars)
  /(.)\1{5,}/g,              // repeated chars 6+ times (aaaaaa, !!!!!!)
  /[?!]{4,}/g,               // 4+ consecutive ?! combos
];

/**
 * Detects frustration signals in a user message.
 * @param {string} message
 * @returns {{ isFrustrated: boolean, reason: string }}
 */
export function detectFrustration(message) {
  if (!message) return { isFrustrated: false, reason: '' };

  const lower = message.toLowerCase();

  // Check keywords
  for (const kw of FRUSTRATION_KEYWORDS) {
    if (lower.includes(kw)) {
      return { isFrustrated: true, reason: `keyword: "${kw}"` };
    }
  }

  // Check patterns
  for (const pattern of FRUSTRATION_PATTERNS) {
    if (pattern.test(message)) {
      return { isFrustrated: true, reason: 'pattern match (caps/repeated chars)' };
    }
  }

  return { isFrustrated: false, reason: '' };
}

/**
 * Checks if current time is within business hours.
 * @param {object} businessHours - { start: number, end: number, timezone: string }
 * @returns {boolean}
 */
export function isBusinessHours(businessHours) {
  const { start = 9, end = 19, timezone = 'America/Lima' } = businessHours || {};

  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const hour = localTime.getHours();
  const day = localTime.getDay(); // 0=Sun, 6=Sat

  if (day === 0) return hour >= 10 && hour < 17; // Sunday: reduced hours
  if (day === 6) return hour >= 9 && hour < 14;  // Saturday: half day
  return hour >= start && hour < end;             // Mon-Fri: full hours
}

/**
 * Sends a Telegram notification to the admin about an escalation.
 */
export async function notifyAdminEscalation({
  chatId,
  leadName,
  reason,
  lastMessage,
  conversationId,
}) {
  const db = getFirestore();
  const now = new Date();

  try {
    // Save notification in Firestore
    await db.collection('crm_notifications').add({
      type: 'escalation',
      channel: 'telegram',
      conversationId,
      leadName: leadName || 'Usuario desconocido',
      reason,
      lastMessage: lastMessage?.substring(0, 200) || '',
      chatId,
      read: false,
      createdAt: Timestamp.fromDate(now),
    });

    // Send Telegram message to admin
    const keys = await import('../lib/config.js').then(m => m.getApiKeys());
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';

    if (adminChatId && keys.TELEGRAM_BOT_TOKEN) {
      const reasonText = {
        frustration: '😤 Frustración detectada',
        business_hours: '🌙 Fuera de horario',
        recursion_limit: '🔄 Límite de herramientas alcanzado',
        manual: '👤 Solicitud del usuario',
      }[reason] || reason;

      const adminMsg = [
        '🔔 *Escalación automática*',
        `*Cliente:* ${leadName || 'Desconocido'}`,
        `*Razón:* ${reasonText}`,
        `*Último mensaje:* "${(lastMessage || '').substring(0, 100)}"`,
        '',
        'Responde en el panel de CVRM para atenderlo.',
      ].join('\n');

      const { default: axios } = await import('axios');
      await axios.post(`https://api.telegram.org/bot${keys.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: adminChatId,
        text: adminMsg,
        parse_mode: 'Markdown',
      });
    }
  } catch (err) {
    console.error('[escalation] Failed to notify admin:', err.message);
  }
}
