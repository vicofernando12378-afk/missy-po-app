import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import { getApiKeys } from '../lib/config.js';
import '../lib/firebaseAdmin.js';

export const telegramWebhook = onRequest({
  cors: true,
  minInstances: 1,
  memory: '512MiB',
  timeoutSeconds: 60,
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const keys = await getApiKeys();
  const token = req.query.token;
  const expectedToken = keys.TELEGRAM_BOT_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    console.warn('❌ Unauthorized webhook request or token mismatch.');
    res.status(403).send('Unauthorized');
    return;
  }

  const update = req.body;

  // ── DIAGNOSTIC: log what Telegram is actually sending ──
  console.log('📨 [webhook] update_id:', update?.update_id, '| keys:', Object.keys(update || {}));
  console.log('📨 [webhook] has message:', !!update?.message, '| has callback_query:', !!update?.callback_query);

  if (!update || (!update.message && !update.callback_query)) {
    console.log('⚠️ [webhook] SKIP — no message/callback_query. Full keys:', Object.keys(update || {}));
    res.status(200).send('OK');
    return;
  }

  // Respond with 200 OK immediately — Telegram requires <3s
  res.status(200).send('ok');

  // Lazy load heavy processor only after responding
  try {
    const { processTelegramMessage } = await import('./processMessage.js');
    const message = update.message;
    const callbackQuery = update.callback_query;

    // ── Handle callback queries (inline keyboard buttons) ──
    if (callbackQuery) {
      const chatId = callbackQuery.message?.chat?.id;
      const data = callbackQuery.data;
      const fromUser = callbackQuery.from || {};

      if (chatId && data) {
        const axios = (await import('axios')).default;
        const token = keys.TELEGRAM_BOT_TOKEN;

        // Answer the callback query to remove loading spinner
        await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          callback_query_id: callbackQuery.id,
        });

        if (data === 'menu:productos') {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: 'Aquí tienes nuestro catálogo. ¿Qué tipo de mascota tienes?',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🐕 Perro', callback_data: 'cat:perro' }, { text: '🐈 Gato', callback_data: 'cat:gato' }],
                [{ text: '🐹 Exóticos', callback_data: 'cat:exoticos' }, { text: '🐟 Peces', callback_data: 'cat:peces' }],
                [{ text: '🏠 Todos los productos', callback_data: 'cat:todos' }],
                [{ text: '◀️ Volver', callback_data: 'menu:main' }],
              ],
            },
          });
        } else if (data === 'menu:pedidos') {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: 'Para consultar tu pedido, necesito tu número de pedido o el email con el que lo hiciste.',
          });
        } else if (data === 'menu:asesor') {
          await processTelegramMessage({
            chatId,
            text: 'Necesito hablar con un asesor',
            voiceFileId: null,
            fromUser: {
              id: fromUser.id,
              username: fromUser.username || null,
              firstName: fromUser.first_name || '',
              lastName: fromUser.last_name || '',
            },
          });
        } else if (data === 'menu:main') {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: '¿En qué te puedo ayudar?',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🛒 Ver Productos', callback_data: 'menu:productos' }],
                [{ text: '📦 Mis Pedidos', callback_data: 'menu:pedidos' }],
                [{ text: '💬 Hablar con Asesor', callback_data: 'menu:asesor' }],
              ],
            },
          });
        } else if (data.startsWith('cat:')) {
          const category = data.replace('cat:', '');
          await processTelegramMessage({
            chatId,
            text: `Quiero ver productos de ${category}`,
            voiceFileId: null,
            fromUser: {
              id: fromUser.id,
              username: fromUser.username || null,
              firstName: fromUser.first_name || '',
              lastName: fromUser.last_name || '',
            },
          });
        } else if (data.startsWith('confirmar_pedido:')) {
          const pedidoId = data.replace('confirmar_pedido:', '');
          const db = getFirestore();
          const pedidoRef = db.collection('myp_pedidos').doc(pedidoId);
          const pedidoSnap = await pedidoRef.get();

          if (pedidoSnap.exists) {
            await pedidoRef.update({
              estado: 'recibido',
              confirmado: true,
              confirmadoEn: Timestamp.fromDate(new Date()),
            });

            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: `✅ Pedido confirmado! Tu número de pedido es: ${pedidoId}. Te contactaremos pronto para coordinar la entrega.`,
            });

            // Notify admin
            await db.collection('crm_notifications').add({
              type: 'order_confirmed',
              channel: 'telegram',
              pedidoId,
              chatId,
              read: false,
              createdAt: Timestamp.fromDate(new Date()),
            });
          }
        } else if (data.startsWith('cancelar_pedido:')) {
          const pedidoId = data.replace('cancelar_pedido:', '');
          const db = getFirestore();
          await db.collection('myp_pedidos').doc(pedidoId).update({
            estado: 'cancelado',
          });

          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: 'Pedido cancelado. Si cambias de opinión, aquí estoy 🐾',
          });
        }

        return;
      }
    }

    // ── Handle regular messages ──
    if (message) {
      const chatId = message.chat?.id;
      const text = message.text;
      const voice = message.voice;
      const fromUser = message.from || {};

      if (!chatId) return;

      // ── /reset command: reset conversation to bot mode ──
      const command = (text || '').trim().toLowerCase();
      if (command === '/reset' || command === '/start') {
        const conversationId = `telegram_${chatId}`;
        const db = getFirestore();
        const convRef = db.collection('crm_conversations').doc(conversationId);
        await convRef.set(
          {
            externalId: String(chatId),
            channel: 'telegram',
            status: 'bot',
            updatedAt: Timestamp.fromDate(new Date()),
          },
          { merge: true },
        );

        const msg = command === '/start'
          ? 'Hola! Soy Missy, tu asesora de mascotas de Missy & Po Pet Shop. En que puedo ayudarte hoy?'
          : 'Listo! He reiniciado nuestra conversacion. En que puedo ayudarte?';

        const axios = (await import('axios')).default;
        await axios.post(`https://api.telegram.org/bot${keys.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: msg,
          disable_web_page_preview: true,
        });
        return;
      }

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
