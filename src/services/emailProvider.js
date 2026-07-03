/**
 * emailProvider.js — Service wrapper for sending emails via Trigger Email extension (myp_correos)
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from './firebase';

const COL = 'myp_correos';

// Unsubscribe link structure using Firebase Cloud Function
export function getUnsubscribeLink(email) {
  const projectId = 'missy-po'; // Fallback to current project ID
  return `https://us-central1-${projectId}.cloudfunctions.net/missy-po-crm-unsubscribeLead?email=${encodeURIComponent(email)}`;
}

/**
 * Sends a single transactional email by inserting into myp_correos.
 * @param {object} params - { to, subject, html }
 * @returns {Promise<string>} docId
 */
export async function sendSingleEmail({ to, subject, html }) {
  if (!to) throw new Error('Recipient email "to" is required');
  if (!subject) throw new Error('Email "subject" is required');
  if (!html) throw new Error('Email "html" body is required');

  const payload = {
    to,
    message: {
      subject,
      html,
    },
    creado_en: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

/**
 * Queues campaign emails in bulk with unsubscribe links inserted.
 * @param {object} params - { toEmails, subject, html, campaignId }
 * @returns {Promise<void>}
 */
export async function sendBulkCampaignEmail({ toEmails, subject, html, campaignId }) {
  if (!Array.isArray(toEmails) || toEmails.length === 0) {
    throw new Error('toEmails must be a non-empty array');
  }

  // Loop and insert documents (client side batch/concurrent writes)
  // Let the user's front-end trigger concurrent additions.
  const promises = toEmails.map(async (email) => {
    const unsubLink = getUnsubscribeLink(email);
    const htmlWithUnsubscribe = `
      ${html}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.5;">
        Este correo fue enviado por Missy & Po Pet Shop. <br />
        Si no deseas recibir más correos de campañas, puedes 
        <a href="${unsubLink}" style="color: #f43f5e; text-decoration: underline;">darte de baja aquí</a> en cualquier momento.
      </p>
    `;

    return addDoc(collection(db, COL), {
      to: email,
      message: {
        subject,
        html: htmlWithUnsubscribe,
      },
      campaignId: campaignId || null,
      creado_en: serverTimestamp(),
    });
  });

  await Promise.all(promises);
}
