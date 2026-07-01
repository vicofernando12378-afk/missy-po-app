import { describe, it, expect, vi, afterEach } from 'vitest';

import { contarDiasHabiles, calcularSLA, SLA_DIAS_HABILES } from '../sla';

afterEach(() => {
  vi.useRealTimers();
});

describe('contarDiasHabiles', () => {
  it('counts weekdays between two dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T12:00:00')); // Monday
    const desde = new Date('2026-07-01T12:00:00'); // Wednesday
    const hasta = new Date('2026-07-06T12:00:00'); // Monday
    // Wed, Thu, Fri = 3 weekdays
    expect(contarDiasHabiles(desde, hasta)).toBe(3);
  });

  it('excludes weekends', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T12:00:00')); // Tuesday
    const desde = new Date('2026-07-04T12:00:00'); // Saturday
    const hasta = new Date('2026-07-07T12:00:00'); // Tuesday
    // Sunday only (Sat excluded by <, Sun counted as weekend) = 0
    // Actually: Sat(6) skip, Sun(0) skip, Mon(1) count = 1
    expect(contarDiasHabiles(desde, hasta)).toBe(1);
  });

  it('returns 0 for same day', () => {
    const fecha = new Date('2026-07-01T12:00:00');
    expect(contarDiasHabiles(fecha, fecha)).toBe(0);
  });

  it('handles full week Mon-Fri', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T12:00:00')); // Monday
    const desde = new Date('2026-07-06T12:00:00'); // Monday
    const hasta = new Date('2026-07-11T12:00:00'); // Saturday
    // Mon, Tue, Wed, Thu, Fri = 5
    expect(contarDiasHabiles(desde, hasta)).toBe(5);
  });
});

describe('calcularSLA', () => {
  it('returns cumplido for cerrado status', () => {
    const result = calcularSLA(new Date(), 'cerrado');
    expect(result.tipo).toBe('cumplido');
    expect(result.diasTranscurridos).toBe(0);
    expect(result.diasRestantes).toBe(0);
  });

  it('returns cumplido for respondido status', () => {
    const result = calcularSLA(new Date(), 'respondido');
    expect(result.tipo).toBe('cumplido');
  });

  it('returns al_dia for recent claims', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-10T12:00:00'));
    const creado = new Date('2026-07-09T12:00:00');
    const result = calcularSLA(creado, 'recibido');
    expect(result.tipo).toBe('al_dia');
    expect(result.diasRestantes).toBeGreaterThan(5);
  });

  it('returns vencido when SLA is exceeded', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00'));
    const creado = new Date('2026-07-10T12:00:00');
    // 15 business days from Jul 10 = Jul 29 (approx). Aug 1 should be vencido.
    const result = calcularSLA(creado, 'recibido');
    expect(result.tipo).toBe('vencido');
    expect(result.diasRestantes).toBeLessThan(0);
  });

  it('has SLA_DIAS_HABILES set to 15', () => {
    expect(SLA_DIAS_HABILES).toBe(15);
  });
});
