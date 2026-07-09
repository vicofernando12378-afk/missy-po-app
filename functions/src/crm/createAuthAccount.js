/**
 * createAuthAccount.js — Crea cuenta Firebase Auth + envía email de bienvenida.
 * Se ejecuta DESPUÉS de que el pedido ya está confirmado (fire-and-forget).
 *
 * Reutiliza el patrón de envío de email de ReclamacionesForm.jsx:
 * escribe en myp_correos → Firebase Trigger Email → Brevo → destinatario.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * Crea cuenta en Firebase Auth y envía email de bienvenida.
 * Fire-and-forget: si falla, no afecta el pedido.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.nombre
 * @param {string} params.telefono
 * @param {string} params.leadId
 * @param {string} params.pedidoId
 */
export async function crearCuentaAuthAutomatica({
  email, nombre, telefono, leadId, pedidoId,
}) {
  if (!email) return { success: false, reason: 'no_email' };

  try {
    const db = getFirestore();

    // 1. Verificar si ya tiene cuenta Auth
    let existingUser;
    try {
      existingUser = await getAuth().getUserByEmail(email);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
      existingUser = null;
    }

    // 2. Si ya existe, solo vincular el lead si no tiene authUid
    if (existingUser) {
      if (leadId) {
        const leadDoc = await db.collection('crm_leads').doc(leadId).get();
        if (leadDoc.exists && !leadDoc.data().authUid) {
          await db.collection('crm_leads').doc(leadId).update({
            authUid: existingUser.uid,
            updatedAt: Timestamp.fromDate(new Date()),
          });
        }
      }
      console.log(`ℹ️ Auth account already exists for ${email}`);
      return { success: true, alreadyExists: true };
    }

    // 3. Generar contraseña temporal (nunca se almacena)
    const tempPassword = crypto.randomBytes(12).toString('base64url');

    // 4. Crear usuario en Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      displayName: nombre || '',
      phoneNumber: telefono || undefined,
      password: tempPassword,
      emailVerified: false,
    });

    // 5. Vincular lead con authUid
    if (leadId) {
      await db.collection('crm_leads').doc(leadId).update({
        authUid: userRecord.uid,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    }

    // 6. Generar link de reset password
    const resetLink = await getAuth().generatePasswordResetLink(email, {
      url: 'https://missypoweb.web.app/login',
    });

    // 7. Enviar email de bienvenida (patrón de ReclamacionesForm.jsx)
    await db.collection('myp_correos').add({
      to: email,
      message: {
        subject: 'Bienvenido al Club Missy & Po',
        html: buildWelcomeHTML({ nombre, resetLink }),
      },
      tipo: 'bienvenida_club',
      leadId: leadId || null,
      pedidoId: pedidoId || null,
      creado_en: Timestamp.fromDate(new Date()),
    });

    console.log(`✅ Auth account created for ${email} (${userRecord.uid})`);
    return { success: true, uid: userRecord.uid };

  } catch (error) {
    console.error(`❌ Error creating auth account for ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Genera el HTML del email de bienvenida.
 * Sigue el patrón visual de ReclamacionesForm.jsx.
 */
function buildWelcomeHTML({ nombre, resetLink }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
  <h2 style="color: #f43f5e; text-align: center;">Missy & Po Pet Shop</h2>
  <p>Hola <strong>${nombre || 'amigo/a'}</strong>,</p>
  <p>Gracias por tu compra. Tu cuenta ha sido creada exitosamente.</p>
  <p>Haz click en el siguiente botón para establecer tu contraseña y acceder a tu panel de socio:</p>
  <div style="text-align: center; padding: 20px 0;">
    <a href="${resetLink}" style="background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Establecer mi contraseña
    </a>
  </div>
  <p>Una vez dentro podrás ver:</p>
  <ul>
    <li>Tus puntos del Club</li>
    <li>Historial de pedidos</li>
    <li>Beneficios exclusivos</li>
  </ul>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
    Missy & Po Pet Shop - Coop. Universitaria i-1 Dpto 3, Arequipa, Perú
  </p>
</body>
</html>`;
}
