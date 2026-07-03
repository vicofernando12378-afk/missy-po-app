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
    envios: `POLÍTICA DE ENVÍOS — Missy & Po Pet Shop

DELIVERY REGULAR (Arequipa):
- Entrega al día siguiente de la compra
- Horario: 7:00 am a 8:00 pm (Lunes a Sábado)
- Compras mayores a S/. 45.00: ENVÍO GRATIS
- Compras menores a S/. 45.00: costo S/. 6.00
- Zonas periféricas y balnearios: S/. 7.00 (gratis por compras > S/. 100.00)

DELIVERY EXPRESS (Arequipa):
- Entrega el mismo día
- Rangos: 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00, 18:00-20:00
- Costo: S/. 10.00
- Compra mínima: S/. 45.00

ENVIOS A PROVINCIAS (Courier Shalom):
- Envíos a todo el Perú
- Zonas seleccionadas de Lima: entrega al día siguiente (comprando hasta 7:45 pm)
- Provincias de Arequipa: entrega martes y jueves (comprando hasta 4:59 pm)

ENTREGAS FALLIDAS:
- Reprogramación: S/. 6.00 (regular), S/. 10.00 (express), S/. 7.00 (periféricas)
- Tercera reprogramación: mismo monto
- No entrega definitiva: devolución del dinero por atención al cliente

RETIRO EN TIENDA:
- Según stock disponible
- Producto recogible hasta 48 horas tras llegada a agencia de courier`,

    pagos: `MEDIOS DE PAGO ACEPTADOS:
- Yape
- Plin
- Mercado Pago (tarjeta de crédito/débito)
- Tarjetas de crédito
- Contra reembolso disponible en todo el Perú

COMPROBANTES DE PAGO:
- Boletas de venta y facturas electrónicas
- Notas de crédito vinculadas
- No se permite cambio de boleta por factura después de la compra
- Documentos disponibles en el sitio web y por correo electrónico`,

    devoluciones: `POLÍTICA DE DEVOLUCIONES — Missy & Po

ALIMENTOS:
- Plazo máximo: 2 días calendario
- Producto debe estar sellado, completo y sin señales de uso

ACCESORIOS E HIGIENE:
- Plazo máximo: 3 días calendario
- Empaque original, con etiquetas y sin señales de uso

EN TODOS LOS CASOS:
- Se requiere boleta de compra
- Plazo de reembolso: 10 días hábiles tras confirmación de recepción
- Devolución en el mismo local de compra

DEVOLUCIÓN POR DELIVERY:
- Costo de envío de retorno asumido por cliente (cambio de opinión/error propio)
- Error de empresa: envío de retorno gratuito
- Gestión por el mismo canal de compra`,

    garantia: `GARANTÍA: Los productos se sujetan a las condiciones de despacho y entrega elegidas por el usuario. La información del lugar de envío es de responsabilidad del usuario. Los plazos se cuentan desde que la empresa ha validado la solicitud de compra y el medio de pago utilizado (días hábiles).`,

    club: `CLUB DE BENEFICIOS MISSY & PO:

BENEFICIOS:
- Missy & Po Puntos: Acumula puntos en cada compra, canjéalos por descuentos o productos gratis
- Descuentos Exclusivos: Promociones anticipadas y ofertas especiales para miembros
- Regalo de Cumpleaños: Sorpresa exclusiva el mes del cumpleaños de tu mascota
- Acceso Anticipado: Sé el primero en conocer nuevos productos y lanzamientos
- Contenido Missy & Po TV: Videos exclusivos, tutoriales y tips de cuidado
- Atención Prioritaria: Consultas y pedidos atendidos con prioridad vía WhatsApp VIP

CÓMO FUNCIONA:
1. Regístrate: Crea tu cuenta o escríbenos por WhatsApp
2. Compra y acumula: Cada compra suma puntos automáticamente
3. Disfruta: Canjea puntos, activa seguros y accede a beneficios exclusivos

SEGURO PARA MASCOTAS (PRÓXIMAMENTE):
- Plan Básico: Desde S/ 29/mes — Consultas y vacunas preventivas
- Plan Completo: Desde S/ 59/mes — + emergencias y hospitalización
- Plan Premium: Desde S/ 99/mes — Cobertura total incluyendo cirugías
- Descuento Club: -15% exclusivo en todos los planes`,
  },

  faq: {
    preguntas: [
      { pregunta: '¿Cuánto cuesta el envío?', respuesta: 'En Arequipa: gratis por compras mayores a S/. 45.00 (regular). Express cuesta S/. 10.00. Zonas periféricas S/. 7.00 (gratis > S/. 100). Para provincias usamos Courier Shalom con tarifas variables.' },
      { pregunta: '¿Hacen envíos a todo el Perú?', respuesta: '¡Sí! Enviamos a todo el Perú con Courier Shalom. En Lima también contamos con Olva Express para delivery express.' },
      { pregunta: '¿Cuánto tarda en llegar mi pedido?', respuesta: 'Delivery regular Arequipa: al día siguiente. Express: el mismo día. Provincias de Arequipa: martes y jueves. Lima: al día siguiente comprando hasta las 7:45 pm.' },
      { pregunta: '¿Cuáles son los medios de pago?', respuesta: 'Aceptamos Yape, Plin, Mercado Pago, tarjetas de crédito y contra reembolso en todo el Perú.' },
      { pregunta: '¿Puedo pagar contra reembolso?', respuesta: '¡Sí! El contra reembolso está disponible en todo el Perú. Pagas cuando recibes tu pedido.' },
      { pregunta: '¿Cómo puedo devolver un producto?', respuesta: 'Alimentos: 2 días calendario (sellado, completo). Accesorios e higiene: 3 días (empaque original, con etiquetas). Siempre con boleta. Reembolso en 10 días hábiles.' },
      { pregunta: '¿Tienen tienda física?', respuesta: 'Sí, estamos en Arequipa, Perú. También puedes comprar online en missypoweb.web.app y te lo enviamos.' },
      { pregunta: '¿Cómo me uno al Club Missy & Po?', respuesta: 'Es gratis. Regístrate en nuestra tienda o escríbenos por WhatsApp. Empiezas a acumular puntos con cada compra.' },
      { pregunta: '¿Qué beneficios tiene el Club?', respuesta: 'Puntos canjeables por descuentos, ofertas exclusivas, regalo de cumpleaños, acceso anticipado a nuevos productos, contenido exclusivo en Missy & Po TV y atención prioritaria por WhatsApp VIP.' },
      { pregunta: '¿Tienen seguro para mascotas?', respuesta: 'Próximamente. Estamos cerrando alianzas con aseguradoras peruanas. Planes desde S/ 29/mes con descuento adicional para miembros del Club.' },
    ],
  },

  club: {
    beneficios: [
      'Missy & Po Puntos — Acumula y canjea por descuentos o productos gratis',
      'Descuentos Exclusivos — Promociones anticipadas y ofertas especiales',
      'Regalo de Cumpleaños — Sorpresa el mes del cumpleaños de tu mascota',
      'Acceso Anticipado — Primeros en conocer nuevos productos',
      'Contenido Missy & Po TV — Videos exclusivos y tips de cuidado',
      'Atención Prioritaria — Canal directo WhatsApp VIP',
    ],
    puntos: 'Cada compra acumula Missy & Po Puntos automáticamente. Los puntos se canjean por descuentos o productos gratis.',
    requisitos: 'Regístrate gratis en la tienda o por WhatsApp. No hay compra mínima para unirse.',
    promociones: [
      'Seguro para mascotas con -15% descuento exclusivo (próximamente)',
      'Acceso anticipado a lanzamientos',
      'Ofertas flash solo para miembros',
    ],
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
