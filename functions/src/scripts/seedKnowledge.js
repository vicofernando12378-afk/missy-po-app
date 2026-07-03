/**
 * seedKnowledge.js — One-time script to seed the crm_knowledge collection
 * in Firestore with initial business data.
 *
 * Run: node functions/src/scripts/seedKnowledge.js
 * Requires: Firebase Admin SDK initialized (GOOGLE_APPLICATION_CREDENTIALS)
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });

const db = getFirestore();

const SEED_DATA = {
  business_info: {
    nombreNegocio: 'Missy & Po Pet Shop',
    descripcion: 'Tienda de mascotas premium en Lima, Perú. Productos de calidad para perros y gatos.',
    horario: 'Lunes a Sábado 9am-7pm, Domingos 10am-5pm',
    direccion: '',
    telefono: '',
    whatsapp: '',
    email: '',
    redes: {
      instagram: '',
      facebook: '',
      youtube: '',
    },
    updatedAt: new Date(),
  },

  policies: {
    envios: {
      Lima: 'Envío gratis en compras mayores a S/150. Delivery same-day si pedís antes de 2pm.',
      Provincia: 'Envío por Olva o Chazki. 2-5 días hábiles según destino. Costo desde S/15.',
      zonas: ['Lima', 'Callao', 'Provincia'],
    },
    pagos: {
      metodos: ['Yape', 'Plin', 'Transferencia BCP', 'Visa/Mastercard', 'Efectivo contraentrega'],
      cuotas: 'Hasta 3 cuotas sin interés con Visa y Mastercard.',
      anticipo: '50% de anticipo para pedidos especiales o personalizados.',
    },
    devoluciones: {
      plazo: '7 días para cambios desde la fecha de compra.',
      condiciones: 'Producto sin usar, con etiqueta original y empaque.',
      proceso: 'Escribí al WhatsApp con una foto del producto y tu número de pedido.',
    },
    garantia: '30 días de garantía en defectos de fabricación.',
    club: 'Club MyP: acumulá puntos con cada compra, descuentos exclusivos y sorpresas en tu cumpleaños.',
    updatedAt: new Date(),
  },

  faq: {
    preguntas: [
      {
        q: '¿Tienen envío a provincia?',
        a: 'Sí, enviamos a todo Perú por Olva o Chazki. El costo varía según destino, desde S/15. El tiempo de entrega es de 2 a 5 días hábiles.',
      },
      {
        q: '¿Puedo pagar con Yape?',
        a: '¡Claro! Aceptamos Yape, Plin, transferencia BCP, tarjetas Visa y Mastercard, y efectivo contraentrega.',
      },
      {
        q: '¿Cuánto tarda el envío en Lima?',
        a: 'Si pedís antes de 2pm, podemos hacer delivery same-day. Si pedís después, llega al siguiente día hábil.',
      },
      {
        q: '¿Cuál es el monto mínimo para envío gratis?',
        a: 'En compras mayores a S/150 el envío en Lima es completamente gratis.',
      },
      {
        q: '¿Puedo devolver un producto?',
        a: 'Sí, tenés 7 días para cambios. El producto debe estar sin usar, con etiqueta original. Escribinos al WhatsApp con foto y número de pedido.',
      },
      {
        q: '¿Cómo funcionan las cuotas?',
        a: 'Ofrecemos hasta 3 cuotas sin interés con tarjetas Visa y Mastercard. Consultá con tu banco por promociones adicionales.',
      },
      {
        q: '¿Qué es el Club Missy & Po?',
        a: 'Es nuestro programa de fidelización. Te registrás gratis, acumulás puntos con cada compra, y canjeás por descuentos y beneficios exclusivos. ¡También tenés sorpresas en tu cumpleaños!',
      },
      {
        q: '¿Cómo me uno al club?',
        a: 'Podés unirte desde nuestro bot. Decime "quiero unirme al club" y te registro al toque. Solo necesito tu nombre, celular y el nombre de tu mascota.',
      },
      {
        q: '¿Tienen tienda física?',
        a: 'Somos una tienda online con delivery en Lima. Si querés conocernos, visitá nosso Instagram para fotos y videos de los productos.',
      },
      {
        q: '¿Venden al por mayor?',
        a: 'Para consultas de mayoreo, escribinos a nuestro WhatsApp o email. Te damos precios especiales para pedidos grandes.',
      },
    ],
    updatedAt: new Date(),
  },

  club: {
    beneficios: 'Acumulá puntos con cada compra. 1 punto por cada S/1. Canjeá 100 puntos por S/10 de descuento.',
    puntos: '1 punto por cada sol gastado. Los puntos no expiran en el primer año.',
    requisitos: 'Solo necesitás tu nombre, celular y nombre de tu mascota. Es gratis.',
    promociones: 'Beneficios exclusivos en cumpleaños, acceso a preventas y descuentos especiales para miembros.',
    updatedAt: new Date(),
  },
};

async function seed() {
  console.log('🌱 Seeding crm_knowledge collection...');

  for (const [docId, data] of Object.entries(SEED_DATA)) {
    await db.collection('crm_knowledge').doc(docId).set(data, { merge: true });
    console.log(`  ✅ ${docId}`);
  }

  console.log('✨ Seed complete.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
