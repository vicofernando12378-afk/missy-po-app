import { describe, it, expect } from 'vitest';

import { hasCommercialIntent, normalizeText } from '../intentDictionary';

describe('normalizeText', () => {
  it('should remove accents and special characters', () => {
    expect(normalizeText('¡Hola! ¿Cuánto cuesta?')).toBe('hola cuanto cuesta');
    expect(normalizeText('Precio y envío a PROVINCIAS...')).toBe('precio y envio a provincias');
  });
});

describe('hasCommercialIntent', () => {
  it('should return true for messages containing commercial keywords', () => {
    expect(hasCommercialIntent('precio por favor')).toBe(true);
    expect(hasCommercialIntent('¿Tienen stock de comida para gatos?')).toBe(true);
    expect(hasCommercialIntent('hacen envíos a piura?')).toBe(true);
    expect(hasCommercialIntent('quiero comprar un juguete')).toBe(true);
  });

  it('should return false for casual or non-commercial comments', () => {
    expect(hasCommercialIntent('Qué hermoso perrito! 😍')).toBe(false);
    expect(hasCommercialIntent('jajaja qué gracioso')).toBe(false);
    expect(hasCommercialIntent('hola buenas tardes')).toBe(false);
  });
});
