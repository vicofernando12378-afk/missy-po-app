import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

import { callLLM } from './llmRouter.js';

// ── TOOLS DEFINITIONS (OPENAI / DEEPSEEK FORMAT) ──────────────────────────────
const CRM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'buscarProducto',
      description: 'Busca productos del catálogo de Missy & Po Pet Shop por nombre, categoría o descripción. Retorna nombre, precio, stock, categorías y URL.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'El nombre, tipo o descripción del producto a buscar (ej: "arnes para perro grande", "comida húmeda gato", "juguete interactivo").',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recomendarProductos',
      description: 'Recomienda productos similares o complementarios basándose en categorías o necesidades del cliente.',
      parameters: {
        type: 'object',
        properties: {
          categorias: {
            type: 'array',
            items: { type: 'string' },
            description: 'Categorías de interés (ej: ["alimentos", "juguetes"]).',
          },
          precioMaximo: {
            type: 'number',
            description: 'Presupuesto máximo en soles.',
          },
          tipo: {
            type: 'string',
            enum: ['similares', 'complementarios', 'ofertas'],
            description: 'Tipo de recomendación.',
          },
        },
        required: ['tipo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultarPedido',
      description: 'Consulta el estado de un pedido utilizando el número de pedido o el email del cliente.',
      parameters: {
        type: 'object',
        properties: {
          pedidoId: {
            type: 'string',
            description: 'El ID o número del pedido (ej. ped-9999). Opcional si se tiene el email.',
          },
          email: {
            type: 'string',
            description: 'El correo electrónico del cliente para buscar sus pedidos. Opcional.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultarEnvios',
      description: 'Consulta opciones de envío, costos y tiempos de entrega para una zona específica.',
      parameters: {
        type: 'object',
        properties: {
          zona: {
            type: 'string',
            description: 'La zona de entrega: "Lima", "Callao" o "Provincia".',
          },
        },
        required: ['zona'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultarMediosPago',
      description: 'Consulta los métodos de pago aceptados por la tienda.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'obtenerInfoNegocio',
      description: 'Consulta información general del negocio: horarios, dirección, teléfono, redes sociales.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'unirseAlClub',
      description: 'Registra al cliente para unirse al Club Missy & Po. Captura nombre, teléfono, email y nombre de mascota.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo del cliente.' },
          phone: { type: 'string', description: 'Número de celular.' },
          email: { type: 'string', description: 'Correo electrónico.' },
          petName: { type: 'string', description: 'Nombre de su mascota.' },
        },
        required: ['name', 'phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crearLead',
      description: 'Registra o actualiza al cliente actual en la base de datos de leads.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo del cliente.' },
          phone: { type: 'string', description: 'Número de celular o teléfono.' },
          email: { type: 'string', description: 'Correo electrónico.' },
          petName: { type: 'string', description: 'Nombre de su mascota.' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'agendarSeguimiento',
      description: 'Crea una tarea pendiente de seguimiento para este lead.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Descripción de la tarea.' },
          dueDateString: {
            type: 'string',
            description: 'Fecha límite en formato AAAA-MM-DD.',
          },
        },
        required: ['title', 'dueDateString'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transferirAHumano',
      description: 'Detiene la conversación con la IA y transfiere al cliente con un agente humano.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'crearPedido',
      description: 'Crea un pedido contra entrega para el cliente. Recolecta: producto, nombre, dirección y teléfono. Retorna un pedidoId que el bot usa para confirmar.',
      parameters: {
        type: 'object',
        properties: {
          productoId: { type: 'string', description: 'ID del producto en myp_productos' },
          productoNombre: { type: 'string', description: 'Nombre del producto' },
          precio: { type: 'number', description: 'Precio unitario en soles' },
          cantidad: { type: 'number', description: 'Cantidad (default 1)', default: 1 },
          clienteNombre: { type: 'string', description: 'Nombre completo del cliente' },
          direccion: { type: 'string', description: 'Dirección de entrega completa' },
          telefono: { type: 'string', description: 'Teléfono de contacto' },
          notaEntrega: { type: 'string', description: 'Nota adicional para la entrega (opcional)' },
        },
        required: ['productoId', 'productoNombre', 'precio', 'clienteNombre', 'direccion', 'telefono'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sendProductPhoto',
      description: 'Envía la foto de un producto al cliente por Telegram. Usa la imagenUrl que viene de buscarProducto.',
      parameters: {
        type: 'object',
        properties: {
          imagenUrl: { type: 'string', description: 'URL de la imagen del producto (viene de buscarProducto)' },
          caption: { type: 'string', description: 'Texto descriptivo breve (nombre + precio)' },
        },
        required: ['imagenUrl', 'caption'],
      },
    },
  },
];

// ── TOOL RESOLVERS ────────────────────────────────────────────────────────────

async function resolverBuscarProducto(args) {
  const db = getFirestore();
  const queryText = (args.query || '').toLowerCase().trim();
  if (!queryText) return JSON.stringify({ error: 'Búsqueda vacía.' });

  try {
    let results = [];

    // 1. Try tags_busqueda (array-contains)
    const tagsSnap = await db.collection('myp_productos')
      .where('activo', '==', true)
      .where('tags_busqueda', 'array-contains-any', queryText.split(/\s+/).filter(w => w.length > 2))
      .limit(5)
      .get();

    if (!tagsSnap.empty) {
      results = tagsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // 2. Fallback: prefix match on nombre
    if (results.length === 0) {
      const nameSnap = await db.collection('myp_productos')
        .where('activo', '==', true)
        .orderBy('nombre')
        .startAt(queryText)
        .endAt(queryText + '\uf8ff')
        .limit(5)
        .get();

      if (!nameSnap.empty) {
        results = nameSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    }

    // 3. Fallback: in-memory filter on larger set
    if (results.length === 0) {
      const allSnap = await db.collection('myp_productos')
        .where('activo', '==', true)
        .limit(50)
        .get();

      results = allSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => {
          const search = queryText;
          return (p.nombre || '').toLowerCase().includes(search)
            || (p.categorias || []).some(c => c.toLowerCase().includes(search))
            || (p.descripcion || '').toLowerCase().includes(search)
            || (p.tags_busqueda || []).some(t => t.toLowerCase().includes(search));
        })
        .slice(0, 5);
    }

    if (results.length === 0) {
      return JSON.stringify({ message: 'No encontramos productos que coincidan con tu búsqueda. ¿Podrías decirme qué tipo de producto buscas?' });
    }

    const formatted = results.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio_oferta || p.precio_regular || p.precio,
      precioRegular: p.precio_oferta ? (p.precio_regular || p.precio) : null,
      enOferta: !!p.precio_oferta,
      stock: p.stock ?? 0,
      categorias: p.categorias || [],
      url: `https://missypoweb.web.app/producto/${p.slug || p.id}`,
      imagenUrl: p.imagenes?.[0] || null,
    }));

    return JSON.stringify({ productos: formatted });
  } catch (err) {
    console.error('Error in buscarProducto:', err);
    return JSON.stringify({ error: 'Error al consultar el catálogo.' });
  }
}

async function resolverRecomendarProductos(args) {
  const db = getFirestore();
  const { categorias = [], precioMaximo, tipo } = args;

  try {
    let q = db.collection('myp_productos').where('activo', '==', true);

    // Filter by categories if provided
    if (categorias.length > 0) {
      q = q.where('categorias', 'array-contains-any', categorias);
    }

    // Sort by destaque or recent
    q = q.orderBy('destacado', 'desc').limit(10);

    const snap = await q.get();
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter by price if specified
    if (precioMaximo) {
      results = results.filter(p => {
        const price = p.precio_oferta || p.precio_regular || p.precio || 0;
        return price <= precioMaximo;
      });
    }

    // Type-based filtering
    if (tipo === 'ofertas') {
      results = results.filter(p => p.precio_oferta);
    }

    if (results.length === 0) {
      return JSON.stringify({ message: 'No encontré productos que coincidan con esos criterios.' });
    }

    const formatted = results.slice(0, 5).map(p => ({
      nombre: p.nombre,
      precio: p.precio_oferta || p.precio_regular || p.precio,
      enOferta: !!p.precio_oferta,
      categorias: p.categorias || [],
      url: `https://missypoweb.web.app/producto/${p.slug || p.id}`,
    }));

    return JSON.stringify({ recomendaciones: formatted });
  } catch (err) {
    console.error('Error in recomendarProductos:', err);
    return JSON.stringify({ error: 'Error al recomendar productos.' });
  }
}

async function resolverConsultarPedido(args) {
  const db = getFirestore();
  const { pedidoId, email } = args;

  try {
    const q = db.collection('myp_pedidos');
    if (pedidoId) {
      const docSnap = await q.doc(pedidoId.trim()).get();
      if (docSnap.exists) {
        const p = docSnap.data();
        return JSON.stringify({
          pedidoId: docSnap.id,
          estado: p.estado || 'Recibido',
          total: p.total,
          items: p.items || [],
          creado_en: p.creado_en?.toDate?.()?.toLocaleDateString('es-PE') || '',
        });
      }
    }

    if (email) {
      const emailSnap = await q
        .where('email', '==', email.trim().toLowerCase())
        .orderBy('creado_en', 'desc')
        .limit(3)
        .get();

      if (!emailSnap.empty) {
        const orders = emailSnap.docs.map(d => {
          const p = d.data();
          return {
            pedidoId: d.id,
            estado: p.estado || 'Recibido',
            total: p.total,
            items: p.items || [],
            creado_en: p.creado_en?.toDate?.()?.toLocaleDateString('es-PE') || '',
          };
        });
        return JSON.stringify({ pedidos: orders });
      }
    }

    return JSON.stringify({ message: 'No se encontró ningún pedido con esos datos.' });
  } catch (err) {
    console.error('Error in consultarPedido:', err);
    return JSON.stringify({ error: 'Error al consultar pedidos.' });
  }
}

async function resolverConsultarEnvios(args) {
  const kb = await import('../lib/knowledge.js').then(m => m.loadKnowledge());
  const envios = kb.policies?.envios || {};

  const zona = (args.zona || '').toLowerCase();
  let response = {};

  if (zona.includes('lima') || zona.includes('callao')) {
    response = {
      zona: 'Lima/Callao',
      info: envios.Lima || 'Envío gratis en compras +S/150. Delivery same-day antes de 2pm.',
      costo: envios.costoLima || 'Gratis en compras +S/150',
      tiempo: envios.tiempoLima || 'Same-day (pedidos antes de 2pm) o siguiente día',
    };
  } else if (zona.includes('provincia')) {
    response = {
      zona: 'Provincia',
      info: envios.Provincia || 'Envío por Olva/Chazki. 2-5 días hábiles.',
      costo: envios.costoProvincia || 'Desde S/15 según destino',
      tiempo: envios.tiempoProvincia || '2-5 días hábiles',
    };
  } else {
    response = {
      opciones: [
        { zona: 'Lima/Callao', resumen: envios.Lima || 'Envío gratis +S/150, same-day' },
        { zona: 'Provincia', resumen: envios.Provincia || 'Olva/Chazki, 2-5 días' },
      ],
    };
  }

  return JSON.stringify(response);
}

async function resolverConsultarMediosPago() {
  const kb = await import('../lib/knowledge.js').then(m => m.loadKnowledge());
  const pagos = kb.policies?.pagos || {};

  return JSON.stringify({
    metodos: pagos.metodos || ['Yape', 'Plin', 'Transferencia BCP', 'Visa/Mastercard', 'Efectivo contraentrega'],
    cuotas: pagos.cuotas || 'Hasta 3 cuotas sin interés con tarjetas Visa/Mastercard',
    anticipo: pagos.anticipo || '',
  });
}

async function resolverObtenerInfoNegocio() {
  const kb = await import('../lib/knowledge.js').then(m => m.loadKnowledge());
  const b = kb.businessInfo || {};

  return JSON.stringify({
    nombre: b.nombreNegocio || 'Missy & Po Pet Shop',
    horario: b.horario || 'Lunes a Sábado 9am-7pm, Domingos 10am-5pm',
    direccion: b.direccion || '',
    telefono: b.telefono || '',
    whatsapp: b.whatsapp || '',
    email: b.email || '',
    redes: b.redes || {},
  });
}

async function resolverUnirseAlClub(args, leadId, platform) {
  const db = getFirestore();
  try {
    const payload = {
      name: args.name.trim(),
      phone: args.phone.trim(),
      updatedAt: new Date(),
    };
    if (args.email) payload.email = args.email.trim().toLowerCase();
    if (args.petName) payload.petName = args.petName.trim();

    if (leadId) {
      // Update existing lead with club interest
      await db.collection('crm_leads').doc(leadId).update({
        ...payload,
        tags: FieldValue.arrayUnion('club-interest'),
        clubStatus: 'interested',
      });
      return JSON.stringify({
        success: true,
        message: `${args.name}, te hemos registrado para el Club Missy & Po. Pronto recibirás beneficios exclusivos.`,
      });
    } else {
      // Create new lead with club tag
      const leadRef = db.collection('crm_leads').doc();
      await leadRef.set({
        ...payload,
        source: platform || 'telegram',
        sourceDetail: {},
        stage: 'nuevo',
        score: 15,
        tags: [`${platform || 'telegram'}-lead`, 'bot-capture', 'club-interest'],
        clubStatus: 'interested',
        segmentIds: [],
        consent: { whatsapp: false, email: false, telegram: true },
        assignedTo: null,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastInteractionAt: new Date(),
      });
      return JSON.stringify({
        success: true,
        message: `${args.name}, te hemos registrado para el Club Missy & Po. Pronto recibirás beneficios exclusivos.`,
        leadId: leadRef.id,
      });
    }
  } catch (err) {
    console.error('Error in unirseAlClub:', err);
    return JSON.stringify({ error: 'Error al registrar en el club.' });
  }
}

async function resolverCrearLead(args, leadId, platform) {
  const db = getFirestore();
  try {
    const payload = {
      name: args.name.trim(),
      updatedAt: new Date(),
    };
    if (args.phone) payload.phone = args.phone.trim();
    if (args.email) payload.email = args.email.trim().toLowerCase();
    if (args.petName) payload.petName = args.petName.trim();

    if (leadId) {
      await db.collection('crm_leads').doc(leadId).update(payload);
      return JSON.stringify({ success: true, message: 'Lead actualizado.', leadId });
    }

    const leadRef = db.collection('crm_leads').doc();
    await leadRef.set({
      ...payload,
      source: platform || 'telegram',
      stage: 'nuevo',
      score: 10,
      tags: [`${platform || 'telegram'}-lead`, 'bot-capture'],
      segmentIds: [],
      consent: { whatsapp: false, email: false, telegram: true },
      assignedTo: null,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastInteractionAt: new Date(),
    });
    return JSON.stringify({ success: true, message: 'Lead registrado.', leadId: leadRef.id });
  } catch (err) {
    console.error('Error in crearLead:', err);
    return JSON.stringify({ error: 'Error al registrar lead.' });
  }
}

async function resolverAgendarSeguimiento(args, leadId) {
  if (!leadId) return JSON.stringify({ error: 'Se requiere registrar un lead primero.' });
  const db = getFirestore();

  try {
    const dueDate = args.dueDateString ? new Date(args.dueDateString) : new Date(Date.now() + 86400000);
    await db.collection('crm_tasks').add({
      leadId,
      title: args.title.trim(),
      dueDate: Timestamp.fromDate(dueDate),
      status: 'pendiente',
      assignedTo: null,
      createdAt: Timestamp.fromDate(new Date()),
    });
    return JSON.stringify({ success: true, message: 'Tarea de seguimiento agendada.' });
  } catch (err) {
    console.error('Error in agendarSeguimiento:', err);
    return JSON.stringify({ error: 'Error al agendar tarea.' });
  }
}

async function resolverTransferirAHumano(leadId, conversationId) {
  const db = getFirestore();
  try {
    const now = new Date();
    if (conversationId) {
      await db.collection('crm_conversations').doc(conversationId).update({
        status: 'esperando_humano',
        lastMessageAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }
    if (leadId) {
      await db.collection('crm_leads').doc(leadId).update({
        tags: FieldValue.arrayUnion('esperando-soporte'),
        updatedAt: Timestamp.fromDate(now),
      });
    }
    return JSON.stringify({ success: true, message: 'Conversación transferida a soporte humano.' });
  } catch (err) {
    console.error('Error in transferirAHumano:', err);
    return JSON.stringify({ error: 'Error al transferir.' });
  }
}

async function resolverCrearPedido(args, leadId, platform, conversationId) {
  const db = getFirestore();
  try {
    const now = new Date();

    // ── CHECK FOR EXISTING PENDING ORDER ──────────────────────────────────
    // If the user already has a pending order, add item to it instead of creating new
    if (leadId) {
      const existingOrders = await db.collection('myp_pedidos')
        .where('leadId', '==', leadId)
        .where('estado', '==', 'recibido')
        .where('confirmado', '==', false)
        .limit(1)
        .get();

      if (!existingOrders.empty) {
        const existingDoc = existingOrders.docs[0];
        const existingPedido = existingDoc.data();
        const existingPedidoId = existingDoc.id;

        // Check if same address
        const sameAddress = existingPedido.envio?.direccion === args.direccion;
        if (!sameAddress) {
          return JSON.stringify({
            success: false,
            needNewPedido: true,
            message: `Ya tienes un pedido pendiente (${existingPedidoId}) con dirección: ${existingPedido.envio?.direccion}. Si quieres enviar a otra dirección, necesitamos crear un pedido nuevo. ¿Qué prefieres?`,
          });
        }

        // Add new item to existing order
        const newItem = {
          productoId: args.productoId,
          nombre: args.productoNombre,
          precio_unitario: Math.round(args.precio * 100),
          cantidad: args.cantidad || 1,
        };

        const updatedItems = [...(existingPedido.items || []), newItem];
        const newTotal = updatedItems.reduce((sum, item) => sum + ((item.precio_unitario || item.precio || 0) * item.cantidad), 0);

        await existingDoc.ref.update({
          items: updatedItems,
          total_final: newTotal * 100,
          actualizado_en: Timestamp.fromDate(now),
        });

        // Notify admin
        await db.collection('crm_notifications').add({
          type: 'order_modified',
          channel: 'telegram',
          pedidoId: existingPedidoId,
          chatId: conversationId?.replace('telegram_', ''),
          leadName: args.clienteNombre,
          message: `Item agregado: ${args.productoNombre} x${args.cantidad || 1}`,
          read: false,
          createdAt: Timestamp.fromDate(now),
        });

        return JSON.stringify({
          success: true,
          pedidoId: existingPedidoId,
          agregado: true,
          message: `Agregué ${args.productoNombre} a tu pedido existente (${existingPedidoId}). Total actualizado: S/.${newTotal}.`,
        });
      }
    }

    // ── CREATE NEW ORDER ──────────────────────────────────────────────────
    const pedidoId = `ped-${Date.now()}`;

    const pedido = {
      pedidoId,
      estado: 'recibido',
      confirmado: false,
      canal: platform || 'telegram',
      leadId: leadId || null,
      cliente: {
        nombre: args.clienteNombre,
        celular: args.telefono,
        email: null,
        documento_numero: null,
      },
      envio: {
        nombre: args.clienteNombre,
        direccion: args.direccion,
        telefono: args.telefono,
        notaEntrega: args.notaEntrega || null,
      },
      items: [{
        productoId: args.productoId,
        nombre: args.productoNombre,
        precio_unitario: Math.round(args.precio * 100),
        cantidad: args.cantidad || 1,
      }],
      pago: {
        metodo: 'contra_entrega',
        estado: 'pendiente',
      },
      total_final: args.precio * (args.cantidad || 1) * 100,
      creado_en: Timestamp.fromDate(now),
      notificadoAdmin: false,
    };

    await db.collection('myp_pedidos').doc(pedidoId).set(pedido);

    // Update lead with purchase intent
    if (leadId) {
      await db.collection('crm_leads').doc(leadId).update({
        stage: 'calificado',
        tags: FieldValue.arrayUnion('compra-interes'),
        updatedAt: Timestamp.fromDate(now),
      });
    }

    // Notify admin
    await db.collection('crm_notifications').add({
      type: 'new_order',
      channel: 'telegram',
      pedidoId,
      chatId: conversationId?.replace('telegram_', ''),
      leadName: args.clienteNombre,
      total: args.precio * (args.cantidad || 1),
      read: false,
      createdAt: Timestamp.fromDate(now),
    });

    // Also notify admin via Telegram if configured
    try {
      const { getApiKeys } = await import('../lib/config.js');
      const keys = await getApiKeys();
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
      if (adminChatId && keys.TELEGRAM_BOT_TOKEN) {
        const axios = (await import('axios')).default;
        const adminMsg = [
          '🛒 *Nuevo pedido recibido*',
          `*Pedido:* ${pedidoId}`,
          `*Cliente:* ${args.clienteNombre}`,
          `*Producto:* ${args.productoNombre} x${args.cantidad || 1}`,
          `*Total:* S/.${args.precio * (args.cantidad || 1)}`,
          `*Dirección:* ${args.direccion}`,
          `*Teléfono:* ${args.telefono}`,
          '*Pago:* Contra entrega',
          '',
          'Revisa el panel de administración para gestionar.',
        ].join('\n');

        await axios.post(`https://api.telegram.org/bot${keys.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: adminChatId,
          text: adminMsg,
          parse_mode: 'Markdown',
        });
      }
    } catch (notifyErr) {
      console.error('Error notifying admin via Telegram:', notifyErr.message);
    }

    return JSON.stringify({
      success: true,
      pedidoId,
      message: `Pedido ${pedidoId} creado exitosamente. Total: S/.${args.precio * (args.cantidad || 1)}. Envía el resumen al cliente con el botón de confirmar.`,
    });
  } catch (err) {
    console.error('Error in crearPedido:', err);
    return JSON.stringify({ error: 'Error al crear pedido.' });
  }
}

async function resolverSendProductPhoto(args, chatId) {
  if (!chatId) return JSON.stringify({ error: 'No chatId disponible.' });
  if (!args.imagenUrl) return JSON.stringify({ error: 'No se proporcionó imagenUrl.' });

  try {
    const axios = (await import('axios')).default;
    const { getApiKeys } = await import('../lib/config.js');
    const keys = await getApiKeys();
    const token = keys.TELEGRAM_BOT_TOKEN;
    if (!token) return JSON.stringify({ error: 'Token no disponible.' });

    await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
      chat_id: chatId,
      photo: args.imagenUrl,
      caption: (args.caption || '').substring(0, 1024),
    });

    return JSON.stringify({ success: true, message: 'Foto enviada.' });
  } catch (err) {
    console.error('Error sending product photo:', err.message);
    return JSON.stringify({ error: 'Error al enviar foto.' });
  }
}

// ── TOOL DISPATCH ─────────────────────────────────────────────────────────────

const TOOL_RESOLVERS = {
  buscarProducto: (args) => resolverBuscarProducto(args),
  recomendarProductos: (args) => resolverRecomendarProductos(args),
  consultarPedido: (args) => resolverConsultarPedido(args),
  consultarEnvios: (args) => resolverConsultarEnvios(args),
  consultarMediosPago: () => resolverConsultarMediosPago(),
  obtenerInfoNegocio: () => resolverObtenerInfoNegocio(),
  unirseAlClub: (args, leadId, platform) => resolverUnirseAlClub(args, leadId, platform),
  crearLead: (args, leadId, platform) => resolverCrearLead(args, leadId, platform),
  agendarSeguimiento: (args, leadId) => resolverAgendarSeguimiento(args, leadId),
  transferirAHumano: () => resolverTransferirAHumano(),
  crearPedido: (args, leadId, platform, conversationId) => resolverCrearPedido(args, leadId, platform, conversationId),
  sendProductPhoto: (args, leadId, platform, conversationId, chatId) => resolverSendProductPhoto(args, chatId),
};

// ── ENHANCED SYSTEM PROMPT BUILDER ───────────────────────────────────────────

/**
 * Builds an enhanced system prompt with knowledge context and personality.
 */
export function buildSystemPrompt({ botConfig, knowledgeContext }) {
  const personality = botConfig?.personality || {};
  const name = personality.name || 'Missy';
  const description = personality.description || 'Asistente de ventas amigable y experta en mascotas.';
  const tone = personality.tone || 'cálido-profesional';
  const rules = personality.rules?.length > 0
    ? personality.rules.map(r => `- ${r}`).join('\n')
    : '- Sé amigable pero profesional\n- Recomienda productos cuando sea natural\n- Nunca inventes precios o disponibilidad';

  const greeting = personality.greeting || `¡Hola! Soy ${name}, tu asesora de mascotas de Missy & Po Pet Shop. ¿En qué puedo ayudarte hoy?`;
  const fallback = personality.fallback || 'Déjame consultar con el equipo para darte la mejor respuesta.';

  return `# Identidad
Eres ${name}, asistente de ventas de Missy & Po Pet Shop.
Tono: ${tone}
Descripción: ${description}

# Personalidad
${rules}

# Saludo inicial
Cuando el usuario inicie conversación por primera vez, saluda con: "${greeting}"

# Fallback
Cuando no puedas resolver algo: "${fallback}"

${knowledgeContext}

# Reglas de Conducta
- REGLA #1: El catálogo de productos está arriba. Solo puedes recomendar productos que aparezcan ahí. NUNCA inventes nombres, precios ni categorías.
- Para preguntas absurdas (helicopteros, Lamborghini, etc.) — responde con humor y personalidad, como lo haría una amiga. Ejemplo: "Jajaja me encantaría, pero no tenemos eso! Y si tu mascota quiere algo divertido, tenemos..."
- Si el cliente pregunta por algo que no existe en el catálogo, di "no tenemos eso" y recomienda 2-3 productos similares del listado.
- NUNCA uses markdown: no **, no *, no [texto](url). Solo texto plano.
- Sé la amiga experta en mascotas: cálida, natural, con sentido del humor
- Usa emojis con moderación (1-2 por máximo)
- Respuestas concisas (2-4 párrafos máximo)
- Usa bullets para listar opciones cuando recomiendes productos

# Fotos y Links de Productos
- Cuando recomiendes un producto, USA la herramienta sendProductPhoto para enviar la foto junto con el nombre y precio
- SIEMPRE incluye el link a la website para que el cliente pueda ver detalles y comprar: https://missypoweb.web.app/producto/{slug}
- El link debe ser clickable y natural. Ejemplo: "Mira todos los detalles aquí: https://missypoweb.web.app/producto/casaca-po"
- Si el cliente pide fotos, busca el producto con buscarProducto y luego envía la foto con sendProductPhoto
- El canal más práctico para que el cliente compre es la website — siempre ofrece el link

# Escalación
- Si el cliente pide hablar con alguien → transfiere inmediatamente
- Si expresa frustración → transfiere sin resistencia
- Si no puedes resolver algo → usa el fallback
- Nunca intentes retener al cliente si pide un humano

# Flujo de Venta
- Cuando un cliente muestre interés en un producto (pregunte por precio, disponibilidad, o diga "quiero esto"), preguntar: "¿Quieres que te lo reserve?"
- Si dice que sí → iniciar proceso de pedido contra entrega usando la herramienta crearPedido
- SOLO puedes ofrecer CONTRA ENTREGA como método de pago
- Para otros métodos (Yape, Plin, transferencia, tarjeta) → responder: "Para otros métodos de pago, te comunico con un asesor que te puede ayudar a coordinar"
- Recolectar los datos del cliente paso a paso: nombre, dirección, teléfono
- Si el cliente no tiene dirección → pedir nombre y teléfono para que un asesor lo contacte
- Mostrar resumen ANTES de confirmar: producto, precio, dirección, método de pago
- Si el cliente dice "no", "después", "luego" → no insistir, responder: "Perfecto! Te espero. Si necesitas algo, aquí estoy 🐾"
- Si el cliente pregunta por algo caro (mayor a S/.200) → sugerir hablar con asesor para coordinar
- Si el cliente ya tiene un pedido pendiente y quiere otro producto → crearPedido automáticamente agrega el item al pedido existente
- Si la dirección es diferente a la del pedido existente → informar al cliente y preguntar si quiere crear un pedido nuevo o cambiar la dirección`;
}

// ── MAIN ORCHESTRATOR ─────────────────────────────────────────────────────────

/**
 * Runs the AI bot completion cycle with tool calling (max 3 iterations).
 */
export async function runAgentCycle({
  systemPrompt,
  messages,
  leadId,
  conversationId,
  chatId,
  platform = 'telegram',
}) {
  const activeMessages = [...messages];
  let response = null;
  let escalated = false;
  let pedidoId = null;

  for (let i = 0; i < 3; i++) {
    response = await callLLM({
      systemPrompt,
      messages: activeMessages,
      tools: CRM_TOOLS,
    });

    if (!response.toolCalls || response.toolCalls.length === 0) {
      return { replyText: response.text, escalated };
    }

    console.log(`🤖 Bot requested ${response.toolCalls.length} tool calls (iteration ${i + 1})`);

    activeMessages.push({
      role: 'assistant',
      content: response.text || null,
      tool_calls: response.toolCalls,
    });

    for (const toolCall of response.toolCalls) {
      const { name, arguments: argsString } = toolCall.function;
      let args = {};
      try {
        args = JSON.parse(argsString);
      } catch {
        console.warn(`⚠️ Failed to parse tool arguments: ${argsString}`);
      }

      const resolver = TOOL_RESOLVERS[name];
      let resultString;

      if (resolver) {
        if (name === 'crearLead' || name === 'unirseAlClub') {
          resultString = await resolver(args, leadId, platform);
        } else if (name === 'agendarSeguimiento') {
          resultString = await resolver(args, leadId);
        } else if (name === 'transferirAHumano') {
          resultString = await resolver(args, leadId, conversationId);
          escalated = true;
        } else if (name === 'crearPedido') {
          resultString = await resolver(args, leadId, platform, conversationId);
          try {
            const parsed = JSON.parse(resultString);
            if (parsed.pedidoId) pedidoId = parsed.pedidoId;
          } catch { /* ignore */ }
        } else if (name === 'sendProductPhoto') {
          resultString = await resolver(args, leadId, platform, conversationId, chatId);
        } else {
          resultString = await resolver(args);
        }

        // Capture leadId from crearLead/unirseAlClub
        if (name === 'crearLead' || name === 'unirseAlClub') {
          try {
            const parsed = JSON.parse(resultString);
            if (parsed.leadId) leadId = parsed.leadId;
          } catch { /* ignore */ }
        }
      } else {
        resultString = JSON.stringify({ error: `Tool ${name} not found.` });
      }

      activeMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name,
        content: resultString,
      });
    }
  }

  return {
    replyText: response?.text || '¿En qué puedo ayudarte con nuestros productos? Puedes escribir lo que buscas y lo encuentro para ti.',
    escalated: false,
    pedidoId,
  };
}
