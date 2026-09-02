import { getFirestore, Timestamp } from 'firebase-admin/firestore';

/**
 * Helper to evaluate a single DSL rule against a lead object.
 * Identical logic to the frontend implementation for parity.
 */
function evaluateRule(lead, rule) {
  if (!lead || !rule) return false;

  const { field, operator, value } = rule;
  const leadValue = lead[field];

  let normalizedLeadVal = leadValue;
  let normalizedRuleVal = value;

  // Handle Timestamps / dates
  if (field === 'createdAt' || field === 'updatedAt' || field === 'lastInteractionAt') {
    const toMs = (val) => {
      if (!val) return 0;
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      if (val instanceof Timestamp) return val.toDate().getTime();
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

/**
 * Helper to evaluate a segment's full AND ruleset.
 */
function evaluateSegment(lead, rules) {
  if (!lead || !Array.isArray(rules) || rules.length === 0) return false;
  return rules.every(rule => evaluateRule(lead, rule));
}

export async function runRecomputeSegments() {
  const db = getFirestore();
  console.log('🏁 Starting nightly segment recomputation...');

  try {
    // 1. Fetch all segments
    const segmentsSnap = await db.collection('crm_segments').get();
    if (segmentsSnap.empty) {
      console.log('ℹ️ No segments found in crm_segments. Exiting.');
      return { recomputed: 0 };
    }

    // 2. Fetch all active/valid leads (to avoid querying per segment rule, fetch all in memory)
    // Scale safety: 10,000 leads in memory takes ~2MB. Quite safe for typical pet shop CRM.
    const leadsSnap = await db.collection('crm_leads').get();
    const leads = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`ℹ️ Loaded ${leads.length} leads for evaluation.`);

    const now = new Date();
    const batch = db.batch();

    // 3. Evaluate each segment
    let count = 0;
    segmentsSnap.docs.forEach((segDoc) => {
      const seg = segDoc.data();
      const rules = seg.rules || [];

      if (rules.length === 0) {
        console.log(`  ⏭️ Skipping segment "${seg.name}" — no rules defined.`);
        return;
      }

      // Filter matching leads
      const matchingLeadIds = leads
        .filter(lead => evaluateSegment(lead, rules))
        .map(lead => lead.id);

      // Add updates to batch
      batch.update(segDoc.ref, {
        leadIds: matchingLeadIds,
        leadCount: matchingLeadIds.length,
        lastComputedAt: now,
      });

      count++;
      console.log(`  📊 Segment "${seg.name}" -> ${matchingLeadIds.length} matched leads.`);
    });

    await batch.commit();
    console.log('✅ Nightly segment recomputation completed successfully!');
    return { recomputed: count };
  } catch (err) {
    console.error('❌ Error during segment recomputation:', err);
    throw err;
  }
}
