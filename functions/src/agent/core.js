import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

import { callLLM } from './llmRouter.js';

// ── TOOLS DEFINITIONS (OPENAI / DEEPSEEK FORMAT) ──────────────────────────────
const CRM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'buscarProducto',
      description: 'Busca productos del catálogo de Missy & Po Pet Shop por nombre o categoría.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'El nombre o tipo de producto a buscar (ej: comida para perros, juguetes, shampoo).',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultarPedido',
      description: 'Consulta el estado de un pedido en la tienda utilizando el número de pedido o el email del cliente.',
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
      name: 'crearLead',
      description: 'Registra o actualiza al cliente actual en la base de datos de leads.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre completo del cliente.' },
          phone: { type: 'string', description: 'Número de celular o teléfono.' },
          email: { type: 'string', description: 'Correo electrónico.' },
          petName: { type: 'string', description: 'Nombre de su mascota (perro, gato, etc).' },
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
          title: { type: 'string', description: 'Descripción de la tarea (ej: Llamar para cotizar alimento).' },
          dueDateString: {
            type: 'string',
            description: 'Fecha límite de la tarea en formato AAAA-MM-DD.',
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
      description: 'Detiene la conversación con la IA y transfiere al cliente con un agente de soporte humano real.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// ── TOOLS RESOLVERS (FIRESTORE READ/WRITE) ────────────────────────────────────

async function resolverBuscarProducto(args) {
  const db = getFirestore();
  const queryText = (args.query || '').toLowerCase().trim();
  if (!queryText) return JSON.stringify({ error: 'Búsqueda vacía.' });

  try {
    // Basic prefix matching or categories in myp_productos
    const snap = await db.collection('myp_productos')
      .limit(10)
      .get();

    const allProd = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter in-memory for basic search
    const results = allProd.filter(p =>
      (p.nombre || '').toLowerCase().includes(queryText) ||
      (p.categoria || '').toLowerCase().includes(queryText) ||
      (p.descripcion || '').toLowerCase().includes(queryText),
    );

    if (results.length === 0) {
      return JSON.stringify({ message: 'No encontramos productos que coincidan con tu búsqueda.' });
    }

    const formatted = results.map(p => ({
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock ?? 0,
      url: `https://missypo.com/producto/${p.id}`,
    }));

    return JSON.stringify({ productos: formatted });
  } catch (err) {
    console.error('Error in buscarProducto resolver:', err);
    return JSON.stringify({ error: 'Error interno del servidor al consultar el catálogo.' });
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
          creado_en: p.creado_en?.toDate().toLocaleDateString('es-PE'),
        });
      }
    }

    if (email) {
      const emailSnap = await q
        .where('email', '==', email.trim().toLowerCase())
        .orderBy('creado_en', 'desc')
        .limit(1)
        .get();

      if (!emailSnap.empty) {
        const p = emailSnap.docs[0].data();
        return JSON.stringify({
          pedidoId: emailSnap.docs[0].id,
          estado: p.estado || 'Recibido',
          total: p.total,
          items: p.items || [],
          creado_en: p.creado_en?.toDate().toLocaleDateString('es-PE'),
        });
      }
    }

    return JSON.stringify({ message: 'No se encontró ningún pedido con esos datos.' });
  } catch (err) {
    console.error('Error in consultarPedido resolver:', err);
    return JSON.stringify({ error: 'Error al consultar estado de pedidos.' });
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
      // Update existing lead
      await db.collection('crm_leads').doc(leadId).update(payload);
      return JSON.stringify({ success: true, message: 'Lead actualizado correctamente.', leadId });
    } else {
      // Create new lead
      const leadRef = db.collection('crm_leads').doc();
      const newLead = {
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
        lastInteractionAt: new Date(),
      };
      await leadRef.set(newLead);
      return JSON.stringify({ success: true, message: 'Nuevo lead registrado.', leadId: leadRef.id });
    }
  } catch (err) {
    console.error('Error in crearLead resolver:', err);
    return JSON.stringify({ error: 'Error al registrar ficha de lead.' });
  }
}

async function resolverAgendarSeguimiento(args, leadId) {
  if (!leadId) return JSON.stringify({ error: 'Se requiere registrar un lead primero.' });
  const db = getFirestore();

  try {
    const dueDate = args.dueDateString ? new Date(args.dueDateString) : new Date(Date.now() + 86400000); // 1 day default
    const taskRef = db.collection('crm_tasks').doc();
    await taskRef.set({
      leadId,
      title: args.title.trim(),
      dueDate: Timestamp.fromDate(dueDate),
      status: 'pendiente',
      assignedTo: null,
      createdAt: Timestamp.fromDate(new Date()),
    });

    return JSON.stringify({ success: true, message: 'Tarea de seguimiento agendada.' });
  } catch (err) {
    console.error('Error in agendarSeguimiento resolver:', err);
    return JSON.stringify({ error: 'Error al agendar tarea de seguimiento.' });
  }
}

async function resolverTransferirAHumano(leadId, conversationId) {
  const db = getFirestore();
  try {
    const now = new Date();
    // 1. Update conversation status to awaiting human attention
    if (conversationId) {
      await db.collection('crm_conversations').doc(conversationId).update({
        status: 'esperando_humano',
        lastMessageAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }

    // 2. Add flag or tag to lead
    if (leadId) {
      await db.collection('crm_leads').doc(leadId).update({
        tags: FieldValue.arrayUnion('esperando-soporte'),
        updatedAt: Timestamp.fromDate(now),
      });
    }

    return JSON.stringify({ success: true, message: 'Conversación transferida a soporte humano.' });
  } catch (err) {
    console.error('Error in transferirAHumano resolver:', err);
    return JSON.stringify({ error: 'Error al transferir a un agente humano.' });
  }
}

// ── MAIN ORCHESTRATOR / CONVERSATION LOOP ─────────────────────────────────────

/**
 * Runs the AI bot completion cycle. Resolves any requested tools up to 3 recursions.
 * 
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {Array} params.messages
 * @param {string} params.leadId
 * @param {string} params.conversationId
 * @param {string} params.platform - 'telegram' | 'whatsapp'
 * @returns {Promise<{ replyText: string, escalated: boolean }>}
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

  // Maximum 3 iterations of tool calling to prevent infinite recursion
  for (let i = 0; i < 3; i++) {
    response = await callLLM({
      systemPrompt,
      messages: activeMessages,
      tools: CRM_TOOLS,
    });

    if (!response.toolCalls || response.toolCalls.length === 0) {
      // Completed, return the text response
      return { replyText: response.text, escalated };
    }

    // Process tool calls
    console.log(`🤖 Bot requested ${response.toolCalls.length} tool calls (Iteration ${i + 1})`);
    
    // Add LLM's assistant response (with tool calls) to message history
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

      let resultString = '';

      // Execute appropriate resolver
      if (name === 'buscarProducto') {
        resultString = await resolverBuscarProducto(args);
      } else if (name === 'consultarPedido') {
        resultString = await resolverConsultarPedido(args);
      } else if (name === 'crearLead') {
        resultString = await resolverCrearLead(args, leadId, platform);
        // If lead was created, try to grab its ID from response json
        try {
          const parsed = JSON.parse(resultString);
          if (parsed.leadId) leadId = parsed.leadId;
        } catch (err) {
          console.warn('Failed to parse leadId from createLead tool result:', err);
        }
      } else if (name === 'agendarSeguimiento') {
        resultString = await resolverAgendarSeguimiento(args, leadId);
      } else if (name === 'transferirAHumano') {
        resultString = await resolverTransferirAHumano(leadId, conversationId);
        escalated = true;
      } else {
        resultString = JSON.stringify({ error: `Tool ${name} not found.` });
      }

      // Add tool response to history
      activeMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name,
        content: resultString,
      });
    }
  }

  // If reached recursion limit, fall back to last text or a generic message
  return {
    replyText: response?.text || 'Disculpa las molestias, voy a transferirte con un agente humano para que te ayude mejor.',
    escalated: true,
  };
}
