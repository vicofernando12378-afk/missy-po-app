/**
 * saveKnowledge.js — Callable Cloud Function to save knowledge base data.
 * Admin-only. Writes to crm_knowledge collection.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { clearKnowledgeCache } from '../lib/knowledge.js';

const ALLOWED_DOCS = new Set(['business_info', 'policies', 'faq', 'club']);
const ALLOWED_FIELDS = {
  business_info: new Set([
    'nombreNegocio', 'descripcion', 'horario', 'direccion', 'telefono',
    'whatsapp', 'email', 'redes',
  ]),
  policies: new Set(['envios', 'pagos', 'devoluciones', 'garantia', 'club']),
  faq: new Set(['preguntas']),
  club: new Set(['beneficios', 'puntos', 'requisitos', 'promociones']),
};

export const saveKnowledge = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    const email = request.auth?.token?.email;
    if (email !== 'victorchavezd@gmail.com') {
      throw new HttpsError('permission-denied', 'Solo administradores.');
    }
  }

  const { docId, data } = request.data || {};
  if (!docId || !ALLOWED_DOCS.has(docId)) {
    throw new HttpsError('invalid-argument', 'Documento no válido.');
  }
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Datos inválidos.');
  }

  // Filter to allowed fields
  const allowed = ALLOWED_FIELDS[docId];
  const sanitized = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) sanitized[k] = v;
  }

  if (Object.keys(sanitized).length === 0) {
    throw new HttpsError('invalid-argument', 'No hay campos válidos.');
  }

  sanitized.updatedAt = new Date();

  const db = getFirestore();
  await db.collection('crm_knowledge').doc(docId).set(sanitized, { merge: true });

  clearKnowledgeCache();

  return { ok: true, saved: docId };
});
