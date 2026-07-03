/**
 * intentDictionary.js — Dictionary and logic to detect commercial intent in social media comments.
 */

const KEYWORDS = [
  'precio',
  'precios',
  'cuanto',
  'cuánto',
  'cuesta',
  'cuestan',
  'vale',
  'valen',
  'costo',
  'costos',
  'costará',
  'valor',
  'disponible',
  'disponibles',
  'tienen',
  'tiene',
  'tallas',
  'talla',
  'stock',
  'quiero',
  'comprar',
  'pedido',
  'pedidos',
  'compra',
  'compras',
  'envio',
  'envíos',
  'envio',
  'envio',
  'envios',
  'delivery',
  'provincias',
  'provincia',
  'yape',
  'plin',
  'info',
  'informacion',
  'información',
  'interesa',
  'venden',
  'vendes',
  'catalogo',
  'catálogo',
  'ubican',
  'direccion',
  'dirección',
  'tienda',
  'compro',
  'adquirir',
];


/**
 * Removes diacritics (accents) and cleans string.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')     // remove punctuation
    .trim();
}

/**
 * Checks if a message/comment has commercial intent.
 * @param {string} text
 * @returns {boolean}
 */
export function hasCommercialIntent(text) {
  if (!text) return false;
  const cleanText = normalizeText(text);
  const words = cleanText.split(/\s+/);

  // Check if any commercial word matches
  return KEYWORDS.some((keyword) => {
    const cleanKeyword = normalizeText(keyword);
    // If the keyword has multiple words (e.g. "cuanto cuesta"), check substring
    if (cleanKeyword.includes(' ')) {
      return cleanText.includes(cleanKeyword);
    }
    // Else check exact word match
    return words.includes(cleanKeyword);
  });
}
