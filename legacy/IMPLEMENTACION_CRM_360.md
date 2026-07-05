# PLAN DE IMPLEMENTACIÓN — Missy-Po CRM 360°

**Fecha:** julio 2026
**Stack:** Astro 7 + React 18 + Tailwind CSS + Firebase (Firestore, Auth, Hosting)
**Objetivo:** Completar CVRM con Leads, Segmentación, Campañas, Captación de Redes Sociales y Chatbot IA (Telegram)

---

## Estado actual del codebase

| Aspecto | Estado |
|---------|--------|
| Stack | Astro 7 + React 18 + Tailwind + Firebase (Firestore, Auth, Hosting) |
| Admin | 8 tabs activos, CVRM con 5 tabs (3 deshabilitados "Próximamente") |
| Cloud Functions | **No existe** `functions/` — hay que crear desde cero |
| CRM service layer | **No existe** — operaciones del Club hardcodeadas en `CVRMDashboard.jsx` (1239 líneas) |
| Drag-and-drop | **Ninguna** librería instalada |
| Seguridad Firestore | `myp_club_miembros` y `puntos_logs` son **públicos** (lectura/escritura sin auth) |
| Specs | **No existe** directorio `specs/` |
| Tests | 9 archivos co-localizados, ninguno en admin/CVRM |

---

## FASE 0 — Fundación (ANTES de Plan 01)

**Objetivo**: Preparar el terreno para que los 4 planes no se pisen.

| # | Tarea | Archivos afectados | Por qué |
|---|-------|-------------------|---------|
| 0.1 | **Inicializar Firebase Cloud Functions** (`firebase init functions`, Node 20, JavaScript) | `functions/`, `firebase.json` | Sin esto no hay webhooks, ni segmentación nocturna, ni agentes IA. Todos los planes dependen de esto. |
| 0.2 | **Crear `src/services/crmLeads.js`** como capa de servicio separada (contrato antes de implementar) | `src/services/crmLeads.js`, `src/services/crmInteractions.js` | `CVRMDashboard.jsx` hace Firestore calls directas. Separar la lógica permite que Plan 01-04 escriban al CRM sin duplicar código. |
| 0.3 | **Crear `specs/` directory** con specs SDD para cada plan | `specs/crm-leads.spec.md`, `specs/crm-segments.spec.md`, `specs/crm-campaigns.spec.md`, `specs/social-leads.spec.md`, `specs/telegram-agent.spec.md` | El flujo del proyecto es SDD → TDD → Engram. Sin specs no hay contrato de implementación. |
| 0.4 | **Refactorizar CVRMDashboard.jsx** — extraer componentes | Separar en `ClubMembersTab.jsx`, `PointsTab.jsx`, `CVRMSidebar.jsx` etc. | Es un monolito de 1239 líneas. Agregar 3 tabs más lo vuelve inmantenible. |
| 0.5 | **Fortalecer reglas de seguridad Firestore** para `myp_club_miembros` | `firestore.rules` | Hoy cualquiera puede leer/escribir. Los leads requieren reglas admin-only estrictas. |
| 0.6 | **Instalar `@dnd-kit/core` y `@dnd-kit/sortable`** | `package.json` | Requerido para el Kanban del Plan 01. |

---

## FASE 1 — Plan 01: CRM Core (Leads + Pipeline)

**Dependencia**: Fase 0 completada
**Entregable**: Tab "Seguimiento de Leads" funcional con Kanban

| # | Tarea | Tipo | Archivos |
|---|-------|------|----------|
| 1.1 | Definir esquemas Firestore para `crm_leads`, `crm_interactions`, `crm_tasks` | Data | `firestore.rules`, `firestore.indexes.json` |
| 1.2 | Implementar `src/services/crmLeads.js` (create, update, list, score) | Service | `src/services/crmLeads.js` + tests |
| 1.3 | Script de migración: Club → Leads (`stage: "cliente"`, `source: "club"`) | Script | `scripts/migrate-club-to-leads.js` |
| 1.4 | Script de backfill: Pedidos históricos → Leads por email/teléfono | Script | `scripts/backfill-checkout-leads.js` |
| 1.5 | Componente `LeadsKanban.jsx` con `@dnd-kit` (columnas por stage) | UI | `src/components/admin/crm/LeadsKanban.jsx` |
| 1.6 | Componente `LeadCard.jsx` (nombre, mascota, canal, score, última interacción) | UI | `src/components/admin/crm/LeadCard.jsx` |
| 1.7 | Componente `LeadDetailDrawer.jsx` (datos editables, timeline, tareas) | UI | `src/components/admin/crm/LeadDetailDrawer.jsx` |
| 1.8 | Filtros: origen, tag, rango de score | UI | Integrado en LeadsKanban |
| 1.9 | Activar tab "leads" en CVRMDashboard (cambiar `active: false` → `true`) | Config | `src/pages/admin/CVRMDashboard.jsx` |
| 1.10 | Cloud Function `recomputeLeadScores` (diaria, decaimiento -1/día tras 14d) | Cloud Fn | `functions/src/crm/recomputeScores.js` |
| 1.11 | Tests: transición stage inválida, cálculo score, creación sin source | Test | `src/services/__tests__/crmLeads.test.js` |

**Scoring v1**: +10 interacción entrante, +5 apertura email, +15 clic link producto, +30 compra, -1/día sin interacción tras 14 días.

### Modelo de datos — crm_leads

```js
crm_leads/{leadId} = {
  name: string,
  phone: string | null,
  email: string | null,
  petName: string | null,
  petAlias: string | null,
  source: "whatsapp" | "telegram" | "instagram" | "facebook" | "tiktok" | "youtube" | "web" | "manual" | "club",
  sourceDetail: { postId, commentId, campaignId, ... },
  stage: "nuevo" | "contactado" | "calificado" | "en_seguimiento" | "cliente" | "perdido",
  score: number,                    // 0-100
  tags: string[],
  segmentIds: string[],
  consent: { whatsapp: bool, email: bool, telegram: bool },
  assignedTo: uid | null,
  points: number,                   // reutiliza sistema de puntos CVRM
  createdAt, updatedAt, lastInteractionAt
}
```

### Modelo de datos — crm_interactions

```js
crm_interactions/{interactionId} = {
  leadId: string,
  channel: string,
  type: "comment" | "dm" | "message" | "call" | "email_open" | "purchase",
  direction: "inbound" | "outbound",
  content: string,
  mediaUrl: string | null,
  aiHandled: bool,
  createdAt: timestamp
}
```

### Modelo de datos — crm_tasks

```js
crm_tasks/{taskId} = {
  leadId: string,
  title: string,
  dueDate: timestamp,
  status: "pendiente" | "hecha",
  assignedTo: string | null,
  createdAt: timestamp
}
```

---

## FASE 2 — Plan 02: Segmentación & Campañas (Email)

**Dependencia**: Plan 01 completado (necesita leads reales)
**Entregable**: Tabs "Segmentación" y "Campañas & Email" funcionales

| # | Tarea | Tipo | Archivos |
|---|-------|------|----------|
| 2.1 | Definir DSL de reglas de segmento (campo, operador, valor; AND en v1) | Spec | `specs/crm-segments.spec.md` |
| 2.2 | Implementar `src/services/crmSegments.js` (evaluateRule, evaluateSegment) | Service | `src/services/crmSegments.js` + tests |
| 2.3 | Cloud Function `recomputeSegments` (Scheduler, diaria 03:00 America/Lima) | Cloud Fn | `functions/src/crm/recomputeSegments.js` |
| 2.4 | Elegir proveedor email (Brevo recomendado por DX + soporte WhatsApp futuro) | Decision | Guardar API key como Firebase secret |
| 2.5 | Implementar `src/services/emailProvider.js` (sendBulk, sendSingle) | Service | `src/services/emailProvider.js` |
| 2.6 | Cloud Function `sendCampaign` (callable, solo admin, filtra por consent) | Cloud Fn | `functions/src/campaigns/sendCampaign.js` |
| 2.7 | Webhook receptor de eventos email (aperturas, clics, bounces) | Cloud Fn | `functions/src/campaigns/emailWebhook.js` |
| 2.8 | UI `SegmentBuilder.jsx` (reglas dinámicas, preview de conteo) | UI | `src/components/admin/crm/SegmentBuilder.jsx` |
| 2.9 | UI `SegmentList.jsx` (nombre, conteo, último recálculo) | UI | `src/components/admin/crm/SegmentList.jsx` |
| 2.10 | UI `CampaignBuilder.jsx` (nombre, segmento, asunto, editor HTML) | UI | `src/components/admin/crm/CampaignBuilder.jsx` |
| 2.11 | UI `CampaignList.jsx` + `CampaignDetail.jsx` (métricas) | UI | `src/components/admin/crm/CampaignList.jsx` |
| 2.12 | Activar tabs `campanas` y `segmentacion` en CVRMDashboard | Config | `src/pages/admin/CVRMDashboard.jsx` |
| 2.13 | Configurar DNS (SPF/DKIM) para dominio de envío | Manual | `docs/email-setup.md` |

**Segmentos iniciales**: "Miembros del Club" (`source == "club"`) y "Leads sin convertir en 30 días" (`stage != "cliente" AND createdAt < now-30d`).

### Modelo de datos — crm_segments

```js
crm_segments/{segmentId} = {
  name: string,
  description: string,
  rules: [{ field: string, operator: string, value: any }],
  leadIds: string[],               // materializado para queries rápidas
  leadCount: number,
  lastComputedAt: timestamp
}
```

### Modelo de datos — crm_campaigns

```js
crm_campaigns/{campaignId} = {
  name: string,
  channel: "email",
  segmentId: string,
  subject: string,
  templateHtml: string,
  status: "borrador" | "programada" | "enviando" | "enviada",
  scheduledAt: timestamp | null,
  stats: { sent, delivered, opened, clicked, bounced, unsubscribed },
  createdAt: timestamp
}
```

---

## FASE 3 — Plan 03: Captación desde Redes Sociales

**Dependencia**: Plan 01 completado
**Entregable**: Comentarios/DMs de IG/FB crean leads automáticamente

| # | Tarea | Tipo | Archivos |
|---|-------|------|----------|
| 3.1 | Configurar secrets Firebase: `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN` | Config | `firebase functions:secrets:set` |
| 3.2 | Cloud Function `socialWebhookHandler` (Meta: IG+FB, verificación GET, firma POST) | Cloud Fn | `functions/src/social/metaWebhook.js` |
| 3.3 | Cloud Task `processSocialEvent` (DM → lead siempre; comentario → solo si matchea intención) | Cloud Fn | `functions/src/social/processSocialEvent.js` |
| 3.4 | Diccionario de intención comercial (ES): "precio", "cuanto cuesta", "disponible", "quiero", "envío", "talla", "stock" | Config | `functions/src/social/intentDictionary.js` |
| 3.5 | YouTube polling (`onSchedule` cada 30 min, lee commentThreads) | Cloud Fn | `functions/src/social/youtubePoll.js` |
| 3.6 | TikTok: documentar como proceso manual + activar Pixel/Events API | Doc | `docs/social-setup.md` |
| 3.7 | Actualizar botón flotante WhatsApp con parámetro de origen (`?utm_source=web_float_button`) | UI | `src/components/shared/WhatsAppFloat.jsx` |
| 3.8 | Documentar pasos manuales Meta Business Suite (cuenta Business, App, webhook setup) | Doc | `docs/social-setup.md` |

### Realidad técnica — qué SÍ y qué NO es automatizable

| Plataforma | Webhook disponible | Automatización |
|------------|-------------------|----------------|
| Instagram + Facebook | SÍ — comentarios, menciones, DMs via Meta Graph API | Lead automático si matchea intención comercial |
| TikTok | NO — sin webhook público de comentarios para cuentas estándar | Pixel/Events API para conversiones del sitio; comentarios = proceso manual semanal |
| YouTube | Polling vía Data API (no webhook push) | Cloud Function cada 30 min |

### Diccionario de intención comercial (v1)

```
ES: "precio", "cuanto cuesta", "disponible", "quiero", "envío", "talla", "stock",
    "comprar", "pedido", "enviar", "quiero comprar", "me interesa", "cuanto vale"
```

Ampliable. Filtro: todo DM crea lead; comentario solo si matchea intención (para no ensuciar pipeline con "🐶❤️").

---

## FASE 4 — Plan 04: Telegram IA Premium (Chatbot activo)

**Dependencia**: Plan 01 completado (idealmente 02-03 también)
**Entregable**: Bot de Telegram con texto + voz, leads visibles en Kanban

| # | Tarea | Tipo | Archivos |
|---|-------|------|----------|
| 4.1 | Especificar `systemPrompt` v1 (alcance, tono, escalamiento) — revisar antes de codear | Spec | `specs/telegram-agent.spec.md` |
| 4.2 | Crear `functions/src/agent/core.js` (lógica pura, sin dependencia de Telegram) | Cloud Fn | `functions/src/agent/core.js` |
| 4.3 | Crear `functions/src/agent/llmRouter.js` + `llmProviders/deepseek.js` (+ anthropic fallback) | Cloud Fn | `functions/src/agent/llmRouter.js`, `functions/src/agent/llmProviders/*.js` |
| 4.4 | Validar function-calling de DeepSeek con las 5 tools reales | Test | `functions/src/agent/__tests__/llmRouter.test.js` |
| 4.5 | Secrets: `TELEGRAM_BOT_TOKEN`, `DEEPSEEK_API_KEY`, `STT_API_KEY`, `TTS_API_KEY` | Config | `firebase functions:secrets:set` |
| 4.6 | Configurar `crm_bot_config/telegram` en Firestore | Config | Doc Firestore |
| 4.7 | Instalar `telegraf` en Functions | Dep | `functions/package.json` |
| 4.8 | Webhook Telegram (`onRequest`, responde 200 rápido, encola en Cloud Tasks) | Cloud Fn | `functions/src/telegram/webhook.js` |
| 4.9 | Worker `processMessage.js` (lead creation, STT si voz, LLM, TTS si voiceEnabled) | Cloud Fn | `functions/src/telegram/processMessage.js` |
| 4.10 | Salvaguardas: detección frustración → escalamiento, rate limiting por chatId | Cloud Fn | Integrado en processMessage |
| 4.11 | Panel admin "Agente Telegram" (editor prompt, toggle voz, conversaciones, métricas) | UI | `src/components/admin/crm/TelegramAgentPanel.jsx` |
| 4.12 | Difusión: link `t.me/MissyPoBot` en bio IG/TT/YT, footer tienda, junto a botón WhatsApp | UI/Doc | `src/components/shared/WhatsAppFloat.jsx` (menú dual) |
| 4.13 | Tests: /start crea lead, nota de voz, escalamiento a humano | Test | `functions/src/telegram/__tests__/processMessage.test.js` |

### Arquitectura del agente (reutilizable para WhatsApp futuro)

```
Mensaje entrante (Telegram/WhatsApp)
  → webhook.js (responde 200 rápido)
  → Cloud Task → processMessage.js
    → Buscar/crear crm_lead (source: "telegram"/"whatsapp")
    → Si voz: STT (Whisper/Google STT)
    → llmRouter.js → deepseek.js (+ anthropic fallback)
      → core.js arma contexto + tools
      → Respuesta: texto o TTS (ElevenLabs/OpenAI TTS)
    → Guardar crm_interaction (inbound + outbound)
    → Enviar respuesta
```

### Tools del agente (5 acotadas al negocio)

| Tool | Qué hace | Colección Firestore |
|------|----------|---------------------|
| `buscarProducto` | Consulta catálogo por nombre/categoría | `myp_productos` |
| `consultarPedido` | Estado de pedido por número/email | `myp_pedidos` |
| `crearLead` / `actualizarLead` | Registra/actualiza lead en CRM | `crm_leads` |
| `agendarSeguimiento` | Crea tarea de seguimiento | `crm_tasks` |
| `transferirAHumano` | Marca conversación para atención manual | `crm_conversations` |

### Capa de abstracción LLM (llmRouter)

```js
// Contrato único para todos los providers
async function callLLM({ systemPrompt, messages, tools }) {
  // devuelve: { text, toolCalls: [{name, args}], finishReason }
}
```

**Proveedor por defecto**: DeepSeek (API compatible OpenAI, costo bajo, soporta tools).
**Fallback opcional**: Anthropic (tool-calling más maduro).
**NUNCA**: LLM de propósito general sin tools — el agente SIEMPRE usa function-calling acotado al negocio.

### Modelo de datos — crm_bot_config

```js
crm_bot_config/{channel}  // doc único "whatsapp" y "telegram"
  systemPrompt: string,
  businessHours: { start, end, timezone },
  escalationKeywords: string[],
  escalationRules: object,
  voiceEnabled: bool,
  voiceId: string,
  llmProvider: "deepseek",
  llmFallbackProvider: "anthropic" | null
```

### Modelo de datos — crm_conversations

```js
crm_conversations/{conversationId} = {
  leadId: string,
  channel: "telegram" | "whatsapp",
  externalId: string,              // telegramChatId / waId
  status: "bot" | "esperando_humano" | "humano" | "cerrada",
  lastMessageAt: timestamp,
  context: {}                     // memoria corta del bot (slots recolectados)
}
```

### Panel de control admin (sección "Agente Telegram")

- Editor del `systemPrompt` (textarea) y `businessHours`
- Toggle `voiceEnabled`
- Lista de conversaciones activas con botón "Tomar conversación" / "Devolver al bot"
- Métricas: mensajes atendidos por IA vs. escalados a humano
- Selector de canal ya contemplado (hoy solo Telegram; preparado para agregar WhatsApp)

---

## FASE 5 — Plan 05: WhatsApp IA (EN PAUSA — solo diseño conservado)

> ⏸️ **NO EJECUTAR.** El botón flotante de WhatsApp sigue derivando a un humano, sin cambios.

**Se retoma cuando**:
1. Telegram esté validado en producción con tráfico real
2. Exista disposición para configuración/aprobación de WhatsApp Business API con Meta

**Lo que ya se construye en Fase 4 y se reutiliza**:
- `functions/src/agent/core.js` (cerebro del agente)
- `functions/src/agent/llmRouter.js` (routing de proveedores LLM)
- Tools del agente (`buscarProducto`, `consultarPedido`, `crearLead`, `agendarSeguimiento`, `transferirAHumano`)
- Pipeline STT → LLM → TTS

**Lo específico de WhatsApp** (para retomar):
- WhatsApp Cloud API oficial (Meta directo, no wrapper no oficial)
- Webhook con verificación `hub.challenge` + firma `X-Hub-Signature-256`
- Respuesta webhook < 5 segundos; procesamiento pesado en Cloud Tasks
- Ventana de 24h: fuera de ella solo con plantillas HSM aprobadas
- Política Meta 2026: prohíbe agentes de propósito general; permite agentes acotados a caso de negocio con salida a humano

---

## Matriz de dependencias

```
Fase 0 (Fundación)
  ├── Fase 1 (CRM Core) ─────┬── Fase 2 (Segmentación)
  │                           ├── Fase 3 (Redes Sociales)
  │                           └── Fase 4 (Telegram IA)
  └───────────────────────────┘

Fase 5 (WhatsApp IA) → Solo después de validar Fase 4 en producción
```

Fases 2, 3 y 4 son **paralelizables** después de Plan 01, pero Fase 4 es la más compleja y la que conviene priorizar si el negocio quiere chatbot rápido.

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `CVRMDashboard.jsx` (1239 líneas) explote al agregar 3 tabs | Alto | **Fase 0.4 obligatoria**: refactorizar ANTES de agregar nada |
| Sin Cloud Functions, nada de webhooks/automatización funciona | Crítico | **Fase 0.1 primer paso** |
| DeepSeek no encadena bien tool calls | Medio | Validar en Fase 4.4 ANTES de producción; fallback a Anthropic |
| Meta rechaza webhook de Instagram por configuración incorrecta | Medio | Documentar checklist manual en `docs/social-setup.md` |
| Reglas Firestore públicas de Club se mezclan con leads admin-only | Alto | **Fase 0.5**: cerrar reglas antes de crear `crm_*` |
| Proveedor email con mala entregabilidad LATAM | Medio | Brevo recomendado; testing con direcciones de control antes de campañas reales |

---

## Cronograma estimado

| Fase | Descripción | Días estimados |
|------|-------------|----------------|
| **0** | Fundación (Cloud Functions, refactor, specs, seguridad) | 1-2 |
| **1** | CRM Core (Leads + Pipeline + Kanban) | 3-4 |
| **2** | Segmentación & Campañas (Email) | 3-4 |
| **3** | Captación Redes Sociales (IG/FB/YT) | 2-3 |
| **4** | Telegram IA Premium (chatbot + voz) | 5-7 |
| **5** | WhatsApp IA (en pausa) | — |
| | **Total estimado** | **14-20 días** |

---

## Criterios de aceptación por fase

### Fase 0 ✅
- `functions/` inicializado y deployable
- `src/services/crmLeads.js` exporta funciones públicas con contrato definido
- `specs/` con al menos `crm-leads.spec.md`
- `CVRMDashboard.jsx` refactorizado en componentes separados
- Reglas Firestore actualizadas para `myp_club_miembros` (admin-only write)
- `@dnd-kit` instalado

### Fase 1 ✅
- Lead creado manualmente o migrado del Club se mueve por Kanban (drag-and-drop)
- Cada lead acumula interacciones (timeline) y tareas
- Score se recalcula automáticamente (decaimiento incluido)
- `npm run test` en verde
- `crm_leads` y `crm_interactions` visibles en `/admin/cvrm`

### Fase 2 ✅
- Admin crea segmento, ve conteo de leads que caen dentro
- Al menos 2 segmentos reales: "Miembros del Club" y "Leads sin convertir en 30d"
- Campaña de email enviada con métricas reales (aperturas, clics)
- Webhook de apertura crea `crm_interaction` en el lead

### Fase 3 ✅
- Comentario real de IG con "precio" → lead en Kanban en < 1 minuto
- DM de IG → lead + interacción creados
- YouTube comment → lead en < 30 minutos
- Documentación clara de limitaciones TikTok y "me gusta"

### Fase 4 ✅
- `/start` en Telegram → lead creado con `source: "telegram"`
- Respuesta de texto coherente acotada al negocio
- Nota de voz entrante → transcripción → respuesta en audio
- Mensaje de reclamo → escalamiento automático a humano
- Cada conversación aparece en ficha del lead (Plan 01)
- Panel admin funcional con editor de prompt y métricas

---

## Definición de "CRM 360° completo"

Un lead puede llegar por Instagram, Facebook, YouTube, TikTok, WhatsApp, Telegram, checkout de la tienda, o alta manual — y siempre cae en la **misma ficha** en el CRM. Un admin puede moverlo por el pipeline (Kanban), segmentarlo con reglas, enviarle campañas de email, y ver todas sus interacciones (incluyendo las del bot de IA) en un solo lugar. El bot de Telegram atiende con texto y voz, escala a humano cuando corresponde, y todo lo que hace queda registrado como interacción en el lead.
