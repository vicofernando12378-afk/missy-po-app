import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const sendCampaign = onCall({ cors: true }, async (request) => {
  // Check auth: only authenticated admins can send campaigns
  if (!request.auth || !request.auth.token.admin) {
    // If not marked admin in custom claims, also check the specific admin email
    const email = request.auth?.token?.email;
    if (email !== 'victorchavezd@gmail.com') {
      throw new HttpsError('unauthenticated', 'Only administrators can dispatch campaigns.');
    }
  }

  const { campaignId } = request.data;
  if (!campaignId) {
    throw new HttpsError('invalid-argument', 'campaignId parameter is required.');
  }

  const db = getFirestore();

  try {
    // 1. Get Campaign
    const campaignRef = db.collection('crm_campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      throw new HttpsError('not-found', `Campaign ${campaignId} not found.`);
    }

    const campaign = campaignSnap.data();
    if (campaign.status === 'enviando' || campaign.status === 'enviada') {
      throw new HttpsError('failed-precondition', 'This campaign has already been dispatched.');
    }

    // 2. Get Segment
    if (!campaign.segmentId) {
      throw new HttpsError('failed-precondition', 'Campaign must have a segmentId assigned.');
    }

    const segmentSnap = await db.collection('crm_segments').doc(campaign.segmentId).get();
    if (!segmentSnap.exists) {
      throw new HttpsError('not-found', `Segment ${campaign.segmentId} not found.`);
    }

    const segment = segmentSnap.data();
    const leadIds = segment.leadIds || [];

    if (leadIds.length === 0) {
      // Mark campaign sent but with 0 count
      await campaignRef.update({
        status: 'enviada',
        'stats.sent': 0,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true, sentCount: 0, message: 'Segment has 0 leads.' };
    }

    // 3. Update status to 'enviando'
    await campaignRef.update({
      status: 'enviando',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 4. Fetch leads and check email consent
    const leadsSnap = await db.collection('crm_leads')
      .where('__name__', 'in', leadIds.slice(0, 30)) // Firebase IN limit is 30, chunk it if needed
      .get();

    // Since chunking might exceed 30, we'll perform a query or parallel fetches if leadIds is larger.
    // Let's implement a robust chunked fetch
    const chunkArray = (arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const leadIdChunks = chunkArray(leadIds, 30);
    const leadDocs = [];

    for (const chunk of leadIdChunks) {
      const chunkSnap = await db.collection('crm_leads')
        .where('__name__', 'in', chunk)
        .get();
      leadDocs.push(...chunkSnap.docs);
    }

    // Filter leads with valid email and consent
    const targetLeads = leadDocs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(lead => lead.email && lead.consent?.email !== false);

    if (targetLeads.length === 0) {
      await campaignRef.update({
        status: 'enviada',
        'stats.sent': 0,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true, sentCount: 0, message: 'No target leads with email consent found.' };
    }

    // 5. Create myp_correos documents for Trigger Email
    const batch = db.batch();
    const now = new Date();

    targetLeads.forEach((lead) => {
      const unsubLink = `https://us-central1-missy-po.cloudfunctions.net/missy-po-crm-unsubscribeLead?email=${encodeURIComponent(lead.email)}`;
      const campaignHtml = `
        ${campaign.templateHtml}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5; font-family: sans-serif;">
          Este correo fue enviado por Missy & Po Pet Shop. <br />
          Si no deseas recibir más correos de campañas, puedes 
          <a href="${unsubLink}" style="color: #f43f5e; text-decoration: underline;">darte de baja aquí</a> en cualquier momento.
        </p>
      `;

      const mailRef = db.collection('myp_correos').doc();
      batch.set(mailRef, {
        to: lead.email,
        message: {
          subject: campaign.subject,
          html: campaignHtml,
        },
        campaignId,
        leadId: lead.id,
        creado_en: now,
      });

      // Also record interaction for the lead
      const interactionRef = db.collection('crm_interactions').doc();
      batch.set(interactionRef, {
        leadId: lead.id,
        channel: 'email',
        type: 'message',
        direction: 'outbound',
        content: `Campaña enviada: "${campaign.name}"`,
        mediaUrl: null,
        aiHandled: false,
        createdAt: now,
      });
    });

    await batch.commit();

    // 6. Mark campaign sent
    await campaignRef.update({
      status: 'enviada',
      'stats.sent': targetLeads.length,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, sentCount: targetLeads.length };
  } catch (err) {
    console.error('Error dispatching campaign:', err);
    throw new HttpsError('internal', `Failed to send campaign: ${err.message}`);
  }
});
