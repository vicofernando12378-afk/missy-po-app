/**
 * config.js — Centralized API key management for Cloud Functions.
 *
 * Reads from Firestore `crm_config/api_keys` first, falls back to
 * process.env (Firebase Functions config) for backward compatibility.
 *
 * Cache TTL: 5 minutes to avoid hammering Firestore on hot paths.
 */

import { getFirestore } from 'firebase-admin/firestore';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = null;
let cacheExpiry = 0;

const ENV_DEFAULTS = {
  TELEGRAM_BOT_TOKEN: '',
  DEEPSEEK_API_KEY: '',
  DEEPSEEK_MODEL: 'deepseek-chat',
  QWEN_API_KEY: '',
  QWEN_ASR_MODEL: 'qwen3-asr-flash-filetrans',
  QWEN_TTS_MODEL: 'qwen3-tts-flash',
  ANTHROPIC_API_KEY: '',
  META_APP_SECRET: '',
  META_VERIFY_TOKEN: '',
  META_PAGE_ACCESS_TOKEN: '',
  YOUTUBE_API_KEY: '',
  YOUTUBE_CHANNEL_ID: '',
  TIKTOK_PIXEL_ID: '',
  BREVO_API_KEY: '',
  BREVO_SENDER_EMAIL: '',
  BREVO_SENDER_NAME: '',
};

/**
 * Returns all API keys. Firestore values take precedence over process.env.
 * @returns {Promise<Record<string, string>>}
 */
export async function getApiKeys() {
  const now = Date.now();
  if (cache && now < cacheExpiry) return cache;

  try {
    const db = getFirestore();
    const snap = await db.collection('crm_config').doc('api_keys').get();

    // Always start with process.env values (backward compatible)
    cache = {};
    for (const key of Object.keys(ENV_DEFAULTS)) {
      cache[key] = process.env[key] || ENV_DEFAULTS[key];
    }

    // If Firestore doc exists, overlay those values on top (they take precedence)
    if (snap.exists) {
      const firestoreKeys = snap.data() || {};
      Object.assign(cache, firestoreKeys);
    }
  } catch (err) {
    console.error('[config] Firestore read failed, falling back to process.env:', err.message);
    cache = {};
    for (const key of Object.keys(ENV_DEFAULTS)) {
      cache[key] = process.env[key] || ENV_DEFAULTS[key];
    }
  }

  cacheExpiry = now + CACHE_TTL_MS;
  return cache;
}

/**
 * Returns masked values for display in the admin UI.
 * Never returns raw keys to the client.
 * @returns {Promise<Record<string, string>>}
 */
export async function getMaskedKeys() {
  const keys = await getApiKeys();
  const masked = {};
  for (const [k, v] of Object.entries(keys)) {
    masked[k] = v ? '••••••••' + v.slice(-4) : '';
  }
  return masked;
}

/**
 * Clears the in-memory cache so the next getApiKeys() call reads fresh from Firestore.
 */
export function clearConfigCache() {
  cache = null;
  cacheExpiry = 0;
}
