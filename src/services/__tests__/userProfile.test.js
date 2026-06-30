import { getDocs, setDoc } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { initializeUserProfile } from '../userProfile';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-uid' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

describe('initializeUserProfile service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe crear un perfil base si no hay registros en el club', async () => {
    const uid = 'test-uid';
    const email = 'test@example.com';
    
    const profile = await initializeUserProfile(uid, email);
    
    expect(profile.uid).toBe(uid);
    expect(profile.email).toBe(email);
    expect(profile.nombre).toBe('Socio');
    expect(profile.mascotas).toEqual([]);
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('debe migrar datos del tutor y mascota si existen registros en el club', async () => {
    const uid = 'test-uid';
    const email = 'migrated@example.com';
    
    // Simular que el club tiene este miembro
    const mockClubMember = {
      nombre_tutor: 'Juan Perez',
      email: 'migrated@example.com',
      celular: '999888777',
      direccion: 'Av. Larco 123',
      departamento: 'Lima',
      distrito: 'Miraflores',
      nombre_mascota: 'Loki',
      mascota_raza: 'Schnauzer',
    };

    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [
        { data: () => mockClubMember },
      ],
    });

    const profile = await initializeUserProfile(uid, email);
    
    expect(profile.nombre).toBe('Juan');
    expect(profile.apellido).toBe('Perez');
    expect(profile.telefono).toBe('999888777');
    expect(profile.direcciones[0].direccion).toBe('Av. Larco 123');
    expect(profile.mascotas[0].nombre).toBe('Loki');
    expect(profile.mascotas[0].raza).toBe('Schnauzer');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});
