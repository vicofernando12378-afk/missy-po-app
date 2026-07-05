/**
 * sendHumanMessage.js — Send a message from admin to Telegram user.
 * Called when admin clicks "Enviar" in the CRM chat interface.
 */
import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import { getApiKeys } from '../lib/config.js';

async function sendTelegramMessage(chatId, text) {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

export const sendHumanMessage = onRequest({ cors: true, region: 'us-central1' }, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text?.trim()) {
      return res.status(400).json({ error: 'conversationId and text required' });
    }

    const db = getFirestore();

    // Get conversation
    const convSnap = await db.collection('crm_conversations').doc(conversationId).get();
    if (!convSnap.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const conversation = convSnap.data();
    const externalId = conversation.externalId; // Telegram chatId

    // Send via Telegram API
    await sendTelegramMessage(externalId, text.trim());

    // Save interaction
    await db.collection('crm_interactions').add({
      leadId: conversation.leadId || null,
      channel: 'telegram',
      type: 'message',
      direction: 'outbound',
      content: text.trim(),
      mediaUrl: null,
      metadata: { sentBy: 'human', conversationId },
      createdAt: Timestamp.fromDate(new Date()),
    });

    // Update conversation timestamp
    await convSnap.ref.update({
      lastMessageAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[sendHumanMessage] Error:', err);
    res.status(500).json({ error: err.message });
  }
});
