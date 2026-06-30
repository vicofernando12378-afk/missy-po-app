import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import useClubMembership from '../useClubMembership';

// Mock de firebase
vi.mock('../../services/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  collection: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true })),
  query: vi.fn(),
  where: vi.fn(),
}));

describe('useClubMembership hook', () => {
  it('should initialize with default states', () => {
    const { result } = renderHook(() => useClubMembership());

    expect(result.current.clubMember).toBeNull();
    expect(result.current.verifyingMember).toBe(false);
    expect(result.current.pointsApplied).toBe(false);
    expect(result.current.verifyEmailInput).toBe('');
    expect(result.current.verifyAliasInput).toBe('');
  });

  it('should apply and remove points correctly', () => {
    const { result } = renderHook(() => useClubMembership());

    act(() => {
      result.current.applyPoints();
    });
    expect(result.current.pointsApplied).toBe(true);

    act(() => {
      result.current.removePoints();
    });
    expect(result.current.pointsApplied).toBe(false);
  });
});
