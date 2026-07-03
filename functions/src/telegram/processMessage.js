import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { runAgentCycle } from '../agent/core.js';

// ── MOCKS/STUBS FOR ALIBABA QWEN ASR & TTS (TO BE CONFIGURED AT THE END BY USER) ──

/**
 * Stub for Alibaba Qwen ASR (Voz a Texto).
 * Updates automatically when API is configured.
 */
async function transcribeAudioStub(fileUrl) {
  console.log(`🎙️ [ASR Stub] Simulating transcription for file: ${fileUrl}`);
  // In simulation, we return a mock text showing voice detection
  return 'Quiero saber el precio del alimento premium para perros y si tienen delivery.';
}

/**
 * Stub for Alibaba Qwen TTS (Texto a Voz).
 * Returns a mock voice buffer or URL.
 */
async function textToSpeechStub(text) {
  console.log(`🔊 [TTS Stub] Simulating voice generation for: "${text}"`);
  // Returns null in simulation to fallback to text response
  return null;
}

// ── TELEGRAM API HELPERS ──────────────────────────────────────────────────────

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  } catch (err) {
    console.error('Error sending Telegram message:', err.response?.data || err.message);
  }
}

async function sendTelegramVoice(chatId, voiceBuffer) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !voiceBuffer) return;
  // Fallback to text if buffer is not fully simulated
  console.log(`🔊 [sendTelegramVoice] Would send voice note to chat ${chatId}`);
}

async function getTelegramFileUrl(fileId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
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

/**
 * Processes an incoming Telegram message or voice note.
 */
export async function processTelegramMessage({
  chatId,
  text,
  voiceFileId,
  fromUser,
}) {
  const db = getFirestore();
  const now = new Date();
  const conversationId = `telegram_${chatId}`;

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
    } else {
      // Create new lead from Telegram
      const leadRef = db.collection('crm_leads').doc();
      leadId = leadRef.id;
      lead = {
        name: `${fromUser.firstName} ${fromUser.lastName}`.trim() || fromUser.username || 'Usuario Telegram',
        phone: null,
        email: null,
        petName: null,
        petAlias: null,
        source: 'telegram',
        sourceDetail: {
          telegramChatId: String(chatId),
          telegramUsername: fromUser.username,
        },
        stage: 'nuevo',
        score: 10, // initial interaction score
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
      console.log(`✅ Registered new lead ${leadId} from Telegram chat ${chatId}`);
    }

    // 3. Process voice to text (ASR) if voiceFileId is provided
    let messageContent = text;
    if (voiceFileId) {
      const fileUrl = await getTelegramFileUrl(voiceFileId);
      if (fileUrl) {
        messageContent = await transcribeAudioStub(fileUrl);
      }
    }

    if (!messageContent) {
      console.log('ℹ️ Telegram message payload has no text or voice content. Skipped.');
      return;
    }

    // 4. Register inbound interaction
    await db.collection('crm_interactions').add({
      leadId,
      channel: 'telegram',
      type: voiceFileId ? 'message' : 'message',
      direction: 'inbound',
      content: messageContent,
      mediaUrl: null,
      aiHandled: true,
      createdAt: Timestamp.fromDate(now),
    });

    // 5. Rate limiting check (max 20 messages in the last hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const interactionsCountSnap = await db.collection('crm_interactions')
      .where('leadId', '==', leadId)
      .where('channel', '==', 'telegram')
      .where('createdAt', '>=', Timestamp.fromDate(oneHourAgo))
      .get();

    if (interactionsCountSnap.size > 20) {
      console.warn(`⚠️ Rate limit exceeded for lead ${leadId} on Telegram.`);
      await sendTelegramMessage(chatId, 'Has enviado demasiados mensajes en poco tiempo. Por favor espera unos minutos para continuar chateando.');
      return;
    }

    // 6. If conversation status is human-only, do not respond with AI (just log interaction)
    if (conversation.status === 'esperando_humano' || conversation.status === 'humano') {
      console.log(`ℹ️ Conversation ${conversationId} is in human mode. AI response skipped.`);
      return;
    }

    // 7. Load prompt configuration and dynamic personality
    const configSnap = await db.collection('crm_bot_config').doc('telegram').get();
    let systemPrompt = 'Eres un asistente de Missy & Po Pet Shop. Ayuda a los tutores a buscar productos y consultar sus pedidos.';
    let voiceEnabled = false;

    if (configSnap.exists) {
      const botConfig = configSnap.data();
      if (botConfig.systemPrompt) systemPrompt = botConfig.systemPrompt;
      if (botConfig.voiceEnabled) voiceEnabled = botConfig.voiceEnabled;
    }

    // 8. Fetch last 10 messages for short memory context
    const histSnap = await db.collection('crm_interactions')
      .where('leadId', '==', leadId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    // Map to OpenAI completion format
    const chatHistory = histSnap.docs
      .map(d => {
        const item = d.data();
        return {
          role: item.direction === 'inbound' ? 'user' : 'assistant',
          content: item.content,
        };
      })
      .reverse();

    // 9. Run AI cycle
    const { replyText, escalated } = await runAgentCycle({
      systemPrompt,
      messages: chatHistory,
      leadId,
      conversationId,
      platform: 'telegram',
    });

    // 10. Generate audio response (TTS) if voiceEnabled is active
    let voiceSent = false;
    if (voiceEnabled && replyText) {
      const voiceBuffer = await textToSpeechStub(replyText);
      if (voiceBuffer) {
        await sendTelegramVoice(chatId, voiceBuffer);
        voiceSent = true;
      }
    }

    // Default to text response if voice was not generated or disabled
    if (!voiceSent && replyText) {
      await sendTelegramMessage(chatId, replyText);
    }

    // 11. Register outbound interaction
    await db.collection('crm_interactions').add({
      leadId,
      channel: 'telegram',
      type: voiceSent ? 'message' : 'message',
      direction: 'outbound',
      content: replyText || 'Disculpa las molestias, no pude procesar la consulta.',
      mediaUrl: null,
      aiHandled: true,
      createdAt: Timestamp.fromDate(new Date()),
    });

    // Update conversation timestamp
    await convRef.update({
      lastMessageAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (err) {
    console.error('❌ Error processing message flow:', err);
  }
}
