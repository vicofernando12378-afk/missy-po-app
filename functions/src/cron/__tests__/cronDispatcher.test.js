import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../followUpProcessor.js', () => ({
  runFollowUpProcessor: vi.fn().mockResolvedValue({ processed: true }),
}));

vi.mock('../generateProductCatalog.js', () => ({
  runCatalogGeneration: vi.fn().mockResolvedValue({ productCount: 42 }),
}));

vi.mock('../../crm/recomputeScores.js', () => ({
  runRecomputeLeadScores: vi.fn().mockResolvedValue({ implemented: false }),
}));

vi.mock('../../crm/recomputeSegments.js', () => ({
  runRecomputeSegments: vi.fn().mockResolvedValue({ recomputed: 3 }),
}));

vi.mock('../../social/youtubePoll.js', () => ({
  runYoutubePoll: vi.fn().mockResolvedValue({ skipped: true }),
}));

import { runRecomputeLeadScores } from '../../crm/recomputeScores.js';
import { runRecomputeSegments } from '../../crm/recomputeSegments.js';
import { runYoutubePoll } from '../../social/youtubePoll.js';
import { executeScheduledTasks } from '../cronDispatcher.js';
import { runFollowUpProcessor } from '../followUpProcessor.js';
import { runCatalogGeneration } from '../generateProductCatalog.js';

describe('cronDispatcher — executeScheduledTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs hourly tasks at any hour', async () => {
    // 14:00 Lima time
    const testDate = new Date('2026-09-02T19:00:00Z'); // UTC 19:00 = 14:00 Lima (UTC-5)
    const result = await executeScheduledTasks(testDate);

    expect(result.hour).toBe(14);
    expect(runFollowUpProcessor).toHaveBeenCalledTimes(1);
    expect(runYoutubePoll).toHaveBeenCalledTimes(1);
    expect(runRecomputeLeadScores).not.toHaveBeenCalled();
    expect(runRecomputeSegments).not.toHaveBeenCalled();
    expect(runCatalogGeneration).not.toHaveBeenCalled();
  });

  it('triggers lead scores recomputation at 01:00 AM Lima', async () => {
    // 01:00 Lima = 06:00 UTC
    const testDate = new Date('2026-09-02T06:00:00Z');
    const result = await executeScheduledTasks(testDate);

    expect(result.hour).toBe(1);
    expect(runFollowUpProcessor).toHaveBeenCalledTimes(1);
    expect(runRecomputeLeadScores).toHaveBeenCalledTimes(1);
    expect(runRecomputeSegments).not.toHaveBeenCalled();
  });

  it('triggers segment recomputation at 03:00 AM Lima', async () => {
    // 03:00 Lima = 08:00 UTC
    const testDate = new Date('2026-09-02T08:00:00Z');
    const result = await executeScheduledTasks(testDate);

    expect(result.hour).toBe(3);
    expect(runFollowUpProcessor).toHaveBeenCalledTimes(1);
    expect(runRecomputeSegments).toHaveBeenCalledTimes(1);
    expect(runRecomputeLeadScores).not.toHaveBeenCalled();
  });

  it('triggers catalog generation on day 1 at 04:00 AM Lima', async () => {
    // 04:00 Lima on 2026-09-01 = 09:00 UTC on 2026-09-01
    const testDate = new Date('2026-09-01T09:00:00Z');
    const result = await executeScheduledTasks(testDate);

    expect(result.hour).toBe(4);
    expect(result.day).toBe(1);
    expect(runCatalogGeneration).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger catalog generation on day 2 at 04:00 AM Lima', async () => {
    // 04:00 Lima on 2026-09-02 = 09:00 UTC on 2026-09-02
    const testDate = new Date('2026-09-02T09:00:00Z');
    const result = await executeScheduledTasks(testDate);

    expect(result.hour).toBe(4);
    expect(result.day).toBe(2);
    expect(runCatalogGeneration).not.toHaveBeenCalled();
  });
});
