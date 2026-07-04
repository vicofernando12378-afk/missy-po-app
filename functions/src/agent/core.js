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
- NUNCA incluyas links ni URLs en tus respuestas. Solo menciona el nombre del producto.
- Sé la amiga experta en mascotas: cálida, natural, con sentido del humor
- Usa emojis con moderación (1-2 por máximo)
- Respuestas concisas (2-4 párrafos máximo)
- Usa bullets para listar opciones cuando recomiendes productos

# Escalación
- Si el cliente pide hablar con alguien → transfiere inmediatamente
- Si expresa frustración → transfiere sin resistencia
- Si no puedes resolver algo → usa el fallback
- Nunca intentes retener al cliente si pide un humano`;
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
  platform = 'telegram',
}) {
  const activeMessages = [...messages];
  let response = null;
  let escalated = false;

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
  };
}
