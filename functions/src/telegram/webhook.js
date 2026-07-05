import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
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
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: 'Voy a conectarte con un asesor humano. Un momento por favor...',
          });
          // Notify admin
          const db = getFirestore();
          await db.collection('crm_notifications').add({
            type: 'human_request',
            channel: 'telegram',
            chatId: String(chatId),
            userName: fromUser.first_name || '',
            read: false,
            createdAt: Timestamp.fromDate(new Date()),
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
          const db = getFirestore();
          let productsSnap;

          if (category === 'todos') {
            productsSnap = await db.collection('myp_productos')
              .where('activo', '==', true)
              .limit(10)
              .get();
          } else {
            productsSnap = await db.collection('myp_productos')
              .where('activo', '==', true)
              .where('categorias', 'array-contains', category)
              .limit(10)
              .get();
          }

          if (productsSnap.empty) {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: 'No encontré productos en esta categoría. ¿Te interesa algo en particular?',
              reply_markup: { inline_keyboard: [[{ text: '◀️ Volver', callback_data: 'menu:main' }]] },
            });
          } else {
            const lines = productsSnap.docs.map(d => {
              const p = d.data();
              const price = p.precio_oferta || p.precio_regular || p.precio || 0;
              const stock = (p.stock ?? 0) > 0 ? `Stock: ${p.stock}` : 'Sin stock';
              const slug = p.slug || d.id;
              return `• ${p.nombre} — S/ ${price} (${stock})\n  https://missypoweb.web.app/producto/${slug}`;
            });

            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: `Productos ${category === 'todos' ? '' : 'para ' + category + ' '}disponibles:\n\n${lines.join('\n\n')}\n\n¿Te interesa alguno? Escríbeme el nombre y te ayudo.`,
              disable_web_page_preview: true,
              reply_markup: { inline_keyboard: [[{ text: '◀️ Volver al menú', callback_data: 'menu:main' }]] },
            });
          }
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
        } else if (data.startsWith('checkout_dept:')) {
          const dept = data.replace('checkout_dept:', '');
          const db = getFirestore();
          const conversationId = `telegram_${chatId}`;
          const convRef = db.collection('crm_conversations').doc(conversationId);
          const convSnap = await convRef.get();

          if (convSnap.exists && convSnap.data().status === 'checkout') {
            const deptFinal = dept === 'otro' ? '' : dept;
            if (dept === 'otro') {
              await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: '¿En qué departamento estás? Escríbelo:',
              });
            } else {
              await convRef.update({
                'checkout.datos.departamento': deptFinal,
                'checkout.step': 'distrito',
                updatedAt: Timestamp.fromDate(new Date()),
              });
              await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: `Departamento: ${deptFinal}. ¿Distrito?`,
              });
            }
          }
        } else if (data.startsWith('checkout_pago:')) {
          const pago = data.replace('checkout_pago:', '');
          const db = getFirestore();
          const conversationId = `telegram_${chatId}`;
          const convRef = db.collection('crm_conversations').doc(conversationId);
          const convSnap = await convRef.get();

          if (convSnap.exists && convSnap.data().status === 'checkout') {
            const checkout = convSnap.data().checkout;
            const datos = checkout.datos || {};
            const items = checkout.productos || [];
            const total = items.reduce((sum, i) => sum + ((i.precio || 0) * 100 * (i.cantidad || 1)), 0);
            const isYape = pago === 'yape';

            await convRef.update({
              'checkout.datos.metodoPago': isYape ? 'Yape/Plin' : 'Contra Entrega',
              'checkout.step': 'confirmacion',
              updatedAt: Timestamp.fromDate(new Date()),
            });

            // Load Yape number from knowledge base if needed
            let yapeInstructions = '';
            if (isYape) {
              try {
                const bizSnap = await db.collection('crm_knowledge').doc('business_info').get();
                const biz = bizSnap.exists ? bizSnap.data() : {};
                const yapeNum = biz.whatsapp || biz.telefono || '';
                if (yapeNum) {
                  yapeInstructions = `\n\n📲 Para pagar por Yape/Plin:\nNúmero: ${yapeNum}\nMonto exacto: S/ ${(total / 100).toFixed(2)}\n📸 Después de confirmar, envía tu comprobante aquí.`;
                } else {
                  yapeInstructions = `\n\n📲 Después de confirmar, te enviamos el número de Yape/Plin para hacer el pago.`;
                }
              } catch (e) {
                console.warn('⚠️ Could not load biz info for Yape:', e.message);
              }
            }

            const resumen = items.map(i => `• ${i.nombre} x${i.cantidad || 1} — S/ ${((i.precio || 0) * (i.cantidad || 1)).toFixed(2)}`).join('\n');
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: `Resumen de tu pedido:\n\n${resumen}\n\nCliente: ${datos.clienteNombre || ''}\nTeléfono: ${datos.telefono || ''}\nDirección: ${datos.direccion || ''}, ${datos.distrito || ''}, ${datos.departamento || ''}\nPago: ${isYape ? 'Yape/Plin' : 'Contra Entrega'}\nTotal: S/ ${(total / 100).toFixed(2)}${yapeInstructions}\n\n¿Confirmas tu pedido?`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '✅ Confirmar Pedido', callback_data: 'checkout_confirm:si' }],
                  [{ text: '❌ Cancelar', callback_data: 'checkout_confirm:no' }],
                ],
              },
            });
          }
        } else if (data === 'checkout_confirm:si') {
          const db = getFirestore();
          const conversationId = `telegram_${chatId}`;
          const convRef = db.collection('crm_conversations').doc(conversationId);
          const convSnap = await convRef.get();

          if (convSnap.exists && convSnap.data().status === 'checkout') {
            const convData = convSnap.data();
            const checkout = convData.checkout;
            const datos = checkout.datos || {};
            const leadId = convData.leadId || null;
            const items = (checkout.productos || []).map(p => ({
              productoId: p.productoId || '',
              nombre: p.nombre,
              precio_unitario: Math.round((p.precio || 0) * 100),
              cantidad: p.cantidad || 1,
            }));
            const total = items.reduce((sum, i) => sum + (i.precio_unitario * i.cantidad), 0);
            const totalSoles = total / 100;
            const puntosGanados = Math.floor(totalSoles / 10) * 10;
            const pedidoId = `ped-${Date.now()}`;

            await db.collection('myp_pedidos').doc(pedidoId).set({
              pedidoId,
              estado: 'recibido',
              confirmado: false,
              canal: 'telegram',
              leadId,
              cliente: {
                nombre: datos.clienteNombre || '',
                celular: datos.telefono || '',
                email: datos.email || null,
                documento_tipo: 'DNI',
                documento_numero: datos.documentoNumero || null,
              },
              envio: {
                nombre: datos.clienteNombre || '',
                direccion: datos.direccion || '',
                telefono: datos.telefono || '',
                departamento: datos.departamento || '',
                distrito: datos.distrito || '',
              },
              items,
              pago: {
                metodo: datos.metodoPago || 'contra_entrega',
                estado: 'pendiente',
              },
              total_final: total,
              creado_en: Timestamp.fromDate(new Date()),
              notificadoAdmin: false,
            });

            // Update lead stage and tags
            if (leadId) {
              try {
                await db.collection('crm_leads').doc(leadId).update({
                  stage: 'calificado',
                  tags: FieldValue.arrayUnion('compra-interes'),
                  updatedAt: Timestamp.fromDate(new Date()),
                });
              } catch (e) {
                console.warn('⚠️ Error updating lead stage:', e.message);
              }
            }

            // Club membership with real points
            try {
              const emailNorm = (datos.email || '').trim().toLowerCase();
              const clubPayload = {
                nombre_tutor: datos.clienteNombre || '',
                nombre_mascota: datos.nombreMascota || '',
                celular: datos.telefono || '',
                direccion: datos.direccion || '',
                documento_tipo: 'DNI',
                documento_numero: datos.documentoNumero || '',
                departamento: datos.departamento || '',
                distrito: datos.distrito || '',
                benefit_origen: 'Registro Automático Telegram',
                puntos: puntosGanados,
                creado_en: Timestamp.fromDate(new Date()),
              };
              if (emailNorm) {
                clubPayload.email = emailNorm;
                const existSnap = await db.collection('myp_club_miembros')
                  .where('email', '==', emailNorm).limit(1).get();
                if (!existSnap.empty) {
                  // Existing member: add points
                  const memberRef = existSnap.docs[0].ref;
                  await memberRef.update({
                    puntos: FieldValue.increment(puntosGanados),
                    updatedAt: Timestamp.fromDate(new Date()),
                  });
                  if (puntosGanados > 0) {
                    await memberRef.collection('puntos_logs').add({
                      puntos: puntosGanados,
                      motivo: `Puntos por compra Telegram #${pedidoId}`,
                      creado_en: Timestamp.fromDate(new Date()),
                    });
                  }
                } else {
                  const newRef = await db.collection('myp_club_miembros').add(clubPayload);
                  if (puntosGanados > 0) {
                    await newRef.collection('puntos_logs').add({
                      puntos: puntosGanados,
                      motivo: `Puntos por primera compra Telegram #${pedidoId}`,
                      creado_en: Timestamp.fromDate(new Date()),
                    });
                  }
                }
              } else {
                // No email: create member without email (won't deduplicate, but captures data)
                await db.collection('myp_club_miembros').add(clubPayload);
              }
            } catch (e) {
              console.warn('⚠️ Club membership error:', e.message);
            }

            // Admin notification
            await db.collection('crm_notifications').add({
              type: 'new_order',
              channel: 'telegram',
              pedidoId,
              chatId: String(chatId),
              leadName: datos.clienteNombre || '',
              total: totalSoles,
              read: false,
              createdAt: Timestamp.fromDate(new Date()),
            });

            await convRef.update({ status: 'bot', checkout: null, updatedAt: Timestamp.fromDate(new Date()) });

            const resumenFinal = items.map(i => `• ${i.nombre} x${i.cantidad} — S/ ${(i.precio_unitario / 100).toFixed(2)}`).join('\n');
            const puntosMsg = puntosGanados > 0 ? `\n🌟 Ganaste ${puntosGanados} puntos Club Missy & Po!` : '';
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: `¡Pedido confirmado! 🎉 Tu número es: ${pedidoId}\n\nResumen:\n${resumenFinal}\n\nTotal: S/ ${totalSoles.toFixed(2)}${puntosMsg}\n\nTe contactaremos pronto para coordinar la entrega 🐾`,
            });
          }
        } else if (data === 'checkout_confirm:no') {
          const db = getFirestore();
          const conversationId = `telegram_${chatId}`;
          const convRef = db.collection('crm_conversations').doc(conversationId);
          await convRef.update({ status: 'bot', checkout: null, updatedAt: Timestamp.fromDate(new Date()) });
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: 'Pedido cancelado. Si necesitas algo más, aquí estoy 🐾',
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
            checkout: null,
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

      // ── CHECKOUT STATE MACHINE (pure code, no LLM) ──
      const conversationId = `telegram_${chatId}`;
      const db = getFirestore();
      const convRef = db.collection('crm_conversations').doc(conversationId);
      const convSnap = await convRef.get();

      if (convSnap.exists && convSnap.data().status === 'checkout' && convSnap.data().checkout) {
        const checkout = convSnap.data().checkout;
        const axios = (await import('axios')).default;
        const token = keys.TELEGRAM_BOT_TOKEN;

        // Cancel checkout
        if (command === '/cancelar') {
          await convRef.update({ status: 'bot', checkout: null, updatedAt: Timestamp.fromDate(new Date()) });
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: 'Pedido cancelado. Si necesitas algo más, aquí estoy 🐾',
          });
          return;
        }

        const datos = checkout.datos || {};
        const step = checkout.step;

        // Step: Ask for client name
        if (step === 'nombre') {
          if (text && !text.startsWith('/')) {
            const firstName = text.trim().split(' ')[0];
            await convRef.update({
              'checkout.datos.clienteNombre': text.trim(),
              'checkout.step': 'telefono',
              updatedAt: Timestamp.fromDate(new Date()),
            });
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: `Perfecto, ${firstName}! 😊 ¿Cuál es tu número de celular para coordinar la entrega?`,
            });
          }
          return;
        }

        // Step: Ask for phone number
        if (step === 'telefono') {
          if (text && !text.startsWith('/')) {
            await convRef.update({
              'checkout.datos.telefono': text.trim(),
              'checkout.step': 'dni',
              updatedAt: Timestamp.fromDate(new Date()),
            });
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: 'Tu número de DNI (opcional — escribe "omitir" si prefieres no darlo):',
            });
          }
          return;
        }

        // Step: Ask for DNI (optional)
        if (step === 'dni') {
          if (text && !text.startsWith('/')) {
            const dni = text.trim().toLowerCase() === 'omitir' ? '' : text.trim();
            await convRef.update({
              'checkout.datos.documentoNumero': dni,
              'checkout.step': 'direccion',
              updatedAt: Timestamp.fromDate(new Date()),
            });
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: '¿Cuál es tu dirección de entrega? (calle, número y referencia)',
            });
          }
          return;
        }

        // Step: Ask for address
        if (step === 'direccion') {
          if (text && !text.startsWith('/')) {
            await convRef.update({
              'checkout.datos.direccion': text,
              'checkout.step': 'departamento',
              updatedAt: Timestamp.fromDate(new Date()),
            });
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: '¿Departamento? Presiona el botón o escribe el nombre.',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📍 Arequipa', callback_data: 'checkout_dept:Arequipa' }],
                  [{ text: '📍 Lima', callback_data: 'checkout_dept:Lima' }],
                  [{ text: '📍 Cusco', callback_data: 'checkout_dept:Cusco' }],
                  [{ text: '📍 Otro', callback_data: 'checkout_dept:otro' }],
                ],
              },
            });
          }
          return;
        }

        // Step: Ask for district
        if (step === 'distrito') {
          if (text && !text.startsWith('/')) {
            await convRef.update({
              'checkout.datos.distrito': text,
              'checkout.step': 'pago',
              updatedAt: Timestamp.fromDate(new Date()),
            });
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
              chat_id: chatId,
              text: '¿Cómo deseas pagar?',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '💰 Contra Entrega', callback_data: 'checkout_pago:contra_entrega' }],
                  [{ text: '📱 Yape / Plin', callback_data: 'checkout_pago:yape' }],
                ],
              },
            });
          }
          return;
        }

        // Step: Confirmation
        if (step === 'confirmacion') {
          // Re-send the summary with buttons in case the original button is no longer visible
          const items = checkout.productos || [];
          const total = items.reduce((sum, i) => sum + ((i.precio || 0) * (i.cantidad || 1)), 0);
          const resumen = items.map(i => `• ${i.nombre} x${i.cantidad || 1} — S/ ${((i.precio || 0) * (i.cantidad || 1)).toFixed(2)}`).join('\n');
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `Tu pedido está listo para confirmar:\n\n${resumen}\n\nDirección: ${datos.direccion || ''}, ${datos.distrito || ''}, ${datos.departamento || ''}\nPago: ${datos.metodoPago || 'Contra Entrega'}\nTotal: S/ ${total.toFixed(2)}\n\n¿Confirmas?`,
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Confirmar Pedido', callback_data: 'checkout_confirm:si' }],
                [{ text: '❌ Cancelar', callback_data: 'checkout_confirm:no' }],
              ],
            },
          });
          return;
        }

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
