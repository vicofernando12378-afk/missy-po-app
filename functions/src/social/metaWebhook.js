import crypto from 'crypto';

import { onRequest } from 'firebase-functions/v2/https';

import { getApiKeys } from '../lib/config.js';

import { processSocialEvent } from './processSocialEvent.js';

// Helper to verify X-Hub-Signature-256 from Meta
async function verifyMetaSignature(req, rawBody) {
  const keys = await getApiKeys();
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = keys.META_APP_SECRET;

  if (!appSecret) {
    console.warn('⚠️ META_APP_SECRET is not configured. Signature verification skipped.');
    return true; // Skip verification if secret is not set yet
  }

  if (!signature) return false;

  const elements = signature.split('=');
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  return signatureHash === expectedHash;
}

export const socialWebhookHandler = onRequest({ cors: true }, async (req, res) => {
  // 1. Meta Webhook Verification (GET Request)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const keys = await getApiKeys();
    const expectedToken = keys.META_VERIFY_TOKEN;

    if (mode && token) {
      if (mode === 'subscribe' && token === expectedToken) {
        console.log('✅ Meta Webhook Verified Successfully!');
        res.status(200).send(challenge);
      } else {
        console.warn('❌ Meta Verification Token Mismatch.');
        res.status(403).send('Forbidden');
      }
    } else {
      res.status(400).send('Bad Request');
    }
    return;
  }

  // 2. Event Notification Receiver (POST Request)
  if (req.method === 'POST') {
    // Validate Signature
    const rawBody = req.rawBody; // Express raw body
    if (rawBody && !await verifyMetaSignature(req, rawBody)) {
      console.warn('❌ Invalid Meta Webhook Signature.');
      res.status(403).send('Invalid signature');
      return;
    }

    const payload = req.body;

    // Meta Webhooks require a rapid 200 response to prevent retries
    res.status(200).send('EVENT_RECEIVED');

    // Process asynchronously after sending 200 response
    try {
      if (payload.object === 'instagram' || payload.object === 'page') {
        const platform = payload.object === 'instagram' ? 'instagram' : 'facebook';

        for (const entry of payload.entry || []) {
          // A. Handle Comments (Changes feed)
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'comments') {
                const commentVal = change.value;
                if (!commentVal) continue;

                // Skip outbound replies from our own page/account
                if (commentVal.from?.id === entry.id) continue;

                await processSocialEvent({
                  platform,
                  type: 'comment',
                  externalUserId: commentVal.from?.id || commentVal.from?.username || 'unknown',
                  userName: commentVal.from?.username || 'Usuario Redes',
                  content: commentVal.text || '',
                  externalPostId: commentVal.media?.id || entry.id || null,
                });
              }
            }
          }

          // B. Handle DMs / Messages
          if (entry.messaging) {
            for (const msgEvent of entry.messaging) {
              // Skip echo messages (outbound replies sent by the page/admin)
              if (msgEvent.message?.is_echo) continue;
              if (msgEvent.sender?.id === entry.id) continue;

              const text = msgEvent.message?.text;
              if (text) {
                await processSocialEvent({
                  platform,
                  type: 'dm',
                  externalUserId: msgEvent.sender?.id,
                  userName: null, // Meta DM payload doesn't include display name by default (requires Profile API call)
                  content: text,
                  externalPostId: null,
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Error processing Meta event payload:', err);
    }
  }
});
