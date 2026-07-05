import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import '../lib/firebaseAdmin.js';

// ── FOLLOW-UP PROCESSOR ─────────────────────────────────────────────────────
// Checks for abandoned conversations and sends follow-up messages.
// Runs every 5 minutes.
//
// Step 1 (T+10min): "Hey! ¿Sigues ahí?"
// Step 2 (T+2h): Mark as en_seguimiento + create task + notify admin

async function sendTelegramMessage(chatId, text) {
  const keys = (await import('../lib/config.js')).getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const axios = (await import('axios')).default;
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error('Error sending follow-up message:', err.response?.data || err.message);
  }
}

async function notifyAdmin({ chatId, leadName, conversationId }) {
  const keys = (await import('../lib/config.js')).getApiKeys();
  const token = keys.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
  if (!token || !adminChatId) return;

  try {
    const axios = (await import('axios')).default;
    const adminMsg = [
      '🔔 *Lead sin respuesta*',
      `*Cliente:* ${leadName || 'Desconocido'}`,
      '*Razón:* No respondió en 2 horas',
      '',
      'Responde en el panel de CRM para atenderlo.',
    ].join('\n');

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: adminChatId,
      text: adminMsg,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('Error notifying admin:', err.message);
  }
}

export const followUpProcessor = onSchedule({
  schedule: '*/5 * * * *',
  timeZone: 'America/Lima',
  memory: '256MiB',
}, async () => {
  const db = getFirestore();
  const now = Date.now();

  console.log('⏰ [followUp] Running follow-up processor...');

  // ── STEP 1: Follow-up at T+10min ────────────────────────────────────────
  // Find conversations where last message was 10-15 min ago (window to avoid duplicates)
  const cutoff10min = new Date(now - 10 * 60 * 1000);
  const cutoff15min = new Date(now - 15 * 60 * 1000);

  const convs10min = await db.collection('crm_conversations')
    .where('status', '==', 'bot')
    .where('lastMessageAt', '<', Timestamp.fromDate(cutoff10min))
    .where('lastMessageAt', '>', Timestamp.fromDate(cutoff15min))
    .get();

  for (const conv of convs10min.docs) {
    const data = conv.data();
    if (!data.leadId || !data.externalId) continue;

    // Check if we already sent a follow-up recently (last 30 min)
    const recentFollowUp = await db.collection('crm_interactions')
      .where('leadId', '==', data.leadId)
      .where('direction', '==', 'outbound')
      .where('metadata.type', '==', 'follow_up')
      .where('createdAt', '>', Timestamp.fromDate(new Date(now - 30 * 60 * 1000)))
      .count().get();

    if (recentFollowUp.data().count > 0) continue;

    // Check if last inbound was from the user (not the bot)
    const lastInbound = await db.collection('crm_interactions')
      .where('leadId', '==', data.leadId)
      .where('direction', '==', 'inbound')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (lastInbound.empty) continue;

    const lastInboundData = lastInbound.docs[0].data();
    const lastInboundTime = lastInboundData.createdAt?.toDate()?.getTime() || 0;

    // Only follow up if the last message was from the user (>10min ago)
    if (now - lastInboundTime < 10 * 60 * 1000) continue;

    // Send follow-up
    const leadSnap = await db.collection('crm_leads').doc(data.leadId).get();
    const lead = leadSnap.data();
    const firstName = lead?.name?.split(' ')[0] || 'Hey';

    await sendTelegramMessage(data.externalId,
      `${firstName}! ¿Sigues ahí? 🐾 En qué te puedo ayudar?`);

    // Register interaction
    await db.collection('crm_interactions').add({
      leadId: data.leadId,
      channel: 'telegram',
      type: 'message',
      direction: 'outbound',
      content: 'Follow-up automático: ¿Sigues ahí?',
      aiHandled: false,
      metadata: { type: 'follow_up', step: 1 },
      createdAt: Timestamp.fromDate(new Date()),
    });

    console.log(`📤 [followUp] Step 1 sent to ${data.externalId} (lead: ${data.leadId})`);
  }

  // ── STEP 2: Mark as en_seguimiento at T+2h ──────────────────────────────
  const cutoff2h = new Date(now - 2 * 60 * 60 * 1000);
  const cutoff2h15m = new Date(now - 2 * 60 * 60 * 1000 - 15 * 60 * 1000);

  const convs2h = await db.collection('crm_conversations')
    .where('status', '==', 'bot')
    .where('lastMessageAt', '<', Timestamp.fromDate(cutoff2h))
    .where('lastMessageAt', '>', Timestamp.fromDate(cutoff2h15m))
    .get();

  for (const conv of convs2h.docs) {
    const data = conv.data();
    if (!data.leadId || !data.externalId) continue;

    // Check if we already processed this for step 2
    const hasStep2 = await db.collection('crm_interactions')
      .where('leadId', '==', data.leadId)
      .where('metadata.type', '==', 'follow_up')
      .where('metadata.step', '==', 2)
      .count().get();

    if (hasStep2.data().count > 0) continue;

    // Mark lead as en_seguimiento
    await db.collection('crm_leads').doc(data.leadId).update({
      stage: 'en_seguimiento',
      tags: FieldValue.arrayUnion('follow-up-pending'),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Create task for human advisor
    await db.collection('crm_tasks').add({
      leadId: data.leadId,
      title: 'Seguimiento: cliente no respondió en 2 horas',
      status: 'pendiente',
      assignedTo: null,
      metadata: {
        type: 'follow_up',
        conversationId: conv.id,
        channel: 'telegram',
      },
      createdAt: Timestamp.fromDate(new Date()),
    });

    // Notify admin
    const leadSnap = await db.collection('crm_leads').doc(data.leadId).get();
    const lead = leadSnap.data();

    await notifyAdmin({
      chatId: data.externalId,
      leadName: lead?.name || 'Desconocido',
      conversationId: conv.id,
    });

    // Register interaction
    await db.collection('crm_interactions').add({
      leadId: data.leadId,
      channel: 'telegram',
      type: 'message',
      direction: 'outbound',
      content: 'Lead marcado como en seguimiento — sin respuesta en 2h',
      aiHandled: false,
      metadata: { type: 'follow_up', step: 2 },
      createdAt: Timestamp.fromDate(new Date()),
    });

    console.log(`📋 [followUp] Step 2: Lead ${data.leadId} marked as en_seguimiento`);
  }

  console.log('⏰ [followUp] Processor complete.');
});
