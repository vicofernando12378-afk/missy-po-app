import { addDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'segment-123' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: class {
    constructor(seconds) { this.seconds = seconds; }
    toDate() { return new Date(this.seconds * 1000); }
  },
}));

vi.mock('../firebase', () => ({ db: {} }));

import { evaluateRule, evaluateSegment, createSegment } from '../crmSegments';


describe('evaluateRule', () => {
  const lead = {
    name: 'Firulais',
    score: 50,
    source: 'club',
    tags: ['vip', 'activo'],
    createdAt: new Date('2026-06-01T12:00:00Z'),
  };

  it('evaluates equals operator (==) correctly', () => {
    expect(evaluateRule(lead, { field: 'source', operator: '==', value: 'club' })).toBe(true);
    expect(evaluateRule(lead, { field: 'source', operator: '==', value: 'instagram' })).toBe(false);
  });

  it('handles case-insensitivity and trim for equals string comparisons', () => {
    expect(evaluateRule(lead, { field: 'source', operator: '==', value: ' CLUB  ' })).toBe(true);
  });

  it('evaluates not equals operator (!=) correctly', () => {
    expect(evaluateRule(lead, { field: 'source', operator: '!=', value: 'instagram' })).toBe(true);
    expect(evaluateRule(lead, { field: 'source', operator: '!=', value: 'club' })).toBe(false);
  });

  it('evaluates greater than (>) operator correctly', () => {
    expect(evaluateRule(lead, { field: 'score', operator: '>', value: 40 })).toBe(true);
    expect(evaluateRule(lead, { field: 'score', operator: '>', value: 50 })).toBe(false);
  });

  it('coerces string values to numbers for comparison if lead value is numeric', () => {
    expect(evaluateRule(lead, { field: 'score', operator: '>', value: '40' })).toBe(true);
  });

  it('evaluates greater or equal (>=) operator correctly', () => {
    expect(evaluateRule(lead, { field: 'score', operator: '>=', value: 50 })).toBe(true);
    expect(evaluateRule(lead, { field: 'score', operator: '>=', value: 60 })).toBe(false);
  });

  it('evaluates less than (<) operator correctly', () => {
    expect(evaluateRule(lead, { field: 'score', operator: '<', value: 60 })).toBe(true);
    expect(evaluateRule(lead, { field: 'score', operator: '<', value: 50 })).toBe(false);
  });

  it('evaluates less or equal (<=) operator correctly', () => {
    expect(evaluateRule(lead, { field: 'score', operator: '<=', value: 50 })).toBe(true);
    expect(evaluateRule(lead, { field: 'score', operator: '<=', value: 30 })).toBe(false);
  });

  it('evaluates array-contains operator correctly', () => {
    expect(evaluateRule(lead, { field: 'tags', operator: 'array-contains', value: 'vip' })).toBe(true);
    expect(evaluateRule(lead, { field: 'tags', operator: 'array-contains', value: 'VIP' })).toBe(true); // case-insensitive
    expect(evaluateRule(lead, { field: 'tags', operator: 'array-contains', value: 'inactivo' })).toBe(false);
  });

  it('handles Date/Timestamp values correctly', () => {
    const ruleBefore = { field: 'createdAt', operator: '<', value: '2026-07-01' };
    const ruleAfter = { field: 'createdAt', operator: '>', value: '2026-05-01' };
    expect(evaluateRule(lead, ruleBefore)).toBe(true);
    expect(evaluateRule(lead, ruleAfter)).toBe(true);
  });
});

describe('evaluateSegment', () => {
  const lead = {
    name: 'Firulais',
    score: 50,
    source: 'club',
    tags: ['vip'],
  };

  it('returns true if all rules match (AND logic)', () => {
    const rules = [
      { field: 'source', operator: '==', value: 'club' },
      { field: 'score', operator: '>=', value: 40 },
    ];
    expect(evaluateSegment(lead, rules)).toBe(true);
  });

  it('returns false if at least one rule fails', () => {
    const rules = [
      { field: 'source', operator: '==', value: 'club' },
      { field: 'score', operator: '>', value: 100 },
    ];
    expect(evaluateSegment(lead, rules)).toBe(false);
  });

  it('returns false if rules array is empty or missing', () => {
    expect(evaluateSegment(lead, [])).toBe(false);
    expect(evaluateSegment(lead, null)).toBe(false);
  });
});

describe('createSegment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if name is missing', async () => {
    await expect(createSegment({ rules: [{ field: 'score', operator: '>', value: 10 }] })).rejects.toThrow('Segment name is required');
  });

  it('throws if rules are empty', async () => {
    await expect(createSegment({ name: 'VIPs', rules: [] })).rejects.toThrow('Segment rules are required');
  });

  it('creates segment with correct properties and returns id', async () => {
    const rules = [{ field: 'score', operator: '>', value: 50 }];
    const id = await createSegment({ name: 'Test Segment', description: 'Desc', rules });
    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(id).toBe('segment-123');
  });
});
