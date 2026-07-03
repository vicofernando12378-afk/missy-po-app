import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

export const unsubscribeLead = onRequest({ cors: true }, async (req, res) => {
  const email = req.query.email || req.body.email;

  if (!email) {
    res.status(400).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #374151;">
        <h2 style="color: #ef4444;">Error de Parámetro</h2>
        <p>No se especificó la dirección de correo electrónico a desuscribir.</p>
      </div>
    `);
    return;
  }

  const db = getFirestore();
  const emailLower = email.trim().toLowerCase();

  try {
    // Search for lead(s) with this email
    const leadsSnap = await db.collection('crm_leads')
      .where('email', '==', emailLower)
      .get();

    if (leadsSnap.empty) {
      res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #374151;">
          <h2 style="color: #f59e0b;">Correo no registrado</h2>
          <p>No encontramos ningún registro para el correo <strong>${email}</strong> en nuestro club de beneficios.</p>
          <a href="https://missypo.com" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #f43f5e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Ir a la tienda</a>
        </div>
      `);
      return;
    }

    const batch = db.batch();
    leadsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        'consent.email': false,
        updatedAt: new Date(),
      });
    });

    await batch.commit();

    res.status(200).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px 20px; color: #374151; max-width: 500px; margin: 0 auto; border: 1px solid #f3f4f6; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
        <span style="font-size: 48px;">✉️</span>
        <h2 style="color: #f43f5e; margin-top: 15px;">Te has desuscrito correctamente</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin-bottom: 25px;">
          Hemos actualizado tus preferencias. No volverás a recibir correos sobre campañas promocionales de Missy & Po Pet Shop en el correo <strong>${email}</strong>.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-bottom: 30px;">
          Si deseas volver a suscribirte en el futuro, puedes hacerlo registrándote de nuevo en el checkout de la tienda.
        </p>
        <a href="https://missypo.com" style="display: inline-block; padding: 12px 24px; background-color: #374151; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; transition: background-color 0.2s;">
          Volver a Missy & Po 🐾
        </a>
      </div>
    `);
  } catch (error) {
    console.error('Error in unsubscribeLead:', error);
    res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #374151;">
        <h2 style="color: #ef4444;">Error del Servidor</h2>
        <p>Hubo un problema al procesar tu solicitud. Por favor intenta de nuevo más tarde.</p>
      </div>
    `);
  }
});
