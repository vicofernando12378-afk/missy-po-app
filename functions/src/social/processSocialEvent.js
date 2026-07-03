import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { hasCommercialIntent } from './intentDictionary.js';

/**
 * Processes an incoming social media comment or message.
 * Creates a lead if it has commercial intent (or if it's a DM),
 * and records the interaction in crm_interactions.
 * 
 * @param {object} params
 * @param {string} params.platform - 'instagram' | 'facebook' | 'youtube'
 * @param {string} params.type - 'comment' | 'dm'
 * @param {string} params.externalUserId - ID or username of user on the platform
 * @param {string} params.userName - Display name on the platform
 * @param {string} params.content - Text content of message/comment
 * @param {string} params.externalPostId - Optional ID of post/video commented on
 * @returns {Promise<{ leadId: string | null, created: boolean }>}
 */
export async function processSocialEvent({
  platform,
  type,
  externalUserId,
  userName,
  content,
  externalPostId = null,
}) {
  const db = getFirestore();
  const now = new Date();

  // Rule: comments only create a lead if they show commercial intent. DMs always create a lead.
  const isDM = type === 'dm';
  const hasIntent = hasCommercialIntent(content);

  if (!isDM && !hasIntent) {
    console.log(`ℹ️ [processSocialEvent] Comment skipped (no commercial intent): "${content}"`);
    return { leadId: null, created: false };
  }

  try {
    // 1. Search for existing lead by platform + externalUserId
    // We store external social identifiers in a map or fields
    const leadsSnap = await db.collection('crm_leads')
      .where('source', '==', platform)
      .where('sourceDetail.externalUserId', '==', externalUserId)
      .limit(1)
      .get();

    let leadId = null;
    let leadCreated = false;
    let currentScore = 0;

    if (!leadsSnap.empty) {
      // Lead exists
      const leadDoc = leadsSnap.docs[0];
      leadId = leadDoc.id;
      currentScore = leadDoc.data().score || 0;
      console.log(`ℹ️ Found existing lead ${leadId} for ${platform} user ${externalUserId}`);
    } else {
      // Create new lead
      const leadRef = db.collection('crm_leads').doc();
      leadId = leadRef.id;
      leadCreated = true;
      currentScore = 0;

      const leadPayload = {
        name: userName || externalUserId || 'Usuario Redes',
        phone: null,
        email: null,
        petName: null,
        petAlias: null,
        source: platform,
        sourceDetail: {
          externalUserId,
          externalPostId,
        },
        stage: 'nuevo',
        score: 0,
        tags: [`${platform}-lead`, 'social-capture'],
        segmentIds: [],
        consent: {
          whatsapp: false,
          email: false,
          telegram: false,
        },
        assignedTo: null,
        points: 0,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        lastInteractionAt: null,
      };

      await leadRef.set(leadPayload);
      console.log(`✅ Created new lead ${leadId} for ${platform} user ${externalUserId}`);
    }

    // 2. Add inbound interaction log
    const interactionRef = db.collection('crm_interactions').doc();
    const interactionPayload = {
      leadId,
      channel: platform,
      type, // 'comment' | 'dm'
      direction: 'inbound',
      content,
      mediaUrl: null,
      aiHandled: false,
      createdAt: Timestamp.fromDate(now),
    };
    await interactionRef.set(interactionPayload);

    // 3. Update lead score (+10 for inbound interaction) & lastInteractionAt
    const newScore = Math.min(100, currentScore + 10);
    await db.collection('crm_leads').doc(leadId).update({
      score: newScore,
      lastInteractionAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    return { leadId, created: leadCreated };
  } catch (err) {
    console.error('Error in processSocialEvent:', err);
    throw err;
  }
}
