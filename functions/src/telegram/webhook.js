import { onRequest } from 'firebase-functions/v2/https';

import { processTelegramMessage } from './processMessage.js';

export const telegramWebhook = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const token = req.query.token;
  const expectedToken = process.env.TELEGRAM_BOT_TOKEN;

  // Simple token authentication to secure the webhook
  if (!expectedToken || token !== expectedToken) {
    console.warn('❌ Unauthorized webhook request or token mismatch.');
    res.status(403).send('Unauthorized');
    return;
  }

  const update = req.body;
  if (!update || (!update.message && !update.callback_query)) {
    res.status(200).send('OK');
    return;
  }

  // Respond with 200 OK immediately to satisfy Telegram's 3-second timeout rule
  res.status(200).send('ok');

  // Process event asynchronously after responding
  try {
    const message = update.message;
    if (message) {
      const chatId = message.chat?.id;
      const text = message.text;
      const voice = message.voice; // voice note attachment
      const fromUser = message.from || {};

      if (!chatId) return;

      await processTelegramMessage({
        chatId,
        text: text || null,
        voiceFileId: voice?.file_id || null,
        fromUser: {
          id: fromUser.id,
          username: fromUser.username || null,
          firstName: fromUser.first_name || '',
          lastName: fromUser.last_name || '',
        },
      });
    }
  } catch (err) {
    console.error('❌ Error processing Telegram webhook payload:', err);
  }
});
