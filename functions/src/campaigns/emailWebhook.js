import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

export const emailWebhook = onRequest({ cors: true }, async (req, res) => {
  // Brevo sends webhook notifications as POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const payload = req.body;
  const eventType = payload.event; // 'opened', 'click', 'unsubscribed', etc.
  const email = payload.email;

  if (!email) {
    res.status(400).send('Missing email parameter in payload');
    return;
  }

  const db = getFirestore();
  const emailLower = email.trim().toLowerCase();

  try {
    // 1. Find the lead matching the email
    const leadsSnap = await db.collection('crm_leads')
      .where('email', '==', emailLower)
      .limit(1)
      .get();

    if (leadsSnap.empty) {
      console.log(`ℹ️ Webhook: No lead found for email ${emailLower}`);
      res.status(200).send('No matching lead found');
      return;
    }

    const leadDoc = leadsSnap.docs[0];
    const leadId = leadDoc.id;
    const lead = leadDoc.data();

    const now = new Date();
    const batch = db.batch();

    let scoreDelta = 0;
    let interactionType = 'message';
    let content = `Evento de email recibido: ${eventType}`;

    // 2. Handle specific Brevo events
    if (eventType === 'opened') {
      scoreDelta = 5; // SCORE_EVENTS.email_open
      interactionType = 'email_open';
      content = 'Abrió el correo de la campaña';
    } else if (eventType === 'click') {
      scoreDelta = 15; // SCORE_EVENTS.product_link_click
      interactionType = 'message'; // clicks are recorded as message interaction
      content = `Hizo clic en un enlace del correo: ${payload.url || ''}`;
    } else if (eventType === 'unsubscribed') {
      interactionType = 'message';
      content = 'Se dio de baja (Unsubscribed)';
      // Update consent
      batch.update(leadDoc.ref, {
        'consent.email': false,
        updatedAt: now,
      });
    }

    // 3. Register Interaction
    const interactionRef = db.collection('crm_interactions').doc();
    batch.set(interactionRef, {
      leadId,
      channel: 'email',
      type: interactionType,
      direction: 'inbound',
      content,
      mediaUrl: null,
      aiHandled: false,
      createdAt: now,
    });

    // 4. Update Lead Score & touch interaction timestamp
    if (scoreDelta > 0) {
      const currentScore = lead.score || 0;
      const newScore = Math.min(100, Math.max(0, currentScore + scoreDelta));
      batch.update(leadDoc.ref, {
        score: newScore,
        lastInteractionAt: now,
        updatedAt: now,
      });
    } else {
      batch.update(leadDoc.ref, {
        lastInteractionAt: now,
        updatedAt: now,
      });
    }

    // 5. Update Campaign stats if campaignId is present in tags/payload
    // Brevo lets you pass custom headers or tags. The extension inserts campaignId in the document.
    // If the webhook payload has a campaignId (often passed in X-Mailin-custom or tags), we update crm_campaigns stats.
    const campaignId = payload.campaignId || (payload.tags && payload.tags[0]);
    if (campaignId) {
      const campaignRef = db.collection('crm_campaigns').doc(campaignId);
      const statField = `stats.${eventType}`; // stats.opened, stats.clicked, etc.
      
      // Check if event type is one of the stats fields we track
      const validStats = ['delivered', 'opened', 'click', 'unsubscribed', 'bounce'];
      if (validStats.includes(eventType)) {
        const resolvedStatField = eventType === 'click' ? 'stats.clicked' : `stats.${eventType}`;
        batch.update(campaignRef, {
          [resolvedStatField]: FieldValue.increment(1),
        });
      }
    }

    await batch.commit();
    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing email webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});
