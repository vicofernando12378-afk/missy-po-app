/**
 * Cloud Functions entry point — Missy & Po CRM 360°
 *
 * Exports are organized by domain:
 *   crm/       — Lead scoring, segment recomputation
 *   campaigns/ — Email campaign dispatch + webhook
 *   social/    — Meta (IG/FB) + YouTube lead capture
 *   telegram/  — Telegram AI bot webhook + worker
 *   agent/     — LLM routing core (provider-agnostic)
 */
import './lib/firebaseAdmin.js';
import { setGlobalOptions } from 'firebase-functions/v2';

// Global options: enforce zero warm instances to prevent idle billing
setGlobalOptions({
  minInstances: 0,
  maxInstances: 10,
  region: 'us-central1',
});

// crm
export { unsubscribeLead } from './crm/unsubscribeLead.js';
export { saveApiKeys } from './crm/saveApiKeys.js';
export { getApiKeysStatus } from './crm/getApiKeysStatus.js';
export { saveKnowledge } from './crm/saveKnowledge.js';
export { getKnowledge } from './crm/getKnowledge.js';
export { sendHumanMessage } from './crm/sendHumanMessage.js';
export { refreshProductCatalog } from './crm/refreshProductCatalog.js';

// campaigns
export { sendCampaign } from './campaigns/sendCampaign.js';
export { emailWebhook } from './campaigns/emailWebhook.js';

// social
export { socialWebhookHandler } from './social/metaWebhook.js';

// telegram — lazy load to reduce cold start (heavy dependency chain)
export { telegramWebhook } from './telegram/webhook.js';

// cron dispatcher (single scheduled Cloud Scheduler job to stay within Free Tier)
export { cronDispatcher } from './cron/cronDispatcher.js';
