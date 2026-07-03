import { describe, it, expect, vi, beforeEach } from 'vitest';

// Setup mocks before import
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (colName) => ({
      doc: (id) => ({
        id: id || 'doc-123',
        set: mockSet,
        update: mockUpdate,
      }),
      where: () => ({
        where: () => ({
          limit: () => ({
            get: mockGet,
          }),
        }),
      }),
    }),
    batch: () => ({
      commit: vi.fn(),
    }),
  }),
  Timestamp: {
    fromDate: (d) => d,
  },
}));

import { processSocialEvent } from '../processSocialEvent';

describe('processSocialEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip comments with no commercial intent', async () => {
    const result = await processSocialEvent({
      platform: 'instagram',
      type: 'comment',
      externalUserId: 'user-1',
      userName: 'Juan',
      content: 'Qué lindo perrito! 😍',
    });

    expect(result.leadId).toBeNull();
    expect(result.created).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('should create new lead and interaction for comment with commercial intent', async () => {
    // Mock empty search (lead does not exist)
    mockGet.mockResolvedValueOnce({ empty: true });

    const result = await processSocialEvent({
      platform: 'instagram',
      type: 'comment',
      externalUserId: 'user-2',
      userName: 'Ana',
      content: 'Hola, ¿qué precio tiene el delivery a Miraflores?',
    });

    expect(result.leadId).not.toBeNull();
    expect(result.created).toBe(true);
    // 1 call to create lead, 1 call to create interaction
    expect(mockSet).toHaveBeenCalledTimes(2);
    // 1 call to update lead score
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('should always create lead for DMs even without commercial keywords', async () => {
    mockGet.mockResolvedValueOnce({ empty: true });

    const result = await processSocialEvent({
      platform: 'facebook',
      type: 'dm',
      externalUserId: 'user-3',
      userName: 'Carlos',
      content: 'Hola, buenas tardes.',
    });

    expect(result.leadId).not.toBeNull();
    expect(result.created).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(2);
  });

  it('should reuse existing lead and only log interaction + update score', async () => {
    // Mock existing lead search result
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [{
        id: 'existing-lead-abc',
        data: () => ({ score: 30 }),
      }],
    });

    const result = await processSocialEvent({
      platform: 'instagram',
      type: 'dm',
      externalUserId: 'user-2',
      userName: 'Ana',
      content: 'Quiero hacer un pedido',
    });

    expect(result.leadId).toBe('existing-lead-abc');
    expect(result.created).toBe(false);
    // 1 call to set interaction only (lead already exists, no lead set needed)
    expect(mockSet).toHaveBeenCalledTimes(1);
    // 1 call to update lead score + interaction date
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      score: 40, // 30 + 10
    }));
  });
});
