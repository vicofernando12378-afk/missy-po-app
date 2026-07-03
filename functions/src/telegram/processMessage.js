import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { runAgentCycle } from '../agent/core.js';
import { getApiKeys } from '../lib/config.js';

// ── ALIBABA QWEN ASR (Voz a Texto) ───────────────────────────────────────────

/**
 * Transcribes audio from a URL using Qwen3 ASR (DashScope API).
 * Falls back gracefully if API is not configured.
 */
async function transcribeAudio(fileUrl) {
  const keys = await getApiKeys();
  const apiKey = keys.QWEN_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ QWEN_API_KEY not configured — cannot transcribe audio.');
    return null;
  }

  const model = keys.QWEN_ASR_MODEL || 'qwen3-asr-flash-filetrans';

  try {
    // Download audio file from Telegram
    const audioResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const audioBase64 = Buffer.from(audioResponse.data).toString('base64');

    // Call Qwen3 ASR API (file transcription mode)
    const apiResponse = await axios.post(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/audio/asr/transcription',
      {
        model,
        input: {
          file_url: `data:audio/ogg;base64,${audioBase64}`,
        },
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

    console.warn('⚠️ [ASR] Empty transcription result.');
    return null;
  } catch (err) {
    console.error('❌ [ASR] Transcription failed:', err.response?.data || err.message);
    return null;
  }
}

// ── ALIBABA QWEN TTS (Texto a Voz) ───────────────────────────────────────────

/**
 * Generates speech audio from text using Qwen3 TTS (DashScope API).
 * Returns an audio buffer or null on failure.
 */
async function textToSpeech(text) {
  const keys = await getApiKeys();
  const apiKey = keys.QWEN_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ QWEN_API_KEY not configured — cannot generate speech.');
    return null;
  }

  const model = keys.QWEN_TTS_MODEL || 'qwen3-tts-flash';

  // Limit text length for TTS (max ~2000 chars for cost control)
  const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

  try {
    const apiResponse = await axios.post(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        model,
        input: {
          text: truncatedText,
        },
        parameters: {
          text_type: 'PlainText',
        },
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

    // Parse SSE response to extract audio data
    const responseText = Buffer.from(apiResponse.data).toString('utf-8');
    const audioMatch = responseText.match(/"audio":\s*\{[^}]*"url":\s*"([^"]+)"/);
    if (audioMatch) {
      const audioUrl = audioMatch[1];
      const audioDownload = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      console.log(`🔊 [TTS] Generated audio for ${truncatedText.length} chars`);
      return Buffer.from(audioDownload.data);
    }

    // Fallback: try to extract base64 audio from response
    const base64Match = responseText.match(/"data":\s*"([A-Za-z0-9+/=]+)"/);
    if (base64Match) {
      const audioBuffer = Buffer.from(base64Match[1], 'base64');
      console.log(`🔊 [TTS] Generated audio (base64) for ${truncatedText.length} chars`);
      return audioBuffer;
    }

    console.warn('⚠️ [TTS] No audio data in response.');
    return null;
  } catch (err) {
    console.error('❌ [TTS] Speech generation failed:', err.response?.data || err.message);
    return null;
  }
}

// ── TELEGRAM API HELPERS ──────────────────────────────────────────────────────

async function sendTelegramMessage(chatId, text) {
  const keys = await getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
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
        messageContent = await transcribeAudio(fileUrl);
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
      const voiceBuffer = await textToSpeech(replyText);
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
