/**
 * crmInteractions.js — Service layer for crm_interactions collection
 *
 * Data model:
 * crm_interactions/{interactionId} = {
 *   leadId: string,
 *   channel: string,
 *   type: "comment"|"dm"|"message"|"call"|"email_open"|"purchase",
 *   direction: "inbound"|"outbound",
 *   content: string,
 *   mediaUrl: string | null,
 *   aiHandled: boolean,
 *   createdAt: Timestamp,
 * }
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

import { touchLeadInteraction, incrementLeadScore, SCORE_EVENTS } from './crmLeads';
import { db } from './firebase';

const COL = 'crm_interactions';

export const INTERACTION_TYPES = ['comment', 'dm', 'message', 'call', 'email_open', 'purchase'];
export const INTERACTION_DIRECTIONS = ['inbound', 'outbound'];

// ── RECORD INTERACTION ────────────────────────────────────────────────────────
/**
 * Records a new interaction for a lead and auto-updates the lead's score + lastInteractionAt.
 * @param {object} data
 * @returns {Promise<string>} interactionId
 */
export async function recordInteraction(data) {
  if (!data.leadId) throw new Error('leadId is required');
  if (!INTERACTION_TYPES.includes(data.type)) throw new Error(`Invalid type: ${data.type}`);
  if (!INTERACTION_DIRECTIONS.includes(data.direction)) throw new Error(`Invalid direction: ${data.direction}`);

  const payload = {
    leadId: data.leadId,
    channel: data.channel || 'manual',
    type: data.type,
    direction: data.direction,
    content: data.content || '',
    mediaUrl: data.mediaUrl || null,
    aiHandled: data.aiHandled ?? false,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COL), payload);

  // Auto-score: only inbound interactions score points
  if (data.direction === 'inbound') {
    const scoreDelta = SCORE_EVENTS[data.type] ?? SCORE_EVENTS.inbound_interaction;
    await incrementLeadScore(data.leadId, scoreDelta);
  }

  // Always update lastInteractionAt
  await touchLeadInteraction(data.leadId);

  return ref.id;
}

// ── GET INTERACTIONS FOR LEAD ─────────────────────────────────────────────────
/**
 * Returns interactions for a lead, ordered by createdAt desc.
 * @param {string} leadId
 * @param {number} max
 * @returns {Promise<object[]>}
 */
export async function getInteractionsByLead(leadId, max = 50) {
  const q = query(
    collection(db, COL),
    where('leadId', '==', leadId),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
