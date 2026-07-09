import axios from 'axios';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

import { runAgentCycle, buildSystemPrompt } from '../agent/core.js';
import { getApiKeys } from '../lib/config.js';
import { detectFrustration, notifyAdminEscalation } from '../lib/escalation.js';
import { getKnowledgeContext } from '../lib/knowledge.js';

// ── KEYWORD-BASED ESCALATION ────────────────────────────────────────────────

/**
 * Checks if message contains keywords that require immediate human escalation.
 * @param {string} message
 * @returns {boolean}
 */
function shouldEscalateByKeyword(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  const escalationKeywords = [
    'envío internacional', 'envio internacional', 'fuera del país',
    'fuera del peru', 'europa', 'estados unidos', 'enviar a',
    'pedido especial', 'mayorista', 'reclamo', 'queja',
    'factura con ruc', 'constancia', 'garantía extendida',
  ];
  return escalationKeywords.some(kw => lower.includes(kw));
}

// ── ALIBABA QWEN ASR (Voz a Texto) ───────────────────────────────────────────

async function transcribeAudio(fileUrl) {
  const keys = await getApiKeys();
  const apiKey = keys.QWEN_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ QWEN_API_KEY not configured — cannot transcribe audio.');
    return null;
  }

  const model = keys.QWEN_ASR_MODEL || 'qwen3-asr-flash-filetrans';

  try {
    const audioResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const audioBase64 = Buffer.from(audioResponse.data).toString('base64');

    const apiResponse = await axios.post(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/audio/asr/transcription',
      {
        model,
        input: { file_url: `data:audio/ogg;base64,${audioBase64}` },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const result = apiResponse.data?.output?.results?.[0]?.transcription;
    if (result) {
      console.log(`🎙️ [ASR] Transcribed: "${result.substring(0, 80)}..."`);
      return result;
    }
    return null;
  } catch (err) {
    console.error('❌ [ASR] Transcription failed:', err.response?.data || err.message);
    return null;
  }
}

// ── ALIBABA QWEN TTS (Texto a Voz) ───────────────────────────────────────────

async function textToSpeech(text) {
  const keys = await getApiKeys();
  const apiKey = keys.QWEN_API_KEY;
  if (!apiKey) return null;

  const model = keys.QWEN_TTS_MODEL || 'qwen3-tts-flash';
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

  try {
    const apiResponse = await axios.post(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        model,
        input: { text: truncatedText },
        parameters: { text_type: 'PlainText' },
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable',
        },
        timeout: 30000,
        responseType: 'arraybuffer',
      },
    );

    const responseText = Buffer.from(apiResponse.data).toString('utf-8');
    const audioMatch = responseText.match(/"audio":\s*\{[^}]*"url":\s*"([^"]+)"/);
    if (audioMatch) {
      const audioDownload = await axios.get(audioMatch[1], { responseType: 'arraybuffer' });
      return Buffer.from(audioDownload.data);
    }

    const base64Match = responseText.match(/"data":\s*"([A-Za-z0-9+/=]+)"/);
    if (base64Match) {
      return Buffer.from(base64Match[1], 'base64');
    }
    return null;
  } catch (err) {
    console.error('❌ [TTS] Failed:', err.response?.data || err.message);
    return null;
  }
}

// ── TELEGRAM API HELPERS ──────────────────────────────────────────────────────

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const payload = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload);
  } catch (err) {
    console.error('Error sending Telegram message:', err.response?.data || err.message);
  }
}

async function sendTelegramPhoto(chatId, photoUrl, caption = null) {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token || !photoUrl) return;
  try {
    const payload = {
      chat_id: chatId,
      photo: photoUrl,
    };
    if (caption) {
      payload.caption = caption.substring(0, 1024);
    }
    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, payload);
  } catch (err) {
    console.error('Error sending Telegram photo:', err.response?.data || err.message);
  }
}

async function sendChatAction(chatId, action = 'typing') {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendChatAction`, {
      chat_id: chatId,
      action,
    });
  } catch (err) {
    console.error('Error sending chat action:', err.response?.data || err.message);
  }
}

async function sendTelegramVoice(chatId, voiceBuffer) {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token || !voiceBuffer) return;
  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendVoice`,
      {
        chat_id: chatId,
        voice: {
          value: voiceBuffer,
          options: { filename: 'response.ogg', contentType: 'audio/ogg' },
        },
      },
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 },
    );
  } catch (err) {
    console.error('Error sending Telegram voice:', err.response?.data || err.message);
  }
}

async function getTelegramFileUrl(fileId) {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const filePath = res.data?.result?.file_path;
    if (!filePath) return null;
    return `https://api.telegram.org/file/bot${token}/${filePath}`;
  } catch (err) {
    console.error('Error getting Telegram file path:', err.message);
    return null;
  }
}

// ── MAIN TELEGRAM PROCESSOR ───────────────────────────────────────────────────

export async function processTelegramMessage({
  chatId,
  text,
  voiceFileId,
  fromUser,
}) {
  console.log('🤖 [processMessage] START — chatId:', chatId, '| text:', text?.substring(0, 60));
  const keys = await getApiKeys();
  const db = getFirestore();
  const now = new Date();
  const conversationId = `telegram_${chatId}`;

  // Show "typing..." indicator immediately
  sendChatAction(chatId, 'typing');

  try {
    // 1. Fetch or create conversation
    const convRef = db.collection('crm_conversations').doc(conversationId);
    const convSnap = await convRef.get();

    let conversation = { status: 'bot' };
    if (convSnap.exists) {
      conversation = convSnap.data();
    } else {
      await convRef.set({
        externalId: String(chatId),
        channel: 'telegram',
        status: 'bot',
        context: {},
        createdAt: Timestamp.fromDate(now),
        lastMessageAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }

    // 2. Fetch or create lead
    const leadsSnap = await db.collection('crm_leads')
      .where('source', '==', 'telegram')
      .where('sourceDetail.telegramChatId', '==', String(chatId))
      .limit(1)
      .get();

    let leadId = null;
    let lead = null;

    if (!leadsSnap.empty) {
      const leadDoc = leadsSnap.docs[0];
      leadId = leadDoc.id;
      lead = leadDoc.data();
      // Store leadId in conversation for CRM chat UI
      await convRef.update({ leadId, updatedAt: Timestamp.fromDate(now) });
    }

    // 2b. SKIP LLM IF IN CHECKOUT MODE — webhook.js handles checkout
    if (conversation.status === 'checkout') {
      return;
    }

    // 2c. Create lead only if one does not exist for this chatId
    if (leadsSnap.empty) {
      const leadRef = db.collection('crm_leads').doc();
      leadId = leadRef.id;
      lead = {
        name: `${fromUser.firstName} ${fromUser.lastName}`.trim() || fromUser.username || 'Usuario Telegram',
        phone: null,
        email: null,
        petName: null,
        source: 'telegram',
        sourceDetail: {
          telegramChatId: String(chatId),
          telegramUsername: fromUser.username,
        },
        stage: 'nuevo',
        score: 10,
        tags: ['telegram-lead', 'bot-capture'],
        segmentIds: [],
        consent: { whatsapp: false, email: false, telegram: true },
        assignedTo: null,
        points: 0,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        lastInteractionAt: Timestamp.fromDate(now),
      };
      await leadRef.set(lead);
      // Store leadId in conversation for CRM chat UI
      await convRef.update({ leadId, updatedAt: Timestamp.fromDate(now) });
    } else {
      // Update lastInteractionAt for existing lead
      await db.collection('crm_leads').doc(leadId).update({
        lastInteractionAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }

    // 3. Process voice to text
    let messageContent = text;
    if (voiceFileId) {
      const fileUrl = await getTelegramFileUrl(voiceFileId);
      if (fileUrl) {
        messageContent = await transcribeAudio(fileUrl);
      }
    }

    if (!messageContent) return;

    // 4. Register inbound interaction
    await db.collection('crm_interactions').add({
      leadId,
      channel: 'telegram',
      type: 'message',
      direction: 'inbound',
      content: messageContent,
      mediaUrl: null,
      aiHandled: true,
      createdAt: Timestamp.fromDate(now),
    });

    // 5. Rate limiting (max 20 messages/hour — inbound only)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const rateSnap = await db.collection('crm_interactions')
      .where('leadId', '==', leadId)
      .where('channel', '==', 'telegram')
      .where('direction', '==', 'inbound')
      .where('createdAt', '>=', Timestamp.fromDate(oneHourAgo))
      .get();

    if (rateSnap.size > 20) {
      await sendTelegramMessage(chatId, 'Has enviado demasiados mensajes. Por favor espera unos minutos.');
      return;
    }

    // 6. Handle human mode — recovery keywords + auto-reset after 24h
    if (conversation.status === 'esperando_humano' || conversation.status === 'humano') {
      const recoveryKeywords = ['bot', 'habla conmigo', 'ayuda de vuelta', 'ya no necesito humano', 'puedes responder'];
      const wantsBot = recoveryKeywords.some(kw => messageContent.toLowerCase().includes(kw));

      if (wantsBot) {
        await convRef.update({
          status: 'bot',
          lastMessageAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
        await sendTelegramMessage(chatId, 'Listo! He vuelto. En qué te puedo ayudar?');
        return;
      }

      // Auto-reset after 24h of inactivity
      const lastMsg = conversation.lastMessageAt?.toDate() || new Date(0);
      const hoursSince = (Date.now() - lastMsg.getTime()) / (1000 * 60 * 60);
      if (hoursSince >= 24) {
        await convRef.update({
          status: 'bot',
          lastMessageAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        });
        await sendTelegramMessage(chatId, 'He vuelto! Parece que necesitabas atención personalizada. En qué te puedo ayudar?');
        return;
      }

      return;
    }

    // 7. Load bot config
    const configSnap = await db.collection('crm_bot_config').doc('telegram').get();
    const botConfig = configSnap.exists ? configSnap.data() : {};

    // 8. Frustration check only — bot works 24/7, no business hours block
    const frustration = detectFrustration(messageContent);
    const keywordEscalation = shouldEscalateByKeyword(messageContent);

    if (frustration.isFrustrated || keywordEscalation) {
      // Escalate to human on frustration or keyword match
      await convRef.update({
        status: 'esperando_humano',
        lastMessageAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      await db.collection('crm_leads').doc(leadId).update({
        tags: FieldValue.arrayUnion('esperando-soporte'),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      const reason = frustration.isFrustrated ? frustration.reason : 'keyword match';
      await notifyAdminEscalation({
        chatId,
        leadName: lead?.name || fromUser.firstName,
        reason,
        lastMessage: messageContent,
        conversationId,
      });

      const responseMsg = 'Veo que necesitas atención personalizada. Voy a transferirte con un agente humano que te ayudará mejor. Un momento por favor.';
      await sendTelegramMessage(chatId, responseMsg);

      await db.collection('crm_interactions').add({
        leadId,
        channel: 'telegram',
        type: 'message',
        direction: 'outbound',
        content: responseMsg,
        mediaUrl: null,
        aiHandled: true,
        createdAt: Timestamp.fromDate(new Date()),
      });
      return;
    }

    // 9. Load knowledge context
    const knowledgeContext = await getKnowledgeContext(messageContent);

    // 10. Build enhanced system prompt
    const systemPrompt = buildSystemPrompt({ botConfig, knowledgeContext });

    // 11. Fetch last 10 messages for chat history
    const histSnap = await db.collection('crm_interactions')
      .where('leadId', '==', leadId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const chatHistory = histSnap.docs
      .map(d => {
        const item = d.data();
        return {
          role: item.direction === 'inbound' ? 'user' : 'assistant',
          content: item.content,
        };
      })
      .reverse();

    // 12. Run AI cycle
    sendChatAction(chatId, 'typing');
    const { replyText, escalated, pedidoId } = await runAgentCycle({
      systemPrompt,
      messages: chatHistory,
      leadId,
      conversationId,
      chatId,
      platform: 'telegram',
    });

    // 13. TTS if enabled
    const voiceEnabled = botConfig.voiceEnabled || false;
    let voiceSent = false;
    if (voiceEnabled && replyText) {
      const voiceBuffer = await textToSpeech(replyText);
      if (voiceBuffer) {
        await sendTelegramVoice(chatId, voiceBuffer);
        voiceSent = true;
      }
    }

    // 14. Send text response
    if (!voiceSent && replyText) {
      let replyMarkup = null;

      // If checkout was activated, the webhook.js handles the flow — no button here
      if (pedidoId && pedidoId !== 'checkout_activated') {
        replyMarkup = {
          inline_keyboard: [
            [{ text: '✅ Confirmar Pedido', callback_data: `confirmar_pedido:${pedidoId}` }],
            [{ text: '❌ Cancelar', callback_data: `cancelar_pedido:${pedidoId}` }],
          ],
        };
      }
      // NO welcome keyboard here — it's handled by webhook.js menu handlers

      await sendTelegramMessage(chatId, replyText, replyMarkup);
    }

    // 14b. If checkout was activated, immediately trigger the first checkout question
    if (pedidoId === 'checkout_activated') {
      try {
        const convSnap = await db.collection('crm_conversations').doc(conversationId).get();
        if (convSnap.exists && convSnap.data().checkout) {
          const { sendCheckoutPrompt } = await import('./checkoutHelper.js');
          await sendCheckoutPrompt(chatId, convSnap.data().checkout, keys.TELEGRAM_BOT_TOKEN);
        }
      } catch (chkErr) {
        console.error('❌ Error sending initial checkout prompt:', chkErr);
      }
    }

    // 15. Register outbound interaction
    await db.collection('crm_interactions').add({
      leadId,
      channel: 'telegram',
      type: 'message',
      direction: 'outbound',
      content: replyText || 'Disculpa las molestias, no pude procesar tu consulta.',
      mediaUrl: null,
      aiHandled: true,
      createdAt: Timestamp.fromDate(new Date()),
    });

    // 16. Update conversation timestamp
    await convRef.update({
      lastMessageAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (err) {
    console.error('❌ Error processing message:', err);
  }
}
