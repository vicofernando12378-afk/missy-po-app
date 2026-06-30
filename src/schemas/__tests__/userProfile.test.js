import { describe, it, expect } from 'vitest';

import { UserProfileSchema, AddressSchema, PetSchema } from '../userProfile';

describe('UserProfileSchema', () => {
  const validProfile = {
    uid: 'firebase-uid-123',
    email: 'test@example.com',
    nombre: 'Juan',
    apellido: 'Pérez',
    telefono: '987654321',
    direcciones: [],
    mascotas: [],
    preferencias: {},
  };

  it('debería validar un perfil completo', () => {
    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('debería requerir uid', () => {
    const { uid, ...rest } = validProfile;
    const result = UserProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('debería requerir email válido', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, email: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('debería requerir nombre', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, nombre: '' });
    expect(result.success).toBe(false);
  });

  it('debería validar teléfono con 9 dígitos', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, telefono: '123' });
    expect(result.success).toBe(false);
  });

  it('debería aceptar teléfono vacío', () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, telefono: '' });
    expect(result.success).toBe(true);
  });

  it('debería limitar direcciones a 5', () => {
    const direcciones = Array(6).fill({
      alias: 'Casa',
      departamento: 'Arequipa',
      distrito: 'Cayma',
      direccion: 'Av. Principal 123',
    });
    const result = UserProfileSchema.safeParse({ ...validProfile, direcciones });
    expect(result.success).toBe(false);
  });

  it('debería limitar mascotas a 5', () => {
    const mascotas = Array(6).fill({
      nombre: 'Missy',
      especie: 'perro',
    });
    const result = UserProfileSchema.safeParse({ ...validProfile, mascotas });
    expect(result.success).toBe(false);
  });
});

describe('AddressSchema', () => {
  it('debería validar una dirección completa', () => {
    const result = AddressSchema.safeParse({
      alias: 'Casa',
      departamento: 'Arequipa',
      distrito: 'Cayma',
      direccion: 'Av. Principal 123',
      referencia: 'Frente al parque',
      es_default: true,
    });
    expect(result.success).toBe(true);
  });

  it('debería requerir alias', () => {
    const result = AddressSchema.safeParse({
      departamento: 'Arequipa',
      distrito: 'Cayma',
      direccion: 'Av. Principal 123',
    });
    expect(result.success).toBe(false);
  });

  it('debería requerir dirección mínima de 5 caracteres', () => {
    const result = AddressSchema.safeParse({
      alias: 'Casa',
      departamento: 'Arequipa',
      distrito: 'Cayma',
      direccion: 'Av',
    });
    expect(result.success).toBe(false);
  });
});

describe('PetSchema', () => {
  it('debería validar una mascota completa', () => {
    const result = PetSchema.safeParse({
      nombre: 'Missy',
      especie: 'perro',
      raza: 'French Poodle',
      fecha_nacimiento: '2020-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('debería requerir nombre', () => {
    const result = PetSchema.safeParse({
      especie: 'perro',
    });
    expect(result.success).toBe(false);
  });

  it('debería requerir especie válida', () => {
    const result = PetSchema.safeParse({
      nombre: 'Missy',
      especie: 'pajaro',
    });
    expect(result.success).toBe(false);
  });

  it('debería aceptar especie "otro"', () => {
    const result = PetSchema.safeParse({
      nombre: 'Nemo',
      especie: 'otro',
    });
    expect(result.success).toBe(true);
  });
});
