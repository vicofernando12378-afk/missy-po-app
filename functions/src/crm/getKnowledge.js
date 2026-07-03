/**
 * getKnowledge.js — Callable Cloud Function to get knowledge base data.
 * Admin-only read.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const getKnowledge = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    const email = request.auth?.token?.email;
    if (email !== 'victorchavezd@gmail.com') {
      throw new HttpsError('permission-denied', 'Solo administradores.');
    }
  }

  const db = getFirestore();
  const snap = await db.collection('crm_knowledge').get();

  const result = {};
  snap.forEach(doc => {
    result[doc.id] = doc.data();
  });

  return { data: result };
});
