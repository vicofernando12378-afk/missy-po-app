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

// crm
export { recomputeLeadScores } from './crm/recomputeScores.js';
export { recomputeSegments } from './crm/recomputeSegments.js';
export { unsubscribeLead } from './crm/unsubscribeLead.js';
export { saveApiKeys } from './crm/saveApiKeys.js';
export { getApiKeysStatus } from './crm/getApiKeysStatus.js';

// campaigns
export { sendCampaign } from './campaigns/sendCampaign.js';
export { emailWebhook } from './campaigns/emailWebhook.js';

// social
export { socialWebhookHandler } from './social/metaWebhook.js';
export { youtubePoll } from './social/youtubePoll.js';

// telegram
export { telegramWebhook } from './telegram/webhook.js';
