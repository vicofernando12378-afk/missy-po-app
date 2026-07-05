/**
 * seedKnowledge.js — Seeds crm_knowledge collection with real data from the website.
 * Run: node --experimental-modules seedKnowledge.js
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });

const db = getFirestore();

const SEED_DATA = {
  business_info: {
    nombreNegocio: 'Missy & Po Pet Shop',
    descripcion: 'Tu tienda online de confianza para los engreídos de la familia. Accesorios, ropa y juguetes de calidad para mascotas. Envíos a todo el Perú.',
    horario: 'Lunes a Sábado de 8:00 am a 9:00 pm',
    direccion: 'Arequipa, Perú',
    telefono: '+51 999 999 999',
    whatsapp: '51999999999',
    email: 'victorchavezd@gmail.com',
    redes: {
      facebook: 'https://www.facebook.com/missynpopetshop',
      instagram: 'https://www.instagram.com/missynpo.petshop',
      tiktok: 'https://www.tiktok.com/@missynpo',
    },
    categorias: ['ropa', 'accesorios', 'collares', 'correas', 'juguetes', 'higiene', 'alimentos'],
    envios: {
      courier_shalom: 'Envíos a todo el Perú con Courier Shalom',
      olva_express: 'Olva Express — Delivery express en Lima',
      delivery_regular_arequipa: 'Entrega al día siguiente. Compras mayores a S/. 45.00 sin costo. Menores a S/. 45.00 = S/. 6.00',
      delivery_express_arequipa: 'Entrega el mismo día. Costo S/. 10.00. Compra mínima S/. 45.00',
      zonas_perifericas: 'S/. 7.00, gratis por compras mayores a S/. 100.00',
      envio_preferencial: 'Compras desde S/. 50 obtienen envío preferencial',
    },
    pagos: ['Yape', 'Plin', 'Mercado Pago', 'Tarjetas de crédito', 'Contra reembolso'],
    updatedAt: new Date(),
  },

  policies: {
    envios: {
      Lima: 'Delivery Regular: Al día siguiente de la compra, costo S/. 6.00 (gratis en Arequipa/Lima por compras > S/. 45.00). Zonas periféricas: S/. 7.00. Delivery Express: Mismo día, costo S/. 10.00, compra mínima S/. 45.00.',
      Provincia: 'Envíos a todo el Perú vía Courier Shalom con tarifas variables. Provincias de Arequipa: entrega martes y jueves comprando hasta las 4:59 pm.',
      zonas: ['Arequipa', 'Lima', 'Provincia'],
    },
    pagos: {
      metodos: ['Yape', 'Plin', 'Mercado Pago', 'Tarjetas de crédito', 'Contra reembolso'],
      cuotas: 'Hasta 3 cuotas sin intereses según banco emisor.',
      anticipo: 'No requiere anticipo. Delivery contra reembolso disponible en todo el Perú.',
    },
    devoluciones: {
      plazo: 'Alimentos: 2 días calendario. Accesorios e Higiene: 3 días calendario.',
      condiciones: 'Alimentos: sellado, completo y sin uso. Accesorios e Higiene: empaque original, con etiquetas y sin uso. Requerida boleta de compra.',
      proceso: 'Toda devolución se gestiona por el mismo canal de compra. Plazo de reembolso de 10 días hábiles tras recibir e inspeccionar el producto.',
    },
    garantia: 'Los productos se sujetan a las condiciones de despacho y entrega elegidas por el usuario. La información del lugar de envío es de responsabilidad del usuario.',
    club: 'Club de Beneficios Missy & Po: acumulador de puntos en cada compra, descuentos exclusivos en preventas, sorpresas en el mes de cumpleaños de tu mascota, contenido Missy & Po TV, atención prioritaria vía WhatsApp VIP y próximo seguro para mascotas.',
  },

  faq: {
    preguntas: [
      { q: '¿Cuánto cuesta el envío?', a: 'En Arequipa: gratis por compras mayores a S/. 45.00 (regular). Express cuesta S/. 10.00. Zonas periféricas S/. 7.00 (gratis > S/. 100). Para provincias usamos Courier Shalom con tarifas variables.', pregunta: '¿Cuánto cuesta el envío?', respuesta: 'En Arequipa: gratis por compras mayores a S/. 45.00 (regular). Express cuesta S/. 10.00. Zonas periféricas S/. 7.00 (gratis > S/. 100). Para provincias usamos Courier Shalom con tarifas variables.' },
      { q: '¿Hacen envíos a todo el Perú?', a: '¡Sí! Enviamos a todo el Perú con Courier Shalom. En Lima también contamos con Olva Express para delivery express.', pregunta: '¿Hacen envíos a todo el Perú?', respuesta: '¡Sí! Enviamos a todo el Perú con Courier Shalom. En Lima también contamos con Olva Express para delivery express.' },
      { q: '¿Cuánto tarda en llegar mi pedido?', a: 'Delivery regular Arequipa: al día siguiente. Express: el mismo día. Provincias de Arequipa: martes y jueves. Lima: al día siguiente comprando hasta las 7:45 pm.', pregunta: '¿Cuánto tarda en llegar mi pedido?', respuesta: 'Delivery regular Arequipa: al día siguiente. Express: el mismo día. Provincias de Arequipa: martes y jueves. Lima: al día siguiente comprando hasta las 7:45 pm.' },
      { q: '¿Cuáles son los medios de pago?', a: 'Aceptamos Yape, Plin, Mercado Pago, tarjetas de crédito y contra reembolso en todo el Perú.', pregunta: '¿Cuáles son los medios de pago?', respuesta: 'Aceptamos Yape, Plin, Mercado Pago, tarjetas de crédito y contra reembolso en todo el Perú.' },
      { q: '¿Puedo pagar contra reembolso?', a: '¡Sí! El contra reembolso está disponible en todo el Perú. Pagas cuando recibes tu pedido.', pregunta: '¿Puedo pagar contra reembolso?', respuesta: '¡Sí! El contra reembolso está disponible en todo el Perú. Pagas cuando recibes tu pedido.' },
      { q: '¿Cómo puedo devolver un producto?', a: 'Alimentos: 2 días calendario (sellado, completo). Accesorios e higiene: 3 días (empaque original, con etiquetas). Siempre con boleta. Reembolso en 10 días hábiles.', pregunta: '¿Cómo puedo devolver un producto?', respuesta: 'Alimentos: 2 días calendario (sellado, completo). Accesorios e higiene: 3 días (empaque original, con etiquetas). Siempre con boleta. Reembolso en 10 días hábiles.' },
      { q: '¿Tienen tienda física?', a: 'Somos una tienda online con delivery en Lima y oficina de distribución en Arequipa. Puedes comprar online en missypoweb.web.app y te lo enviamos.', pregunta: '¿Tienen tienda física?', respuesta: 'Somos una tienda online con delivery en Lima y oficina de distribución en Arequipa. Puedes comprar online en missypoweb.web.app y te lo enviamos.' },
      { q: '¿Cómo me uno al Club Missy & Po?', a: 'Es gratis. Regístrate en nuestra tienda o escríbenos por WhatsApp. Empiezas a acumular puntos con cada compra.', pregunta: '¿Cómo me uno al Club Missy & Po?', respuesta: 'Es gratis. Regístrate en nuestra tienda o escríbenos por WhatsApp. Empiezas a acumular puntos con cada compra.' },
      { q: '¿Qué beneficios tiene el Club?', a: 'Puntos canjeables por descuentos, ofertas exclusivas, regalo de cumpleaños, acceso anticipado a nuevos productos, contenido exclusivo en Missy & Po TV y atención prioritaria por WhatsApp VIP.', pregunta: '¿Qué beneficios tiene el Club?', respuesta: 'Puntos canjeables por descuentos, ofertas exclusivas, regalo de cumpleaños, acceso anticipado a nuevos productos, contenido exclusivo en Missy & Po TV y atención prioritaria por WhatsApp VIP.' },
      { q: '¿Tienen seguro para mascotas?', a: 'Próximamente. Estamos cerrando alianzas con aseguradoras peruanas. Planes desde S/ 29/mes con descuento adicional para miembros del Club.', pregunta: '¿Tienen seguro para mascotas?', respuesta: 'Próximamente. Estamos cerrando alianzas con aseguradoras peruanas. Planes desde S/ 29/mes con descuento adicional para miembros del Club.' },
    ],
  },

  club: {
    beneficios: 'Puntos canjeables por descuentos o productos gratis, promociones anticipadas y ofertas exclusivas, regalo sorpresa en el mes de cumpleaños de tu mascota, contenido Missy & Po TV, y atención prioritaria WhatsApp VIP.',
    puntos: 'Cada compra acumula Missy & Po Puntos automáticamente. Los puntos se canjean por descuentos o productos gratis en la tienda.',
    requisitos: 'Regístrate de manera gratuita en la tienda o a través de WhatsApp. No hay compra mínima para unirse.',
    promociones: 'Seguro para mascotas con -15% de descuento exclusivo (próximamente), acceso anticipado a preventas y lanzamientos, y ofertas flash para miembros.',
    updatedAt: new Date(),
  },
};

async function seed() {
  console.log('Seeding crm_knowledge...');
  for (const [docId, data] of Object.entries(SEED_DATA)) {
    await db.collection('crm_knowledge').doc(docId).set(data, { merge: true });
    console.log(`  ✓ ${docId}`);
  }
  console.log('Done.');
}

seed().catch(console.error);
