# PLAN: Extracción SDK + SaaS Multi-Tenant desde missy-po

> **Objetivo:** Extraer el agente de ventas de Telegram como SDK reutilizable + crear SaaS multi-tenant, sin contaminar missy-po.

---

## Resumen de Decisiones

| Decisión | Valor |
|---|---|
| **Ubicación SDK** | `C:\MIS PROYECTOS\missy-po-agent-sdk` |
| **Ubicación SaaS** | `C:\MIS PROYECTOS\missy-po-saas` |
| **Stack** | Node.js 22 + Firebase (Firestore, Auth, Hosting, Cloud Functions) + Astro 7 + React 18 |
| **Canal principal** | Telegram primero (API gratis, ya funcional) |
| **Billing** | MercadoPago (principal) + Izipay (alternativa Peru) |
| **SDK tipo** | Primero interno, luego público npm |
| **Personalización** | Configuración por tenant (sin código custom) |
| **Tools** | Mantener tools de missy-po como example incluido |

---

## PROYECTO 1: `@missy-po/agent-sdk`

**Directorio:** `C:\MIS PROYECTOS\missy-po-agent-sdk`

### Estructura del Proyecto

```
missy-po-agent-sdk/
├── package.json
├── README.md
├── src/
│   ├── index.js                    # Exports públicos
│   │
│   ├── agent/
│   │   ├── orchestrator.js         # runAgentCycle() genérico
│   │   ├── promptBuilder.js        # buildSystemPrompt() parametrizable
│   │   ├── toolDefinitions.js      # 12 tool defs OpenAI-format
│   │   └── tools/
│   │       ├── index.js            # Registry + resolver dispatcher
│   │       ├── searchProducts.js   # 3-tier search
│   │       ├── recommendProducts.js
│   │       ├── queryOrder.js
│   │       ├── shippingInfo.js     # Genérico (no "Lima/Callao")
│   │       ├── paymentMethods.js
│   │       ├── businessInfo.js
│   │       ├── leadManagement.js   # crearLead + unirseAlClub + buscarCliente
│   │       ├── scheduleFollowUp.js
│   │       ├── escalateToHuman.js
│   │       ├── initiateCheckout.js
│   │       └── sendPhoto.js
│   │
│   ├── llm/
│   │   ├── router.js               # Provider routing + fallback
│   │   └── providers/
│   │       ├── openai.js           # Genérico OpenAI-compatible
│   │       └── deepseek.js         # DeepSeek vía TokenHub
│   │
│   ├── channels/
│   │   └── telegram/
│   │       ├── index.js            # TelegramChannel class
│   │       ├── webhook.js          # Webhook handler genérico
│   │       ├── checkoutMachine.js  # State machine parametrizable
│   │       ├── callbackHandlers.js # Button routing
│   │       ├── api.js              # Wrappers sendMessage, sendPhoto, etc.
│   │       └── helpers.js          # sendCheckoutPrompt
│   │
│   ├── voice/
│   │   ├── asr.js                  # Qwen3 ASR adapter
│   │   └── tts.js                  # Qwen3 TTS adapter
│   │
│   ├── lib/
│   │   ├── config.js               # Config manager (Firestore/env/custom)
│   │   ├── escalation.js           # Frustration detection parametrizable
│   │   ├── knowledge.js            # Pluggable knowledge loader
│   │   ├── productCatalog.js       # Catalog generator (con campos enriquecidos)
│   │   └── metrics.js              # Collector de métricas (nuevo de Cerebro de Ventas)
│   │
│   └── adapters/
│       ├── interface.js            # DataStore abstract interface
│       └── firestore.js            # Firestore implementation
│
├── examples/
│   └── missy-po/                   # Tools originales de missy-po como reference
│       ├── tools/
│       │   ├── buscarProducto.js
│       │   ├── consultarEnvios.js
│       │   └── ... (los 12 tools originales)
│       └── README.md
│
├── test/
│   ├── agent.test.js
│   ├── tools/
│   │   └── searchProducts.test.js
│   ├── lib/
│   │   └── metrics.test.js          # Tests del collector de métricas
│   └── channels/
│       └── telegram/
│           └── checkoutMachine.test.js
│
└── .env.example
```

### Archivos que se COPIAN tal cual de missy-po

| Archivo original (missy-po) | Destino en SDK | Líneas | Cambio |
|---|---|---|---|
| `functions/src/agent/llmRouter.js` | `src/llm/router.js` | 25 | Ninguno |
| `functions/src/agent/llmProviders/deepseek.js` | `src/llm/providers/deepseek.js` | 66 | Cambiar config import |
| `functions/src/lib/escalation.js` | `src/lib/escalation.js` | 143 | Agregar params configurables |
| `functions/src/telegram/checkoutHelper.js` | `src/channels/telegram/helpers.js` | 89 | Ninguno |

### Archivos que se SPLIT/REFACTORIZAN

| Archivo original | Destino en SDK | Líneas orig | Cambio principal |
|---|---|---|---|
| `functions/src/agent/core.js` | `src/agent/orchestrator.js` | 1223 → ~120 | runAgentCycle genérico, recibe `adapter` |
| `functions/src/agent/core.js` | `src/agent/promptBuilder.js` | → ~110 | Parametrizable: `{businessName, category, tone, currency, ...}` |
| `functions/src/agent/core.js` | `src/agent/toolDefinitions.js` | → ~210 | Declaraciones OpenAI-format puras |
| `functions/src/agent/core.js` | `src/agent/tools/*.js` (12 archivos) | → ~780 | Cada tool recibe `adapter` en vez de `getFirestore()` |
| `functions/src/telegram/webhook.js` | `src/channels/telegram/webhook.js` | 900 → ~100 | Solo routing, delega a checkoutMachine y callbackHandlers |
| `functions/src/telegram/webhook.js` | `src/channels/telegram/checkoutMachine.js` | → ~225 | Steps parametrizables |
| `functions/src/telegram/webhook.js` | `src/channels/telegram/callbackHandlers.js` | → ~580 | Button routing separado |
| `functions/src/telegram/processMessage.js` | `src/channels/telegram/api.js` | 513 → ~85 | Wrappers Telegram API puros |
| `functions/src/telegram/processMessage.js` | `src/voice/asr.js` + `src/voice/tts.js` | → ~90 | Voice pipeline separado |
| `functions/src/lib/knowledge.js` | `src/lib/knowledge.js` | 214 | Pluggable con adapter pattern |
| `functions/src/lib/productCatalog.js` | `src/lib/productCatalog.js` | 202 | Adapter pattern |

### API Pública del SDK

```javascript
import { createAgent, TelegramChannel, FirestoreAdapter } from '@missy-po/agent-sdk';

const agent = createAgent({
  // LLM
  llm: { provider: 'deepseek', apiKey: '...', model: 'deepseek-v4-flash' },

  // Data adapter
  adapter: new FirestoreAdapter({ collectionPrefix: 'myp_' }),

  // Agent config
  agent: {
    name: 'Missy',
    category: 'pet shop',
    tone: 'cálido-profesional',
    currency: 'PEN',
    website: 'https://missypoweb.web.app',
    neuroTechniques: true,
    objectionHandling: true,
    culturalAdaptation: ['Lima', 'Arequipa', 'Cusco', 'Provincias', 'USA', 'Europa'],
  },

  // Voice (optional)
  voice: {
    provider: 'qwen',
    apiKey: '...',
    asrModel: 'qwen3-asr-flash',
    ttsModel: 'qwen3-tts-flash',
  },

  // Checkout config
  checkout: {
    steps: ['nombre', 'telefono', 'dni', 'direccion', 'departamento', 'distrito', 'pago', 'confirmacion'],
    paymentMethods: [
      { id: 'contra_entrega', label: 'Contra Entrega' },
      { id: 'yape', label: 'Yape/Plin' },
    ],
    staleTimeoutMinutes: 30,
  },

  // Escalation
  escalation: {
    keywords: ['hablar con alguien', 'supervisor'],
    patterns: [/[A-Z\s]{20,}!/],
    adminChatId: '123456',
  },

  // Metrics (Cerebro de Ventas)
  metrics: {
    enabled: true,
    trackConversions: true,
    trackObjections: true,
    trackCultural: true,
    collection: 'bot_metrics',     // Firestore collection name
  },
});

// Telegram channel
const telegram = new TelegramChannel({
  botToken: '...',
  adminChatId: '123456',
});

// Connect & start
agent.useChannel(telegram);
agent.start();
```

### Cambios Clave de Desacoplamiento

| Componente missy-po | Cambio en SDK | Razón |
|---|---|---|
| `getFirestore()` directo en tools | `adapter` (DataStore interface) | Desacoplamiento de Firestore |
| System prompt hardcodeado | `{businessName, category, tone, currency, ...}` | Reutilizable por cualquier negocio |
| Checkout steps fijos | `steps: [...]` configurable | Cada negocio tiene flujos diferentes |
| Keywords de escalación en español | `keywords: [...]` parametrizable | Multi-idioma |
| Colecciones Firestore hardcodeadas | `collectionPrefix` en adapter | Multi-tenant |
| Config solo Firestore | `configProvider` custom | Pluggable |

---

## PROYECTO 2: `missy-po-saas`

**Directorio:** `C:\MIS PROYECTOS\missy-po-saas`

### Estructura del Proyecto

```
missy-po-saas/
├── functions/                        # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.js
│   │   ├── tenant/
│   │   │   ├── createTenant.js       # Onboarding
│   │   │   ├── getTenant.js
│   │   │   ├── updateTenant.js
│   │   │   └── listTenants.js        # Super-admin
│   │   ├── billing/
│   │   │   ├── mercadopago.js        # MercadoPago subscriptions
│   │   │   ├── izipay.js             # Izipay alternative
│   │   │   ├── webhook.js            # Payment webhook handler
│   │   │   └── checkPlan.js          # Plan limits verification
│   │   ├── webhook/
│   │   │   └── telegram.js           # Routes to correct tenant
│   │   ├── agent/
│   │   │   └── handler.js            # Wraps SDK per-tenant
│   │   └── cron/
│   │       ├── followUpProcessor.js
│   │       └── generateCatalog.js
│   ├── package.json                  # Depends on @missy-po/agent-sdk
│   └── .env
│
├── src/                              # Astro 7 + React 18 SPA
│   ├── pages/
│   │   ├── index.astro               # Landing page marketing
│   │   ├── features.astro            # Features page
│   │   ├── pricing.astro             # Pricing page
│   │   ├── login.astro               # Auth
│   │   ├── register.astro
│   │   ├── onboarding.astro          # Setup wizard
│   │   ├── dashboard.astro           # Tenant dashboard
│   │   └── admin/
│   │       ├── config.astro          # Bot config
│   │       ├── knowledge.astro       # Knowledge base
│   │       ├── api-keys.astro        # API keys
│   │       ├── conversations.astro   # Live conversations
│   │       ├── leads.astro           # CRM leads
│   │       ├── catalog.astro         # Product catalog
│   │       ├── billing.astro         # Plan & billing
│   │       ├── metrics.astro         # Bot metrics dashboard (Cerebro de Ventas)
│   │       └── super-admin/
│   │           └── tenants.astro     # Manage all tenants
│   │
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.astro
│   │   │   ├── Features.astro
│   │   │   ├── Pricing.astro
│   │   │   ├── Testimonials.astro
│   │   │   └── CTA.astro
│   │   ├── admin/
│   │   │   ├── TenantConfig.jsx
│   │   │   ├── KnowledgeEditor.jsx
│   │   │   ├── ConversationViewer.jsx
│   │   │   ├── LeadsKanban.jsx
│   │   │   ├── BillingPanel.jsx
│   │   │   └── BotMetrics.jsx       # Dashboard de métricas del bot (Cerebro de Ventas)
│   │   └── shared/
│   │       ├── Layout.astro
│   │       └── Navbar.astro
│   │
│   └── styles/
│       └── global.css
│
├── firebase.json
├── firestore.rules
├── package.json
└── README.md
```

### Sistema Multi-Tenant

#### Estructura Firestore

```
saas_tenants/{tenantId}/
├── config: {
│     name: "Pet Shop Demo",
│     slug: "petshop-demo",
│     plan: "pro",                    // free | basic | pro | enterprise
│     status: "active",               // active | suspended | cancelled
│     createdAt: timestamp,
│     payment: {
│       provider: "mercadopago",      // mercadopago | izipay
│       customerId: "cus_...",
│       subscriptionId: "sub_...",
│     },
│   }
│
├── agent: {
│     personality: { name, description, tone, rules, fallback },
│     checkout: { steps, paymentMethods, staleTimeoutMinutes },
│     escalation: { keywords, patterns, adminChatId },
│     voice: { enabled, provider },
│     channels: {
│       telegram: { botToken, botUsername },
│     },
│   }
│
├── knowledge: {
│     businessInfo: { ... },
│     policies: { ... },
│     faq: { ... },
│     club: { ... },
│   }
│
├── api_keys: {
│     DEEPSEEK_API_KEY: "...",
│     QWEN_API_KEY: "...",
│   }
│
├── products: { ... }
├── orders: { ... }
├── leads: { ... }
├── conversations: { ... }
└── interactions: { ... }
```

### Sistema de Billing

#### MercadoPago (Principal)

- **SDK:** `npm install mercadopago` (v3.2.0+)
- **Checkout Pro:** Redirección a página de pago de MercadoPago
- **Subscriptions:** Recurrentes con `PreApproval` API
- **Webhooks:** Notificaciones de pago exitoso/fallido
- **Sandbox:** Para testing antes de producción
- **Documentación:** https://www.mercadopago.com.pe/developers/en/docs

#### Izipay (Alternativa Peru)

- **SDK:** GitHub `izipay-pe/Server-PaymentForm-NodeJS`
- **Métodos:** Tarjetas + Yape + PLIN + QR
- **Comisión:** 3.44% + S/0.69 + IGV
- **Link de pago:** Para redes sociales

#### Flujo de Billing

```
1. Tenant crea cuenta (Free plan activo automáticamente)
2. Tenant quiere upgrade a Basic ($29/mes)
3. Clic en "Upgrade" → selecciona MercadoPago o Izipay
4. Redirect a Checkout Pro de MercadoPago
5. Tenant paga
6. Webhook recibe confirmación
7. Tenant plan actualizado en Firestore
8. Límites de conversación actualizados
```

#### Planes

| Plan | Precio | Conv/mes | Features |
|---|---|---|---|
| Free | $0 | 100 | 1 canal, bot básico, sin voz |
| Basic | $29/mes | 1,000 | 1 canal, knowledge base, checkout |
| Pro | $79/mes | 5,000 | Multi-canal, voz, CRM, analytics |
| Enterprise | $199/mes | Ilimitado | White-label, soporte dedicado, API |

### Landing Page Marketing

#### Secciones

1. **Hero:** "Tu agente de ventas IA para Telegram" + CTA "Comienza gratis"
2. **Cómo funciona:** 3 pasos (Configura → Conecta → Vende 24/7)
3. **Features:** Checkout inline, voz, neurociencia, multi-canal, CRM, métricas
4. **Pricing:** Tabla de 4 planes con CTA por plan
5. **Testimonials:** (placeholder inicial)
6. **FAQ:** Preguntas frecuentes
7. **CTA final:** "Únete a cientos de negocios"

### Flujo de Onboarding

```
1. Usuario se registra (Firebase Auth)
2. Wizard paso 1: Nombre del negocio + slug
3. Wizard paso 2: Categoría + moneda
4. Wizard paso 3: Personalidad del bot (nombre, tono, reglas)
5. Wizard paso 4: Knowledge base (business info, policies, FAQ)
6. Wizard paso 5: API keys (DeepSeek, Qwen, Telegram bot token)
7. Wizard paso 6: Conexión (webhook URL automática)
8. Wizard paso 7: Prueba ("Escribe 'hola' al bot")
9. Plan Free activo
```

---

## FASES DE IMPLEMENTACIÓN

### Fase 0: Completar "Cerebro de Ventas" en missy-po (1 semana)

> **Nota:** Las fases 3 y 4 del plan original "Cerebro de Ventas" no están implementadas.
> Se completan ANTES de la extracción al SDK para que el SDK incluya todo.

#### Fase 0.1: Enriquecimiento de Productos (Fase 3 pendiente)

| # | Tarea | Archivo | Descripción |
|---|---|---|---|
| 0.1.1 | Actualizar `buildCatalogJSON()` | `functions/src/lib/productCatalog.js` | Agregar campos: `descripcion`, `especificaciones`, `beneficios`, `compatibilidad` |
| 0.1.2 | Crear script de migración | `functions/src/scripts/enrichProductDescriptions.js` | Agregar descripciones enriquecidas a 20 productos principales |
| 0.1.3 | Ejecutar migración | Firestore `myp_productos` | Poblar campos nuevos en productos existentes |

**Campos a agregar en `buildCatalogJSON()`:**

```javascript
// Agregar después de imagenUrl (línea 39)
descripcion: p.descripcion_detallada || p.descripcion_corta || '',
especificaciones: p.especificaciones || {},    // { material, tamano, peso, colores, lavable, garantia }
beneficios: p.beneficios || [],                // ["Resistente al agua", "Fácil de limpiar"]
compatibilidad: p.tags_compatibilidad || [],    // ["perro", "cachorro", "mediano"]
```

**Script de migración (`enrichProductDescriptions.js`):**

```javascript
// Campos a agregar a productos existentes en Firestore
const PRODUCT_ENRICHMENTS = {
  'collar-kiara': {
    descripcion_detallada: 'Collar de nylon resistente con hebilla de seguridad...',
    especificaciones: { material: 'Nylon', tamano: '20-40 cm', peso: '45g' },
    beneficios: ['Resistente al agua', 'Fácil de limpiar'],
    tags_compatibilidad: ['perro', 'cachorro', 'mediano'],
  },
  // ... 19 productos más
};
```

#### Fase 0.2: Dashboard de Métricas (Fase 4 pendiente)

| # | Tarea | Archivo | Descripción |
|---|---|---|---|
| 0.2.1 | Crear collector de métricas | `functions/src/lib/metrics.js` | Nuevo: trackea conversaciones, pedidos, escalamientos |
| 0.2.2 | Integrar en orchestrator | `functions/src/agent/core.js` | Llamar metrics después de cada interacción |
| 0.2.3 | Crear Cloud Function de aggregation | `functions/src/cron/computeMetrics.js` | Cron diario: calcular tasas y guardar en `crm_bot_metrics` |
| 0.2.4 | Crear UI de métricas | `src/components/admin/crm/BotMetrics.jsx` | Dashboard con KPIs |

**Estructura de `crm_bot_metrics`:**

```javascript
{
  date: "2026-07-09",
  tenantId: "default",
  conversations: 150,
  ordersCompleted: 25,
  conversionRate: 0.167,        // pedidos / conversaciones
  averageTicket: 28.5,          // total vendido / pedidos
  escalations: 12,
  escalationRate: 0.08,         // escalamientos / conversaciones
  avgResolutionTime: 180,       // segundos promedio
  topProducts: [
    { name: "Collar Kiara", count: 15 },
  ],
  topObjections: [
    { objection: "Es muy caro", count: 20 },
  ],
  culturalBreakdown: {
    lima: 60,
    arequipa: 25,
    cusco: 15,
  },
}
```

**Métricas a trackear:**

| Métrica | Fórmula | Meta |
|---------|---------|------|
| Tasa de conversión | Pedidos completados / conversaciones totales | >15% |
| Ticket promedio | Total vendido / Número de pedidos | >S/25 |
| Tiempo de resolución | Tiempo promedio por conversión | <3 minutos |
| Tasa de escalamiento | Escalaciones / Conversaciones totales | <10% |
| Top objeciones | Conteo de objeciones por tipo | — |
| Breakdown cultural | Conversaciones por región | — |

---

### Fase 1: SDK Core (2 semanas)

| # | Tarea | Archivos | Dependencia |
|---|---|---|---|
| 1.1 | Crear proyecto SDK con package.json | `package.json`, `.env.example` | — |
| 1.2 | Crear DataStore abstract interface | `adapters/interface.js` | — |
| 1.3 | Crear Firestore adapter | `adapters/firestore.js` | 1.2 |
| 1.4 | Extraer tool definitions | `agent/toolDefinitions.js` | — |
| 1.5 | Extraer tools (12 archivos) | `agent/tools/*.js` | 1.2, 1.4 |
| 1.6 | Crear tool registry + dispatcher | `agent/tools/index.js` | 1.5 |
| 1.7 | Crear orchestrator genérico | `agent/orchestrator.js` | 1.6 |
| 1.8 | Crear promptBuilder parametrizable | `agent/promptBuilder.js` | — |
| 1.9 | Copiar LLM router + deepseek | `llm/router.js`, `llm/providers/deepseek.js` | — |
| 1.10 | Crear provider OpenAI genérico | `llm/providers/openai.js` | — |
| 1.11 | Copiar + parametrizar escalation | `lib/escalation.js` | — |
| 1.12 | Crear config manager | `lib/config.js` | — |
| 1.13 | Crear knowledge loader pluggable | `lib/knowledge.js` | 1.2 |
| 1.14 | Crear product catalog generator (con campos enriquecidos) | `lib/productCatalog.js` | 1.2 |
| 1.14b | Extraer metrics collector | `lib/metrics.js` | 1.2 |
| 1.15 | Crear exports públicos | `index.js` | 1.7, 1.8, 1.9 |
| 1.16 | Tests unitarios | `test/agent.test.js`, `test/tools/*.test.js` | 1.15 |

### Fase 2: SDK Telegram Channel (1 semana)

| # | Tarea | Archivos | Dependencia |
|---|---|---|---|
| 2.1 | Crear Telegram API wrappers | `channels/telegram/api.js` | — |
| 2.2 | Crear checkout state machine | `channels/telegram/checkoutMachine.js` | 2.1 |
| 2.3 | Crear callback handlers | `channels/telegram/callbackHandlers.js` | 2.1 |
| 2.4 | Crear checkout helpers | `channels/telegram/helpers.js` | 2.1 |
| 2.5 | Crear webhook handler genérico | `channels/telegram/webhook.js` | 2.2, 2.3 |
| 2.6 | Crear TelegramChannel class | `channels/telegram/index.js` | 2.5 |
| 2.7 | Extraer voice pipeline | `voice/asr.js`, `voice/tts.js` | — |
| 2.8 | Tests de integración | `test/channels/telegram/*.test.js` | 2.6 |

### Fase 3: SDK Package + Examples (3 días)

| # | Tarea | Archivos | Dependencia |
|---|---|---|---|
| 3.1 | Configurar package.json exports | `package.json` | — |
| 3.2 | Documentación JSDoc completa | Todos los archivos | — |
| 3.3 | Copiar tools originales a examples | `examples/missy-po/tools/*.js` | — |
| 3.4 | Crear README del SDK | `README.md` | 3.3 |
| 3.5 | npm pack y test de instalación | — | 3.1 |

### Fase 4: SaaS Foundation (2 semanas)

| # | Tarea | Archivos | Dependencia |
|---|---|---|---|
| 4.1 | Crear proyecto SaaS con Firebase | `firebase.json`, `package.json` | — |
| 4.2 | Tenant CRUD | `functions/src/tenant/*.js` | — |
| 4.3 | Multi-tenant webhook routing | `functions/src/webhook/telegram.js` | SDK |
| 4.4 | Billing MercadoPago | `functions/src/billing/mercadopago.js` | — |
| 4.5 | Billing Izipay | `functions/src/billing/izipay.js` | — |
| 4.6 | Webhook handler billing | `functions/src/billing/webhook.js` | 4.4, 4.5 |
| 4.7 | Plan limits checker | `functions/src/billing/checkPlan.js` | 4.2 |
| 4.8 | Onboarding wizard | `src/pages/onboarding.astro` | 4.2 |
| 4.9 | Auth (login/register) | `src/pages/login.astro`, `register.astro` | — |

### Fase 5: SaaS Admin Panel (2 semanas)

| # | Tarea | Archivos | Dependencia |
|---|---|---|---|
| 5.1 | Dashboard del tenant | `src/pages/dashboard.astro` | 4.2 |
| 5.2 | Config del bot | `src/pages/admin/config.astro` + `TenantConfig.jsx` | 4.2 |
| 5.3 | Knowledge base editor | `src/pages/admin/knowledge.astro` + `KnowledgeEditor.jsx` | 4.2 |
| 5.4 | API keys manager | `src/pages/admin/api-keys.astro` | 4.2 |
| 5.5 | Conversaciones en vivo | `src/pages/admin/conversations.astro` + `ConversationViewer.jsx` | 4.3 |
| 5.6 | CRM leads | `src/pages/admin/leads.astro` + `LeadsKanban.jsx` | 4.2 |
| 5.7 | Catálogo de productos | `src/pages/admin/catalog.astro` | 4.2 |
| 5.8 | Billing/plan management | `src/pages/admin/billing.astro` + `BillingPanel.jsx` | 4.4, 4.5 |
| 5.9 | Super-admin tenants | `src/pages/admin/super-admin/tenants.astro` | 4.2 |
| 5.10 | Bot metrics dashboard | `src/pages/admin/metrics.astro` + `BotMetrics.jsx` | SDK metrics |

### Fase 6: Landing Page + Launch (1 semana)

| # | Tarea | Archivos | Dependencia |
|---|---|---|---|
| 6.1 | Landing page hero | `src/pages/index.astro` + `Hero.astro` | — |
| 6.2 | Features page | `src/pages/features.astro` + `Features.astro` | — |
| 6.3 | Pricing page | `src/pages/pricing.astro` + `Pricing.astro` | 4.4 |
| 6.4 | Testimonials placeholder | `Testimonials.astro` | — |
| 6.5 | FAQ | `src/pages/index.astro` (sección) | — |
| 6.6 | CTA final | `CTA.astro` | — |
| 6.7 | Documentación | `README.md` del SaaS | — |
| 6.8 | Tests end-to-end | — | — |
| 6.9 | Deploy a Firebase | `firebase.json` | — |

---

## DEPENDENCIAS ENTRE PROYECTOS

```
missy-po (original)
    │
    │  extracción de código
    ▼
@missy-po/agent-sdk
    │
    │  npm dependency (file:../missy-po-agent-sdk)
    ▼
missy-po-saas
```

- **SDK** se crea DESPUÉS de extraer de missy-po (copia, no modifica)
- **SaaS** depende del SDK (lo importa como dependencia local)
- **missy-po** sigue funcionando independientemente (no se toca)

---

## TIMELINE TOTAL

| Fase | Duración | Acumulado | Entregable |
|---|---|---|---|
| Fase 0: Completar Cerebro de Ventas | 1 semana | Semana 1 | missy-po completo con métricas |
| Fase 1: SDK Core | 2 semanas | Semana 3 | Agent engine funcional |
| Fase 2: SDK Telegram | 1 semana | Semana 4 | Canal Telegram funcional |
| Fase 3: SDK Package | 3 días | Semana 4.5 | Paquete npm listo |
| Fase 4: SaaS Foundation | 2 semanas | Semana 6.5 | Multi-tenant + billing |
| Fase 5: SaaS Admin | 2 semanas | Semana 8.5 | Admin panel completo |
| Fase 6: Landing + Launch | 1 semana | Semana 9.5 | Landing + deploy |

**Total: ~9-10 semanas** para ambos proyectos funcionales.

---

## VALORACIÓN DE MERCADO

### Perú
- **TAM:** ~50K+ negocios activos en WhatsApp/Telegram
- **Competencia:** Leadsales ($133/mes), Respond.io ($79/mes)
- **Precio sugerido:** $29-99 USD/mes (SMB) / $199-399 USD/mes (enterprise)
- **Diferenciador:** Checkout inline + voz + adaptación cultural = ÚNICO

### Latinoamérica
- **TAM:** ~500K+ negocios con presupuesto para automatización
- **Competencia:** Leadsales (México), Jelou (Colombia), Aurora (Latam)
- **Precio sugerido:** $29-149 USD/mes (SMB) / $299-599 USD/mes (enterprise)

### USA
- **TAM:** 5M+ con e-commerce
- **Competencia:** Intercom ($0.99/resolution), Drift ($2,500/mes), 11x ($5,000+/mes)
- **Precio sugerido:** $149-499 USD/mes (SMB) / $999-2,999 USD/mes (enterprise)

### Europa
- **Competencia:** Intercom, Zendesk, Tidio, Landbot
- **Precio sugerido:** €99-399/mes (SMB) / €799-2,499/mes (enterprise)
- **Requisito:** GDPR compliance

### Asia
- **Competencia:** Botpress, ManyChat, soluciones locales
- **Precio sugerido:** $29-199 USD/mes (varía por país)

### Valoración del Proyecto

| Escenario | Valoración |
|---|---|
| SDK documentado + adapters | $15,000-50,000 USD |
| SaaS multi-tenant funcional | $100,000-300,000 USD |
| Startup con tracción (100+ clientes) | $500,000-2,000,000 USD |
| Equivalente de desarrollo desde cero | $40,000-80,000 USD |

---

## COMPETIDORES COMPARADOS

| Producto | Precio | Canal | vs. missy-po SDK |
|---|---|---|---|
| Leadsales Lead Agent | $133-245/mes | WhatsApp | Sin checkout inline, sin voz |
| Aurora Inbox | $99-329/mes | WA+FB+IG | Sin checkout, sin voice pipeline |
| Respond.io | $79-279/mes | Multi | Helpdesk, no agente de ventas |
| Jelou AI Commerce | Custom | WhatsApp | Sin e-commerce integrado |
| Botpress | Free-$49/mes | Multi | Solo plataforma, construir todo |
| 11x (Alice) | $5,000+/mes | Email+LinkedIn | Enterprise outbound, no retail |

### Lo que hace missy-po que POCOS tienen:
1. Checkout completo dentro del chat
2. Voz + texto (ASR/TTS integrado)
3. Product catalog 3-tier search con **campos enriquecidos** (especificaciones, beneficios, compatibilidad)
4. Técnicas de neurociencia en el prompt (6 principios: anclaje, dopamina, oxitocina, aversión, cortisol, serotonina)
5. Adaptación cultural por región (Lima, Arequipa, Cusco, Provincias, USA/Europa, LATAM)
6. CRM completo integrado
7. Telegram API gratis ($0 vs WhatsApp $0.005-$0.08/conversación)
8. **Dashboard de métricas** (conversión, ticket promedio, escalamientos, objeciones, breakdown cultural)

---

## NOTAS TÉCNICAS

### Stack del SDK
- **Runtime:** Node.js 22 (ES Modules)
- **Dependencies:** axios, firebase-admin (adapter)
- **LLM:** OpenAI-compatible API (DeepSeek, OpenAI, Anthropic futuro)
- **Voice:** Alibaba Qwen3 ASR/TTS
- **Testing:** Vitest

### Stack del SaaS
- **Backend:** Firebase Cloud Functions v2
- **Database:** Cloud Firestore
- **Auth:** Firebase Auth
- **Frontend:** Astro 7 + React 18 + Tailwind CSS 3
- **Hosting:** Firebase Hosting
- **Billing:** MercadoPago SDK + Izipay

### Requisitos previos
- Cuenta Firebase activa
- Cuenta MercadoPago (Peru)
- Cuenta Izipay (opcional)
- API key DeepSeek vía TokenHub
- API key Alibaba Qwen (para voz)
- Bot de Telegram creado via @BotFather
