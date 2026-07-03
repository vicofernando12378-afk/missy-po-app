import { addDoc, getDoc, updateDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase/firestore before importing service
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'lead-123' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: class {
    constructor(seconds) { this.seconds = seconds; }
    toDate() { return new Date(this.seconds * 1000); }
  },
}));

vi.mock('../firebase', () => ({ db: {} }));

import {
  computeScoreDecay,
  SCORE_DECAY_DAYS_THRESHOLD,
  SCORE_DECAY_PER_DAY,
  SCORE_MIN,
  SCORE_MAX,
  LEAD_STAGES,
  LEAD_SOURCES,
  createLead,
  updateLeadStage,
  incrementLeadScore,
} from '../crmLeads';


// ─── computeScoreDecay (pure function — no Firebase needed) ──────────────────

describe('computeScoreDecay', () => {
  const NOW = new Date('2026-07-02T12:00:00Z');

  it('returns unchanged score when lastInteractionAt is null', () => {
    expect(computeScoreDecay(50, null, NOW)).toBe(50);
  });

  it('returns unchanged score when inactivity < 14 days', () => {
    const last = new Date('2026-06-25T12:00:00Z'); // 7 days ago
    expect(computeScoreDecay(50, last, NOW)).toBe(50);
  });

  it('returns unchanged score when inactivity equals exactly 14 days', () => {
    const last = new Date('2026-06-18T12:00:00Z'); // exactly 14 days
    expect(computeScoreDecay(50, last, NOW)).toBe(50);
  });

  it('decays 1 point per day after 14-day threshold (15 days inactive = -1)', () => {
    const last = new Date('2026-06-17T12:00:00Z'); // 15 days ago
    const result = computeScoreDecay(50, last, NOW);
    expect(result).toBe(49); // 50 - (15 - 14) * 1
  });

  it('decays correctly for 20 days inactive', () => {
    const last = new Date('2026-06-12T12:00:00Z'); // 20 days ago
    const result = computeScoreDecay(50, last, NOW);
    expect(result).toBe(44); // 50 - (20 - 14) * 1
  });

  it('score never goes below SCORE_MIN (0)', () => {
    const last = new Date('2026-01-01T12:00:00Z'); // 182 days ago
    const result = computeScoreDecay(10, last, NOW);
    expect(result).toBe(SCORE_MIN);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('handles Timestamp objects (Firestore format)', () => {
    // The mock class: new Timestamp(seconds) — same interface as Firestore Timestamp
    const nowMs = NOW.getTime();
    const last15DaysMs = nowMs - 15 * 24 * 60 * 60 * 1000;
    // Build a fake Timestamp using the mocked class from the vi.mock at the top
    const fakeTs = { seconds: last15DaysMs / 1000, toDate: () => new Date(last15DaysMs) };
    const result = computeScoreDecay(50, fakeTs, NOW);
    expect(result).toBe(49); // 50 - (15 - 14) * 1
  });
});

// ─── LEAD_STAGES / LEAD_SOURCES constants ────────────────────────────────────

describe('LEAD_STAGES', () => {
  it('contains all 6 valid stages', () => {
    expect(LEAD_STAGES).toContain('nuevo');
    expect(LEAD_STAGES).toContain('contactado');
    expect(LEAD_STAGES).toContain('calificado');
    expect(LEAD_STAGES).toContain('en_seguimiento');
    expect(LEAD_STAGES).toContain('cliente');
    expect(LEAD_STAGES).toContain('perdido');
    expect(LEAD_STAGES).toHaveLength(6);
  });
});

describe('LEAD_SOURCES', () => {
  it('contains all 9 valid sources', () => {
    const expected = ['whatsapp', 'telegram', 'instagram', 'facebook', 'tiktok', 'youtube', 'web', 'manual', 'club'];
    for (const s of expected) expect(LEAD_SOURCES).toContain(s);
    expect(LEAD_SOURCES).toHaveLength(9);
  });
});

// ─── createLead ──────────────────────────────────────────────────────────────

describe('createLead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if name is missing', async () => {
    await expect(createLead({ source: 'manual' })).rejects.toThrow('Lead name is required');
  });

  it('throws if name is empty string', async () => {
    await expect(createLead({ name: '  ', source: 'manual' })).rejects.toThrow('Lead name is required');
  });

  it('throws if source is invalid', async () => {
    await expect(createLead({ name: 'Test', source: 'tinder' })).rejects.toThrow('Invalid source: tinder');
  });

  it('creates lead and returns id with valid data', async () => {
    const id = await createLead({ name: 'Maria', source: 'club' });
    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(id).toBe('lead-123');
  });

  it('creates lead with default stage "nuevo"', async () => {
    await createLead({ name: 'Carlos', source: 'instagram' });
    const callArg = addDoc.mock.calls[0][1];
    expect(callArg.stage).toBe('nuevo');
    expect(callArg.score).toBe(0);
  });

  it('creates lead without source set to "club" correctly', async () => {
    await createLead({ name: 'Ana', source: 'club' });
    const callArg = addDoc.mock.calls[0][1];
    expect(callArg.source).toBe('club');
    expect(callArg.consent).toEqual({ whatsapp: false, email: false, telegram: false });
  });

  it('trims whitespace from name', async () => {
    await createLead({ name: '  Lucia  ', source: 'web' });
    const callArg = addDoc.mock.calls[0][1];
    expect(callArg.name).toBe('Lucia');
  });
});

// ─── updateLeadStage ─────────────────────────────────────────────────────────

describe('updateLeadStage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if stage is not a valid enum value', async () => {
    await expect(updateLeadStage('lead-1', 'archivado')).rejects.toThrow('Invalid stage: archivado');
  });

  it('throws on empty string stage', async () => {
    await expect(updateLeadStage('lead-1', '')).rejects.toThrow('Invalid stage');
  });

  it('calls updateDoc with correct stage for valid transition', async () => {
    await updateLeadStage('lead-1', 'contactado');
    expect(updateDoc).toHaveBeenCalledTimes(1);
    const payload = updateDoc.mock.calls[0][1];
    expect(payload.stage).toBe('contactado');
  });

  it('allows moving to perdido from any stage', async () => {
    await updateLeadStage('lead-1', 'perdido');
    const payload = updateDoc.mock.calls[0][1];
    expect(payload.stage).toBe('perdido');
  });
});

// ─── incrementLeadScore ──────────────────────────────────────────────────────

describe('incrementLeadScore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clamps score to SCORE_MAX (100)', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 'l1', data: () => ({ score: 95 }) });
    await incrementLeadScore('l1', 30); // 95 + 30 = 125 → clamp to 100
    const payload = updateDoc.mock.calls[0][1];
    expect(payload.score).toBe(SCORE_MAX);
  });

  it('clamps score to SCORE_MIN (0) on negative delta', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 'l1', data: () => ({ score: 5 }) });
    await incrementLeadScore('l1', -50); // 5 - 50 = -45 → clamp to 0
    const payload = updateDoc.mock.calls[0][1];
    expect(payload.score).toBe(SCORE_MIN);
  });

  it('adds delta correctly within bounds', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 'l1', data: () => ({ score: 40 }) });
    await incrementLeadScore('l1', 15);
    const payload = updateDoc.mock.calls[0][1];
    expect(payload.score).toBe(55);
  });

  it('throws if lead does not exist', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false, id: 'l1' });
    await expect(incrementLeadScore('l1', 10)).rejects.toThrow('Lead not found: l1');
  });
});
