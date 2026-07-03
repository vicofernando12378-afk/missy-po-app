/**
 * recomputeLeadScores — Scheduled daily at 01:00 America/Lima
 * Decays lead scores by 1 point per day for leads inactive for 14+ days.
 * Implemented fully in Phase 1.10.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';

// TODO: Antigravity — Phase 1.10: implement score decay logic
export const recomputeLeadScores = onSchedule(
  { schedule: '0 1 * * *', timeZone: 'America/Lima' },
  async (_event) => {
    console.log('[recomputeLeadScores] Phase 1.10 — not yet implemented');
  },
);
