/**
 * cronDispatcher.js — Master scheduler entry point for Missy & Po CRM 360°.
 *
 * Consolidates all scheduled tasks into a single Cloud Scheduler job
 * to remain strictly within the GCP Free Tier (max 3 jobs per billing account).
 *
 * Execution frequency: Hourly (0 * * * *), America/Lima.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import '../lib/firebaseAdmin.js';

import { runRecomputeLeadScores } from '../crm/recomputeScores.js';
import { runRecomputeSegments } from '../crm/recomputeSegments.js';
import { runYoutubePoll } from '../social/youtubePoll.js';

import { runFollowUpProcessor } from './followUpProcessor.js';
import { runCatalogGeneration } from './generateProductCatalog.js';

/**
 * Evaluates current time in America/Lima and dispatches due tasks.
 *
 * @param {Date} [nowDate] - Optional date for deterministic testing.
 * @returns {Promise<Object>} Execution summary
 */
export async function executeScheduledTasks(nowDate = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    hour: 'numeric',
    day: 'numeric',
    hour12: false,
  }).formatToParts(nowDate);

  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const day = parseInt(parts.find(p => p.type === 'day')?.value ?? '1', 10);

  console.log(`⏱️ [cronDispatcher] Triggered at Lima time: Day ${day}, Hour ${hour}:00`);

  const results = {
    timestamp: nowDate.toISOString(),
    hour,
    day,
    tasks: {},
  };

  // 1. Hourly tasks: Follow-up processor
  try {
    console.log('▶️ [cronDispatcher] Running follow-up processor...');
    results.tasks.followUp = await runFollowUpProcessor();
  } catch (err) {
    console.error('❌ [cronDispatcher] Error in followUpProcessor:', err.message);
    results.tasks.followUp = { error: err.message };
  }

  // 2. Hourly tasks: YouTube comments poll (checks API key dynamically inside)
  try {
    console.log('▶️ [cronDispatcher] Running YouTube poll...');
    results.tasks.youtubePoll = await runYoutubePoll();
  } catch (err) {
    console.error('❌ [cronDispatcher] Error in youtubePoll:', err.message);
    results.tasks.youtubePoll = { error: err.message };
  }

  // 3. Daily task (01:00 AM Lima): Recompute & decay lead scores
  if (hour === 1) {
    try {
      console.log('▶️ [cronDispatcher] Running nightly lead score recomputation (01:00 AM)...');
      results.tasks.recomputeScores = await runRecomputeLeadScores();
    } catch (err) {
      console.error('❌ [cronDispatcher] Error in recomputeLeadScores:', err.message);
      results.tasks.recomputeScores = { error: err.message };
    }
  }

  // 4. Daily task (03:00 AM Lima): Recompute segments
  if (hour === 3) {
    try {
      console.log('▶️ [cronDispatcher] Running nightly segment recomputation (03:00 AM)...');
      results.tasks.recomputeSegments = await runRecomputeSegments();
    } catch (err) {
      console.error('❌ [cronDispatcher] Error in recomputeSegments:', err.message);
      results.tasks.recomputeSegments = { error: err.message };
    }
  }

  // 5. Multi-day task (04:00 AM Lima, days 1, 6, 11, 16, 21, 26): Generate product catalog
  const catalogDays = [1, 6, 11, 16, 21, 26];
  if (hour === 4 && catalogDays.includes(day)) {
    try {
      console.log(`▶️ [cronDispatcher] Running product catalog generation (04:00 AM, day ${day})...`);
      results.tasks.generateCatalog = await runCatalogGeneration();
    } catch (err) {
      console.error('❌ [cronDispatcher] Error in generateProductCatalog:', err.message);
      results.tasks.generateCatalog = { error: err.message };
    }
  }

  console.log('✅ [cronDispatcher] Completed dispatch cycle.');
  return results;
}

export const cronDispatcher = onSchedule({
  schedule: '0 * * * *', // every hour
  timeZone: 'America/Lima',
  memory: '256MiB',
  timeoutSeconds: 300,
  retryCount: 1,
}, async (_event) => {
  return await executeScheduledTasks();
});
