/**
 * getApiKeysStatus.js — Callable Cloud Function to get masked API key status.
 *
 * Returns every configured key as "••••••••xxxx" (last 4 chars visible).
 * Empty/missing keys return empty string so the UI knows which fields
 * still need configuration.
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { onCall } from 'firebase-functions/v2/https';

import { getMaskedKeys } from '../lib/config.js';

export const getApiKeysStatus = onCall({ cors: true }, async (request) => {
  if (!request.auth || !request.auth.token.admin) {
    const email = request.auth?.token?.email;
    if (email !== 'victorchavezd@gmail.com') {
      throw new HttpsError('permission-denied', 'Solo administradores pueden ver API keys.');
    }
  }

  const masked = await getMaskedKeys();
  return { keys: masked };
});
