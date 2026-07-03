/**
 * crmLeads.js — Service layer for crm_leads collection
 *
 * Data model:
 * crm_leads/{leadId} = {
 *   name: string,
 *   phone: string | null,
 *   email: string | null,
 *   petName: string | null,
 *   petAlias: string | null,
 *   source: "whatsapp"|"telegram"|"instagram"|"facebook"|"tiktok"|"youtube"|"web"|"manual"|"club",
 *   sourceDetail: { postId?, commentId?, campaignId?, ... },
 *   stage: "nuevo"|"contactado"|"calificado"|"en_seguimiento"|"cliente"|"perdido",
 *   score: number,       // 0–100
 *   tags: string[],
 *   segmentIds: string[],
 *   consent: { whatsapp: bool, email: bool, telegram: bool },
 *   assignedTo: uid | null,
 *   points: number,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   lastInteractionAt: Timestamp | null,
 * }
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';

const COL = 'crm_leads';

// ── VALID STAGES ─────────────────────────────────────────────────────────────
export const LEAD_STAGES = ['nuevo', 'contactado', 'calificado', 'en_seguimiento', 'cliente', 'perdido'];

// ── VALID SOURCES ─────────────────────────────────────────────────────────────
export const LEAD_SOURCES = ['whatsapp', 'telegram', 'instagram', 'facebook', 'tiktok', 'youtube', 'web', 'manual', 'club'];

// ── SCORE CONSTANTS ───────────────────────────────────────────────────────────
export const SCORE_EVENTS = {
  inbound_interaction: 10,
  email_open: 5,
  product_link_click: 15,
  purchase: 30,
};
export const SCORE_DECAY_DAYS_THRESHOLD = 14; // start decaying after 14d of inactivity
export const SCORE_DECAY_PER_DAY = 1;
export const SCORE_MAX = 100;
export const SCORE_MIN = 0;

// ── CREATE LEAD ───────────────────────────────────────────────────────────────
/**
 * Creates a new lead. Returns the created lead id.
 * @param {object} data - Partial lead fields (name + source required)
 * @returns {Promise<string>} leadId
 */
export async function createLead(data) {
  if (!data.name?.trim()) throw new Error('Lead name is required');
  if (!LEAD_SOURCES.includes(data.source)) throw new Error(`Invalid source: ${data.source}`);

  const now = serverTimestamp();
  const payload = {
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    petName: data.petName?.trim() || null,
    petAlias: data.petAlias?.trim() || null,
    source: data.source,
    sourceDetail: data.sourceDetail || {},
    stage: 'nuevo',
    score: 0,
    tags: data.tags || [],
    segmentIds: [],
    consent: {
      whatsapp: data.consent?.whatsapp ?? false,
      email: data.consent?.email ?? false,
      telegram: data.consent?.telegram ?? false,
    },
    assignedTo: data.assignedTo || null,
    points: 0,
    createdAt: now,
    updatedAt: now,
    lastInteractionAt: null,
  };

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

// ── GET LEAD BY ID ────────────────────────────────────────────────────────────
/**
 * Returns a lead by id or null if not found.
 * @param {string} leadId
 * @returns {Promise<object|null>}
 */
export async function getLeadById(leadId) {
  const snap = await getDoc(doc(db, COL, leadId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── LIST LEADS ────────────────────────────────────────────────────────────────
/**
 * Returns leads filtered by optional stage/source/tag, ordered by createdAt desc.
 * @param {object} filters - { stage?, source?, tag?, limit? }
 * @returns {Promise<object[]>}
 */
export async function listLeads({ stage = null, source = null, tag = null, max = 200 } = {}) {
  let q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(max));

  if (stage) {
    if (!LEAD_STAGES.includes(stage)) throw new Error(`Invalid stage: ${stage}`);
    q = query(collection(db, COL), where('stage', '==', stage), orderBy('createdAt', 'desc'), limit(max));
  } else if (source) {
    q = query(collection(db, COL), where('source', '==', source), orderBy('createdAt', 'desc'), limit(max));
  } else if (tag) {
    q = query(collection(db, COL), where('tags', 'array-contains', tag), orderBy('createdAt', 'desc'), limit(max));
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── UPDATE STAGE ──────────────────────────────────────────────────────────────
/**
 * Moves a lead to a new stage. Validates allowed transitions.
 * @param {string} leadId
 * @param {string} newStage
 * @returns {Promise<void>}
 */
export async function updateLeadStage(leadId, newStage) {
  if (!LEAD_STAGES.includes(newStage)) {
    throw new Error(`Invalid stage: ${newStage}. Must be one of: ${LEAD_STAGES.join(', ')}`);
  }
  await updateDoc(doc(db, COL, leadId), {
    stage: newStage,
    updatedAt: serverTimestamp(),
  });
}

// ── UPDATE LEAD ───────────────────────────────────────────────────────────────
/**
 * Partial update of editable lead fields (whitelist enforced).
 * @param {string} leadId
 * @param {object} fields
 * @returns {Promise<void>}
 */
export async function updateLead(leadId, fields) {
  const EDITABLE = ['name', 'phone', 'email', 'petName', 'petAlias', 'tags', 'consent', 'assignedTo', 'sourceDetail'];
  const safe = {};
  for (const key of EDITABLE) {
    if (key in fields) safe[key] = fields[key];
  }
  if (Object.keys(safe).length === 0) return;

  await updateDoc(doc(db, COL, leadId), { ...safe, updatedAt: serverTimestamp() });
}

// ── INCREMENT SCORE ───────────────────────────────────────────────────────────
/**
 * Adds delta to a lead's score, clamped to [SCORE_MIN, SCORE_MAX].
 * @param {string} leadId
 * @param {number} delta - Points to add (positive) or subtract (negative)
 * @returns {Promise<void>}
 */
export async function incrementLeadScore(leadId, delta) {
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const newScore = Math.min(SCORE_MAX, Math.max(SCORE_MIN, (lead.score || 0) + delta));
  await updateDoc(doc(db, COL, leadId), {
    score: newScore,
    updatedAt: serverTimestamp(),
  });
}

// ── RECORD INTERACTION TIMESTAMP ─────────────────────────────────────────────
/**
 * Updates lastInteractionAt to now. Call after recording any crm_interaction.
 * @param {string} leadId
 */
export async function touchLeadInteraction(leadId) {
  await updateDoc(doc(db, COL, leadId), {
    lastInteractionAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ── COMPUTE DECAY ────────────────────────────────────────────────────────────
/**
 * Pure function — computes how much to decay a score given last interaction date.
 * Used by Cloud Function recomputeLeadScores.
 * @param {number} currentScore
 * @param {Date|null} lastInteractionAt
 * @param {Date} now
 * @returns {number} new score after decay
 */
export function computeScoreDecay(currentScore, lastInteractionAt, now = new Date()) {
  if (!lastInteractionAt) return currentScore;

  const lastDate = (typeof lastInteractionAt?.toDate === 'function')
    ? lastInteractionAt.toDate()
    : new Date(lastInteractionAt);

  const daysSinceInteraction = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

  if (daysSinceInteraction <= SCORE_DECAY_DAYS_THRESHOLD) return currentScore;

  const decayDays = daysSinceInteraction - SCORE_DECAY_DAYS_THRESHOLD;
  const decayed = currentScore - decayDays * SCORE_DECAY_PER_DAY;
  return Math.max(SCORE_MIN, decayed);
}
