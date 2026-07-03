/**
 * crmSegments.js — Service layer for crm_segments collection and DSL rule evaluator
 *
 * Data model:
 * crm_segments/{segmentId} = {
 *   name: string,
 *   description: string,
 *   rules: [{ field: string, operator: string, value: any }],  // AND logic in v1
 *   leadIds: string[],        // materialized lead ids
 *   leadCount: number,
 *   lastComputedAt: Timestamp,
 * }
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from './firebase';

const COL = 'crm_segments';

// ── EVALUATE RULE (DSL ENGINE) ───────────────────────────────────────────────
/**
 * Evaluates a single DSL rule against a lead object.
 * @param {object} lead
 * @param {object} rule - { field, operator, value }
 * @returns {boolean}
 */
export function evaluateRule(lead, rule) {
  if (!lead || !rule) return false;

  const { field, operator, value } = rule;
  const leadValue = lead[field];

  // For date/time comparisons
  // If field is a Date or Timestamp (like createdAt), and value is a date string or timestamp
  let normalizedLeadVal = leadValue;
  let normalizedRuleVal = value;

  if (field === 'createdAt' || field === 'updatedAt' || field === 'lastInteractionAt') {
    const toMs = (val) => {
      if (!val) return 0;
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      return new Date(val).getTime();
    };
    normalizedLeadVal = toMs(leadValue);
    normalizedRuleVal = toMs(value);
  }

  // Handle number comparisons
  if (typeof normalizedLeadVal === 'number' && typeof normalizedRuleVal !== 'number') {
    const parsed = Number(normalizedRuleVal);
    if (!isNaN(parsed)) {
      normalizedRuleVal = parsed;
    }
  }

  switch (operator) {
    case '==':
      if (typeof normalizedLeadVal === 'string' && typeof normalizedRuleVal === 'string') {
        return normalizedLeadVal.toLowerCase().trim() === normalizedRuleVal.toLowerCase().trim();
      }
      return normalizedLeadVal == normalizedRuleVal;

    case '!=':
      if (typeof normalizedLeadVal === 'string' && typeof normalizedRuleVal === 'string') {
        return normalizedLeadVal.toLowerCase().trim() !== normalizedRuleVal.toLowerCase().trim();
      }
      return normalizedLeadVal != normalizedRuleVal;

    case '>':
      return normalizedLeadVal > normalizedRuleVal;

    case '>=':
      return normalizedLeadVal >= normalizedRuleVal;

    case '<':
      return normalizedLeadVal < normalizedRuleVal;

    case '<=':
      return normalizedLeadVal <= normalizedRuleVal;

    case 'array-contains':
      if (!Array.isArray(leadValue)) return false;
      if (typeof value === 'string') {
        return leadValue.some(item =>
          String(item).toLowerCase().trim() === value.toLowerCase().trim(),
        );
      }
      return leadValue.includes(value);

    default:
      return false;
  }
}

// ── EVALUATE SEGMENT ─────────────────────────────────────────────────────────
/**
 * Evaluates all rules of a segment against a lead (AND logic).
 * @param {object} lead
 * @param {object[]} rules
 * @returns {boolean}
 */
export function evaluateSegment(lead, rules) {
  if (!lead || !Array.isArray(rules) || rules.length === 0) return false;
  return rules.every(rule => evaluateRule(lead, rule));
}

// ── CREATE SEGMENT ───────────────────────────────────────────────────────────
/**
 * Saves a new segment to Firestore.
 * @param {object} data - { name, description, rules }
 * @returns {Promise<string>} segmentId
 */
export async function createSegment(data) {
  if (!data.name?.trim()) throw new Error('Segment name is required');
  if (!Array.isArray(data.rules) || data.rules.length === 0) {
    throw new Error('Segment rules are required');
  }

  const payload = {
    name: data.name.trim(),
    description: data.description?.trim() || '',
    rules: data.rules,
    leadIds: data.leadIds || [],
    leadCount: data.leadIds?.length || 0,
    lastComputedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

// ── GET SEGMENT BY ID ─────────────────────────────────────────────────────────
/**
 * Retrieves a segment by id.
 * @param {string} segmentId
 * @returns {Promise<object|null>}
 */
export async function getSegmentById(segmentId) {
  const snap = await getDoc(doc(db, COL, segmentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── LIST SEGMENTS ────────────────────────────────────────────────────────────
/**
 * Returns segments list ordered by name.
 * @returns {Promise<object[]>}
 */
export async function listSegments() {
  const q = query(collection(db, COL), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── DELETE SEGMENT ────────────────────────────────────────────────────────────
/**
 * Deletes a segment.
 * @param {string} segmentId
 * @returns {Promise<void>}
 */
export async function deleteSegment(segmentId) {
  await deleteDoc(doc(db, COL, segmentId));
}

// ── UPDATE SEGMENT ────────────────────────────────────────────────────────────
/**
 * Updates a segment's rules, name, or description.
 * @param {string} segmentId
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateSegment(segmentId, data) {
  const safe = {};
  if ('name' in data) safe.name = data.name.trim();
  if ('description' in data) safe.description = data.description.trim();
  if ('rules' in data) {
    if (!Array.isArray(data.rules) || data.rules.length === 0) {
      throw new Error('Rules cannot be empty');
    }
    safe.rules = data.rules;
  }

  if (Object.keys(safe).length === 0) return;

  await updateDoc(doc(db, COL, segmentId), safe);
}
