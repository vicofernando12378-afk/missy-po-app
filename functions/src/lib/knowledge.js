/**
 * knowledge.js — Knowledge base loader for the Telegram sales assistant.
 *
 * Loads business info, policies, FAQ, and club data from Firestore crm_knowledge.
 * Cached 10 minutes to avoid hammering Firestore on every message.
 */

import { getFirestore } from 'firebase-admin/firestore';

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
${relevantFaq.map(f => `- P: ${f.q}\n  R: ${f.a}`).join('\n')}`);
    }
  }

  // Club info
  if (kb.club) {
    sections.push(`## Club Missy & Po
${formatClub(kb.club)}`);
  }

  return sections.join('\n\n');
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
    const qLower = f.q.toLowerCase();
    const aLower = f.a.toLowerCase();
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
