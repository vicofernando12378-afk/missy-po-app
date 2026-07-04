/**
 * saveApiKeys.js — Callable Cloud Function to save API keys to Firestore.
 *
 * Only admin users can call this. Keys are stored in `crm_config/api_keys`.
 * Existing keys are merged (partial updates allowed — only send the fields
 * the admin changed).
 */

import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { clearConfigCache } from '../lib/config.js';

/**
 * Fields that are allowed to be saved. Prevents arbitrary writes.
 */
const ALLOWED_FIELDS = new Set([
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_USERNAME',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_MODEL',
  'QWEN_API_KEY',
  'QWEN_ASR_MODEL',
  'QWEN_TTS_MODEL',
  'ANTHROPIC_API_KEY',
  'META_APP_SECRET',
  'META_VERIFY_TOKEN',
  'META_PAGE_ACCESS_TOKEN',
  'YOUTUBE_API_KEY',
  'YOUTUBE_CHANNEL_ID',
  'TIKTOK_PIXEL_ID',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'BREVO_SENDER_NAME',
]);

/**
 * Sanitize: strip empty strings (don't overwrite existing key with blank).
 * Also skip masked values (••••••••) — user didn't change the key.
 */
function sanitize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (!ALLOWED_FIELDS.has(k)) continue;
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    if (trimmed.length > 0 && !trimmed.startsWith('••••••••')) {
      out[k] = trimmed;
    }
  }
  return out;
}

export const saveApiKeys = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    const email = request.auth?.token?.email;
    if (email !== 'victorchavezd@gmail.com') {
      throw new HttpsError('permission-denied', 'Solo administradores pueden guardar API keys.');
    }
  }

  const data = request.data;
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Datos inválidos.');
  }

  const sanitized = sanitize(data);
  if (Object.keys(sanitized).length === 0) {
    throw new HttpsError('invalid-argument', 'No hay campos válidos para guardar.');
  }

  const db = getFirestore();
  const docRef = db.collection('crm_config').doc('api_keys');

  await docRef.set(sanitized, { merge: true });

  // Invalidate cache so next read gets fresh data
  clearConfigCache();

  return { ok: true, saved: Object.keys(sanitized) };
});
