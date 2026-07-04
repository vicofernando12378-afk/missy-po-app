/**
 * knowledge.js — Knowledge base loader for the Telegram sales assistant.
 *
 * Loads business info, policies, FAQ, club data, and product catalog
 * from Firestore. Cached 10 minutes to avoid hammering Firestore on every message.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getCatalogJSON } from './productCatalog.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = null;
let cacheExpiry = 0;

/**
 * Loads all knowledge base documents from Firestore.
 * @returns {Promise<{ businessInfo: object, policies: object, faq: object, club: object }>}
 */
export async function loadKnowledge() {
  const now = Date.now();
  if (cache && now < cacheExpiry) return cache;

  const db = getFirestore();
  const result = { businessInfo: null, policies: null, faq: null, club: null };

  try {
    const [bizSnap, polSnap, faqSnap, clubSnap] = await Promise.all([
      db.collection('crm_knowledge').doc('business_info').get(),
      db.collection('crm_knowledge').doc('policies').get(),
      db.collection('crm_knowledge').doc('faq').get(),
      db.collection('crm_knowledge').doc('club').get(),
    ]);

    if (bizSnap.exists) result.businessInfo = bizSnap.data();
    if (polSnap.exists) result.policies = polSnap.data();
    if (faqSnap.exists) result.faq = faqSnap.data();
    if (clubSnap.exists) result.club = clubSnap.data();
  } catch (err) {
    console.error('[knowledge] Firestore read failed:', err.message);
  }

  cache = result;
  cacheExpiry = now + CACHE_TTL_MS;
  return result;
}

/**
 * Builds a formatted knowledge context string for injection into the system prompt.
 */
export async function getKnowledgeContext(userMessage) {
  const kb = await loadKnowledge();
  const sections = [];

  // Business info
  if (kb.businessInfo) {
    const b = kb.businessInfo;
    sections.push(`## Información del Negocio
- Nombre: ${b.nombreNegocio || 'Missy & Po Pet Shop'}
- Descripción: ${b.descripcion || ''}
- Horario: ${b.horario || 'Lunes a Sábado 9am-7pm'}
- Dirección: ${b.direccion || ''}
- Teléfono: ${b.telefono || ''}
- WhatsApp: ${b.whatsapp || ''}
- Email: ${b.email || ''}
- Instagram: ${b.redes?.instagram || ''}
- Facebook: ${b.redes?.facebook || ''}`);
  }

  // Policies
  if (kb.policies) {
    const p = kb.policies;
    if (p.envios) {
      sections.push(`## Políticas de Envío
${formatEnvios(p.envios)}`);
    }
    if (p.pagos) {
      sections.push(`## Medios de Pago
${formatPagos(p.pagos)}`);
    }
    if (p.devoluciones) {
      sections.push(`## Devoluciones y Garantías
${formatDevoluciones(p.devoluciones)}`);
    }
  }

  // FAQ — filter relevant questions based on user message
  if (kb.faq?.preguntas?.length > 0) {
    const relevantFaq = filterFaq(kb.faq.preguntas, userMessage);
    if (relevantFaq.length > 0) {
      sections.push(`## Preguntas Frecuentes Relevantes
${relevantFaq.map(f => {
        const q = f.q || f.pregunta || '';
        const a = f.a || f.respuesta || '';
        return `- P: ${q}\n  R: ${a}`;
      }).join('\n')}`);
    }
  }

  // Club info
  if (kb.club) {
    sections.push(`## Club Missy & Po
${formatClub(kb.club)}`);
  }

  // Product catalog
  const catalogSection = await getProductCatalogContext();
  if (catalogSection) {
    sections.push(catalogSection);
  }

  return sections.join('\n\n');
}

/**
 * Builds product catalog context for the system prompt.
 * Returns formatted markdown with all active products + anti-hallucination rules.
 */
async function getProductCatalogContext() {
  try {
    const products = await getCatalogJSON();
    if (!products || products.length === 0) return null;

    // Group by category
    const byCategory = {};
    for (const p of products) {
      const cats = p.categorias?.length > 0 ? p.categorias : ['Sin categoría'];
      for (const cat of cats) {
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(p);
      }
    }

    const lines = ['# Catálogo de Productos (Missy & Po)'];
    lines.push('REGLA CRÍTICA: Solo puedes recomendar productos que aparecen en este listado.');
    lines.push('Si el cliente pregunta por algo que no existe, di "no tenemos eso" y recomienda del listado.');
    lines.push('NUNCA inventes nombres, precios, categorías o productos.\n');

    for (const [cat, items] of Object.entries(byCategory)) {
      lines.push(`## ${cat}`);
      for (const p of items) {
        const priceStr = p.enOferta
          ? `S/.${p.precio} (oferta, antes S/.${p.precioRegular})`
          : `S/.${p.precio}`;
        const stockStr = p.stock > 0 ? `Stock: ${p.stock}` : 'AGOTADO';
        lines.push(`- ${p.nombre} — ${priceStr} — ${stockStr} — /producto/${p.slug}`);
      }
    }

    return lines.join('\n');
  } catch (err) {
    console.error('[knowledge] Error loading product catalog:', err.message);
    return null;
  }
}

/**
 * Clears the knowledge cache (e.g., after admin updates).
 */
export function clearKnowledgeCache() {
  cache = null;
  cacheExpiry = 0;
}

// ── PRIVATE HELPERS ──────────────────────────────────────────────────────────

function formatEnvios(envios) {
  const lines = [];
  if (envios.Lima) lines.push(`- Lima: ${envios.Lima}`);
  if (envios.Provincia) lines.push(`- Provincia: ${envios.Provincia}`);
  if (envios.zonas) lines.push(`- Zonas disponibles: ${envios.zonas.join(', ')}`);
  return lines.join('\n') || '- Envíos a todo Perú';
}

function formatPagos(pagos) {
  const lines = [];
  if (pagos.metodos) lines.push(`- Métodos: ${pagos.metodos.join(', ')}`);
  if (pagos.cuotas) lines.push(`- Cuotas: ${pagos.cuotas}`);
  if (pagos.anticipo) lines.push(`- Anticipo: ${pagos.anticipo}`);
  return lines.join('\n') || '- Aceptamos múltiples medios de pago';
}

function formatDevoluciones(dev) {
  const lines = [];
  if (dev.plazo) lines.push(`- Plazo: ${dev.plazo}`);
  if (dev.condiciones) lines.push(`- Condiciones: ${dev.condiciones}`);
  if (dev.proceso) lines.push(`- Proceso: ${dev.proceso}`);
  return lines.join('\n');
}

function formatClub(club) {
  const lines = [];
  if (club.beneficios) lines.push(`Beneficios: ${club.beneficios}`);
  if (club.puntos) lines.push(`Sistema de puntos: ${club.puntos}`);
  if (club.requisitos) lines.push(`Para unirse: ${club.requisitos}`);
  if (club.promociones) lines.push(`Promociones activas: ${club.promociones}`);
  return lines.join('\n') || 'Club de fidelización con puntos y descuentos exclusivos';
}

function filterFaq(faqs, userMessage) {
  if (!userMessage) return faqs.slice(0, 5);

  const lower = userMessage.toLowerCase();
  const scored = faqs.map(f => {
    const qVal = f.q || f.pregunta || '';
    const aVal = f.a || f.respuesta || '';
    const qLower = qVal.toLowerCase();
    const aLower = aVal.toLowerCase();
    let score = 0;

    // Exact word match in question
    const words = lower.split(/\s+/).filter(w => w.length > 3);
    for (const word of words) {
      if (qLower.includes(word)) score += 3;
      if (aLower.includes(word)) score += 1;
    }

    return { ...f, score };
  });

  return scored
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
