import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getUserProfile,
  upsertUserProfile,
  updateUserProfile,
  addAddress,
  removeAddress,
  addPet,
  removePet,
} from '../../services/userProfile';
import useUserStore from '../userStore';

vi.mock('../../services/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('../../services/userProfile', () => ({
  getUserProfile: vi.fn(),
  upsertUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  addAddress: vi.fn(),
  removeAddress: vi.fn(),
  addPet: vi.fn(),
  removePet: vi.fn(),
}));

describe('User Store', () => {
  beforeEach(() => {
    useUserStore.getState().clearProfile();
    vi.clearAllMocks();
  });

  it('debería inicializar sin profile', () => {
    const state = useUserStore.getState();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('debería cargar profile existente', async () => {
    const mockProfile = {
      uid: 'user-123',
      email: 'test@example.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      direcciones: [],
      mascotas: [],
    };
    getUserProfile.mockResolvedValue(mockProfile);

    await useUserStore.getState().fetchProfile('user-123');

    const state = useUserStore.getState();
    expect(state.profile).toEqual(mockProfile);
    expect(state.isLoading).toBe(false);
  });

  it('debería crear profile vacío si no existe', async () => {
    getUserProfile.mockResolvedValue(null);
    upsertUserProfile.mockResolvedValue({ uid: 'user-123', direcciones: [], mascotas: [] });

    await useUserStore.getState().fetchProfile('user-123');

    const state = useUserStore.getState();
    expect(state.profile).toBeTruthy();
    expect(state.profile.uid).toBe('user-123');
  });

  it('debería actualizar campos del profile', async () => {
    const mockProfile = {
      uid: 'user-123',
      email: 'test@example.com',
      nombre: 'Juan',
      apellido: 'Pérez',
    };
    useUserStore.setState({ profile: mockProfile });
    updateUserProfile.mockResolvedValue();

    await useUserStore.getState().updateProfile('user-123', { nombre: 'Carlos' });

    const state = useUserStore.getState();
    expect(state.profile.nombre).toBe('Carlos');
  });

  it('debería guardar profile completo', async () => {
    const savedProfile = {
      uid: 'user-123',
      email: 'test@example.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      direcciones: [],
      mascotas: [],
    };
    upsertUserProfile.mockResolvedValue(savedProfile);

    await useUserStore.getState().saveProfile('user-123', savedProfile);

    const state = useUserStore.getState();
    expect(state.profile).toEqual(savedProfile);
  });

  it('debería retornar null si no hay uid', async () => {
    const result = await useUserStore.getState().fetchProfile(null);
    expect(result).toBeNull();
  });

  it('debería limpiar profile', () => {
    useUserStore.setState({ profile: { uid: '123' }, error: 'test' });
    useUserStore.getState().clearProfile();

    const state = useUserStore.getState();
    expect(state.profile).toBeNull();
    expect(state.error).toBeNull();
  });
});
