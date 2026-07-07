# Graph Report - missy-po  (2026-07-05)

## Corpus Check
- 230 files · ~325,153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1112 nodes · 1690 edges · 88 communities (80 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5e06eb4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_processSocialEvent.js|processSocialEvent.js]]
- [[_COMMUNITY_firebasefirestore|firebase/firestore]]
- [[_COMMUNITY_reviews.js|reviews.js]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_Collection `crm_campaigns`|Collection: `crm_campaigns`]]
- [[_COMMUNITY_Collection `crm_leads`|Collection: `crm_leads`]]
- [[_COMMUNITY_Collection `crm_segments`|Collection: `crm_segments`]]
- [[_COMMUNITY_Spec — Telegram IA Agent (crm_bot_configtelegram)|Spec — Telegram IA Agent (crm_bot_config/telegram)]]
- [[_COMMUNITY_backfill-checkout-leads.js|backfill-checkout-leads.js]]
- [[_COMMUNITY_Spec — Social Lead Capture (Meta IGFB + YouTube)|Spec — Social Lead Capture (Meta IG/FB + YouTube)]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_migrate-club-to-leads.js|migrate-club-to-leads.js]]
- [[_COMMUNITY_reclamaciones.astro|reclamaciones.astro]]
- [[_COMMUNITY_CVRMDashboard.jsx|CVRMDashboard.jsx]]
- [[_COMMUNITY_LeadsKanban.jsx|LeadsKanban.jsx]]
- [[_COMMUNITY_reclamaciones.astro|reclamaciones.astro]]
- [[_COMMUNITY_mi-cuenta.astro|mi-cuenta.astro]]
- [[_COMMUNITY_config.js|config.js]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_carrito.astro|carrito.astro]]
- [[_COMMUNITY_seedKnowledge.js|seedKnowledge.js]]
- [[_COMMUNITY_index.js|index.js]]
- [[_COMMUNITY_CajaDiaria.jsx|CajaDiaria.jsx]]
- [[_COMMUNITY_LeadsKanban.jsx|LeadsKanban.jsx]]
- [[_COMMUNITY_functions|functions]]
- [[_COMMUNITY_ApiKeysSection.jsx|ApiKeysSection.jsx]]
- [[_COMMUNITY_TelegramAgentPanel.jsx|TelegramAgentPanel.jsx]]
- [[_COMMUNITY_emailProvider.js|emailProvider.js]]
- [[_COMMUNITY_LeadsKanban.jsx|LeadsKanban.jsx]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_devDependencies|devDependencies]]

## God Nodes (most connected - your core abstractions)
1. `../layouts/Layout.astro` - 30 edges
2. `getApiKeys()` - 21 edges
3. `useCartStore` - 19 edges
4. `🧩 COMPONENTES UI — ESPECIFICACIONES EXACTAS` - 17 edges
5. `processTelegramMessage()` - 16 edges
6. `useUserStore` - 14 edges
7. `3. BUGS CRÍTICOS ENCONTRADOS` - 13 edges
8. `PLAN DE IMPLEMENTACIÓN — Missy-Po CRM 360°` - 13 edges
9. `Plan de Acción: Seguridad, Arquitectura y Deuda Técnica — Missy & Po Pet Shop` - 13 edges
10. `🐾 MISSY & PO PET SHOP — MASTER CONTEXT FILE` - 12 edges

## Surprising Connections (you probably didn't know these)
- `resolverCrearPedido()` --calls--> `getApiKeys()`  [INFERRED]
  functions/src/agent/core.js → functions/src/lib/config.js
- `resolverSendProductPhoto()` --calls--> `getApiKeys()`  [INFERRED]
  functions/src/agent/core.js → functions/src/lib/config.js
- `sendTelegramMessage()` --calls--> `getApiKeys()`  [EXTRACTED]
  functions/src/crm/sendHumanMessage.js → functions/src/lib/config.js
- `verifyMetaSignature()` --calls--> `getApiKeys()`  [EXTRACTED]
  functions/src/social/metaWebhook.js → functions/src/lib/config.js
- `runAgentCycle()` --calls--> `callLLM()`  [EXTRACTED]
  functions/src/agent/core.js → functions/src/agent/llmRouter.js

## Import Cycles
- 1-file cycle: `src/services/auth.js -> src/services/auth.js`
- 3-file cycle: `src/App.jsx -> src/pages/OrderConfirmationPage.jsx -> src/services/firebase.js -> src/App.jsx`
- 4-file cycle: `src/App.jsx -> src/pages/CheckoutPage.jsx -> src/components/checkout/CheckoutForm.jsx -> src/services/firebase.js -> src/App.jsx`
- 4-file cycle: `src/App.jsx -> src/pages/LoginPage.jsx -> src/services/auth.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/orders.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/coupons.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/reclamaciones.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/components/layout/Layout.jsx -> src/components/layout/Navbar.jsx -> src/services/auth.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/CheckoutPage.jsx -> src/components/checkout/CheckoutForm.jsx -> src/hooks/useClubMembership.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/config.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/reviews.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/products.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/cashRegister.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/userProfile.js -> src/services/firebase.js -> src/App.jsx`

## Communities (88 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (12): AperturaCajaSchema, CierreCajaSchema, MovimientoSchema, CartItemSchema, CartStateSchema, CheckoutSchema, YapePlinSchema, VarianteSchema (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (37): AccountDashboard(), AccountHeader(), ContentFeed(), OrderCard(), STATUS_MAP, OrderTimeline(), TIMELINE_STEPS, PetForm() (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, @babel/eslint-parser, @babel/preset-react, eslint, eslint-plugin-import, eslint-plugin-react, eslint-plugin-react-hooks (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (18): AddressForm(), CheckoutForm(), ClubSection(), ContactFields(), CouponSection(), DocumentFields(), OrderSummary(), PaymentMethods() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (25): 1.2 — Descomponer `CheckoutPage.jsx` (973 líneas), 1.3 — Code splitting con React.lazy para rutas admin, 2.1 — Extraer sidebar admin reutilizable, 2.2 — Limpiar dynamic imports en cartStore.js, 2.3 — Unificar campo estado en pedidos, 2.4 — Mapeo de categorías desde Firestore, 3.1 — Extraer constantes hardcodeadas de CheckoutPage, 3.2 — Agregar JSDoc a funciones de services (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): 1. Análisis General de la Aplicación, 2. Mapa de Rutas y Páginas, 3. BUGS CRÍTICOS ENCONTRADOS, 4. Funcionalidades Incompletas / Pendientes en el Admin, 5. Análisis del Flujo de Carrito y Checkout, 6. Análisis de la Calidad del Código, 7. Plan de Corrección Priorizado, 8. Recomendaciones de Arquitectura a Mediano Plazo (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (11): 1. Modificaciones en la Interfaz Principal (Vista de Lista), 2. Actualización de la Arquitectura de Datos (Firestore Schema), 3. Diseño y Comportamiento del Modal Resolutivo, 4. Requerimientos Técnicos y de Control (Entorno Antigravity), Columna Derecha (40%): Panel de Control Operativo, Columna Izquierda (60%): Bloque de Información General, 📋 Objetivo del Rediseño, Opción A: Devolución Aceptada (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (37): 10. PRODUCT CARD (Tarjeta de producto), 11. PRODUCT DETAIL PAGE (Ficha de Producto), 12. CHECKOUT PAGE, 13. MI CUENTA (Account Dashboard), 14. CTA BANNER (Pre-Footer), 15. FOOTER (3 columnas fijas sobre fondo blanco), 16. ELEMENTOS FLOTANTES PERMANENTES, 1. NAVBAR (Header Sticky) (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (10): ../assets/logoheader.jpeg, ../components/cart/CartDrawer, ../components/layout/Footer, ../components/layout/Navbar, ../components/shared/CartFloat, ../components/shared/WhatsAppFloat, ./CheckoutPage.jsx, ../pages/HomePage (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (7): CartDrawer(), CartDrawerItem(), CartFloat(), CartPage(), CheckoutPage(), validarCupon(), useCartStore

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (10): app, cleanVal(), DATABASE_SQL, db, firebaseConfig, parsePHPSerialize(), parseSqlValues(), runMigration() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (45): 1. Nuevo archivo: `src/services/auth.js`, 2. Nuevo archivo: `src/pages/AdminLoginPage.jsx`, 3. Modificar `src/pages/LoginPage.jsx` — Solo clientes, 4. Modificar `src/pages/admin/AdminLayout.jsx`, 5. Actualizar rutas en `src/pages/admin/[...all].astro` y `src/components/admin/AdminApp.jsx`, 6. Actualizar `src/pages/admin/AdminLayout.jsx`, Archivos a crear: `src/utils/sanitize.js`, Archivos a modificar: (+37 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (8): ../../data/blog-posts, ../data/blog-posts.js, articulosBlog, articulos, categorias, emptyState, form, searchInput

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (29): 0.1 Instalar dependencia, 0.2 Crear estructura de schemas, 1.10 `src/schemas/index.js` (barrel), 1.1 `src/schemas/product.js`, 1.2 `src/schemas/checkout.js`, 1.3 `src/schemas/cart.js`, 1.4 `src/schemas/coupon.js`, 1.5 `src/schemas/shippingConfig.js` (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (16): 1.1 — Separar `firestore.js` en módulos domain-oriented, 1.2 — Descomponer `CheckoutPage.jsx` en componentes y hooks, 1.3 — Code splitting con React.lazy para rutas admin, 2.1 — Extraer sidebar admin reutilizable, 2.2 — Limpiar dynamic imports en cartStore, 2.3 — Unificar campo de estado en pedidos, 2.4 — Mapeo de categorías desde Firestore, 3.1 — Extraer constantes hardcodeadas de CheckoutPage (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): ../../pages/ProductPage.jsx, ./StorePage.jsx, ../services

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (6): PriceDisplay(), ProductCard(), MOCK_PRODUCTS, SaleBadge(), cleanDescription(), ProductPage()

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): __dirname, __filename, SERVICE_ACCOUNT_PATH

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (12): 1. Análisis de la App / Requerimiento Actual, 2. ¿Por qué hacer este cambio? / Beneficios, 3. Arquitectura Propuesta (File Tree), 4. User Review Required (Alertas Críticas), 5. Open Questions, 6. Fases de Implementación (Proposed Changes), Fase 1: Implementación de la Vista de Carrito Detallado (`CartPage`), Fase 2: Lógica Transaccional de Pedidos (`firestore.js`) (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (14): ./LoginPage.jsx, AccountLayout(), AccountSidebar(), NAV_ITEMS, AdminSidebar(), LoginPage(), checkIsAdmin(), googleProvider (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (8): 1. Página de Carrito Detallada (`CartPage.jsx`), 2. Formulario de Checkout Inteligente (`CheckoutPage.jsx`), 3. Pasarelas de Pago Interactivas (Simuladores Premium), 4. Transacción Atómica de Stock (`firestore.js`), 5. Página de Éxito y Boleta Térmica (`OrderConfirmationPage.jsx`), 📊 Flujo Probado y Verificado, 🌟 Lo que hemos logrado, Walkthrough: Integración de Checkout, Métodos de Pago y Transacciones de Stock

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): Archivos Creados / Modificados, Decisiones Técnicas Tomadas, Estado Actual, Missy & Po Pet Shop — AI Context, Siguientes Pasos, Stack Actual

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (4): ¿Cómo usarlas en páginas Astro?, Estructura de carpetas, Naming convention, 📁 src/assets — Imágenes Optimizadas por Astro

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (17): buildSystemPrompt(), runAgentCycle(), getApiKeys(), detectFrustration(), FRUSTRATION_KEYWORDS, FRUSTRATION_PATTERNS, notifyAdminEscalation(), sendCheckoutPrompt() (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.19
Nodes (10): hasCommercialIntent(), KEYWORDS, normalizeText(), socialWebhookHandler, verifyMetaSignature(), processSocialEvent(), mockGet, mockSet (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (13): ../../index.css, AdminLayout, App(), CajaDiaria, ConfiguracionEnviosCupones, InventarioStock, PedidosDashboard, ProductosCRUD (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (18): formatDate(), INTERACTION_TYPE_LABELS, LeadDetailDrawer(), SOURCE_ICONS, getInteractionsByLead(), INTERACTION_DIRECTIONS, INTERACTION_TYPES, recordInteraction() (+10 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (7): ../assets/club/cumple.jpeg, ../assets/club/descuentos.jpeg, ../assets/club/enviorapido.jpeg, ../assets/club/exclusivo.jpeg, ../assets/club/Mypo_puntos.jpeg, ../assets/club/youtube.jpeg, ../services/firebase

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (31): Arquitectura del agente (reutilizable para WhatsApp futuro), Capa de abstracción LLM (llmRouter), Criterios de aceptación por fase, Cronograma estimado, Definición de "CRM 360° completo", Diccionario de intención comercial (v1), Estado actual del codebase, Fase 0 ✅ (+23 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (8): ProductGrid(), CTABanner(), AnimatedTitle(), HeroSlider(), SLIDES, HomePage(), StorePage(), useCatalogStore

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (6): EMPTY_BIZ, EMPTY_CLUB, EMPTY_FAQ, EMPTY_POLICIES, FAQ_TEMPLATE, KnowledgeBaseSection()

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (9): ESTADOS_CFG, PIE_COLORS, PRIORIDAD_CFG, cerrarReclamacion(), reabrirReclamacion(), resolverReclamacion(), calcularSLA(), contarDiasHabiles() (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (7): ESTADOS_COLOR, RANGOS, actualizarEstadoPedido(), asignarRepartidorPedido(), crearPedidoConTransaccion(), obtenerPedidosRango(), reestablecerStockPedidoConTransaccion()

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (3): episodios, featuredVideo, string

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (12): ../../components/admin/AdminApp, AdminLayout, AdminLoginPage, CajaDiaria, ConfiguracionEnviosCupones, CVRMDashboard, InventarioStock, PedidosDashboard (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (11): 1. Configuración de Meta Webhooks (Instagram y Facebook), 2. Configuración de YouTube Data API v3, 3. Pruebas Locales (Opcional con Ngrok), Guía de Configuración — Captación de Redes Sociales (Meta & YouTube), Paso 1.1: Crear la App de Meta, Paso 1.2: Configurar los Productos, Paso 1.3: Configurar el Webhook de Meta, Paso 1.4: Configurar los Secrets en Firebase (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): Contract, Loading protocol, Skill Registry — missy-po, Skills, Sources scanned

### Community 46 - "Community 46"
Cohesion: 0.11
Nodes (12): CATEGORIAS, ProductoFormModal(), productoVacio, ProductSchema, storage, actualizarProducto(), actualizarStockProductoAdmin(), crearProducto() (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.39
Nodes (3): LiveSearch(), useDebounce(), useSearchStore

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (5): Footer(), FOOTER_LINKS, Layout(), Navbar(), WhatsAppFloat()

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (3): app, db, firebaseConfig

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (4): CartHoverPopup(), MARQUEE_ITEMS, MarqueeBanner(), NAV_CATEGORIES

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 54 - "Community 54"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 55 - "processSocialEvent.js"
Cohesion: 0.11
Nodes (14): emailWebhook, sendCampaign, getKnowledge, recomputeLeadScores, recomputeSegments, refreshProductCatalog, sendHumanMessage, sendTelegramMessage() (+6 more)

### Community 56 - "firebase/firestore"
Cohesion: 0.22
Nodes (5): firebase/firestore, CampaignBuilder(), listSegments(), auth, firebaseConfig

### Community 57 - "reviews.js"
Cohesion: 0.24
Nodes (6): ESTADO_CFG, actualizarEstadoResena(), crearResena(), eliminarResena(), obtenerResenas(), obtenerResenasPorProducto()

### Community 58 - "scripts"
Cohesion: 0.11
Nodes (8): CRM_TOOLS, resolverConsultarEnvios(), resolverConsultarMediosPago(), resolverObtenerInfoNegocio(), TOOL_RESOLVERS, callDeepSeek(), callLLM(), mockPost

### Community 59 - "Collection: `crm_campaigns`"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Brevo integration, Collection: `crm_campaigns`, Consent enforcement, Document shape, Purpose, Spec — CRM Campaigns (crm_campaigns)

### Community 60 - "Collection: `crm_leads`"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Collection: `crm_leads`, Purpose, Required fields on create, Scoring v1, Spec — CRM Leads (crm_leads), Stage machine

### Community 61 - "Collection: `crm_segments`"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Collection: `crm_segments`, Document shape, Purpose, Seeded segments, Spec — CRM Segments (crm_segments), Supported operators (v1)

### Community 62 - "Spec — Telegram IA Agent (crm_bot_config/telegram)"
Cohesion: 0.25
Nodes (7): Acceptance criteria, Agent tools (5 — scoped to business), Architecture, Firestore: crm_bot_config/telegram, LLM provider, Purpose, Spec — Telegram IA Agent (crm_bot_config/telegram)

### Community 63 - "backfill-checkout-leads.js"
Cohesion: 0.33
Nodes (6): backfillCheckoutLeads(), db, __dirname, DRY_RUN, findLeadByEmail(), LIMIT_ARG

### Community 64 - "Spec — Social Lead Capture (Meta IG/FB + YouTube)"
Cohesion: 0.29
Nodes (6): Acceptance criteria, Capture logic, Intent dictionary (v1 — commercial intent), Meta webhook security, Purpose, Spec — Social Lead Capture (Meta IG/FB + YouTube)

### Community 65 - "package.json"
Cohesion: 0.22
Nodes (13): ALLOWED_DOCS, ALLOWED_FIELDS, saveKnowledge, clearKnowledgeCache(), filterFaq(), formatClub(), formatDevoluciones(), formatEnvios() (+5 more)

### Community 66 - "migrate-club-to-leads.js"
Cohesion: 0.40
Nodes (3): db, __dirname, DRY_RUN

### Community 67 - "reclamaciones.astro"
Cohesion: 0.15
Nodes (8): resolverCrearPedido(), resolverSendProductPhoto(), getApiKeysStatus, ALLOWED_FIELDS, saveApiKeys, clearConfigCache(), ENV_DEFAULTS, getMaskedKeys()

### Community 68 - "CVRMDashboard.jsx"
Cohesion: 0.27
Nodes (8): generateProductCatalog, buildCatalogCSV(), buildCatalogJSON(), checkCatalogStatus(), generateCatalog(), getCatalog(), getCatalogCSV(), loadProducts()

### Community 69 - "LeadsKanban.jsx"
Cohesion: 0.25
Nodes (7): description, engines, node, main, name, private, type

### Community 72 - "config.js"
Cohesion: 0.21
Nodes (6): SegmentList(), createSegment(), deleteSegment(), evaluateRule(), evaluateSegment(), updateSegment()

### Community 73 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, astro, @astrojs/react, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, firebase, html2canvas (+8 more)

### Community 74 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, astro, build, dev, lint, preview, start, test (+1 more)

### Community 75 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 78 - "index.js"
Cohesion: 0.18
Nodes (8): CONFIG_TABS, CouponSchema, ShippingConfigSchema, guardarConfiguracionEnvio(), actualizarEstadoCupon(), crearCupon(), eliminarCupon(), obtenerCupones()

### Community 80 - "CajaDiaria.jsx"
Cohesion: 0.33
Nodes (6): abrirCajaDiaria(), cerrarCajaDiaria(), obtenerCajaActiva(), obtenerHistorialCajas(), obtenerVentasConfirmadasDia(), registrarTransaccionManual()

### Community 81 - "LeadsKanban.jsx"
Cohesion: 0.43
Nodes (5): AddressSchema, PetFormSchema, PetSchema, UserPreferencesSchema, UserProfileSchema

### Community 82 - "functions"
Cohesion: 0.33
Nodes (6): dependencies, axios, firebase-admin, firebase-functions, telegraf, functions

### Community 83 - "ApiKeysSection.jsx"
Cohesion: 0.29
Nodes (5): ApiKeysSection(), FIELDS, TABS, GuideModal(), GUIDES

### Community 84 - "TelegramAgentPanel.jsx"
Cohesion: 0.33
Nodes (5): DEFAULT_ESCALATION, DEFAULT_PERSONALITY, formatDate(), TelegramAgentPanel(), TONE_OPTIONS

### Community 85 - "emailProvider.js"
Cohesion: 0.19
Nodes (8): CampaignList(), FIELDS, OPERATORS, SegmentBuilder(), ClubMembersTab(), PointsTab(), TABS, listLeads()

### Community 86 - "LeadsKanban.jsx"
Cohesion: 0.31
Nodes (6): LeadCard(), relativeTime(), scoreColor(), SOURCE_ICONS, COLUMNS, LeadsKanban()

### Community 87 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, deploy, lint, logs, serve, shell, start, test

### Community 88 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, eslint, eslint-plugin-import, vitest

## Knowledge Gaps
- **444 isolated node(s):** `name`, `description`, `serve`, `shell`, `start` (+439 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `firebase` connect `dependencies` to `firebase/firestore`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `../layouts/Layout.astro` connect `Community 8` to `Community 33`, `Community 35`, `reclamaciones.astro`, `mi-cuenta.astro`, `Community 9`, `Community 41`, `Community 42`, `Community 12`, `carrito.astro`, `Community 15`, `Community 48`, `Community 50`, `Community 19`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getApiKeys()` (e.g. with `resolverCrearPedido()` and `resolverSendProductPhoto()`) actually correct?**
  _`getApiKeys()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `description`, `serve` to the rest of the system?**
  _444 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0701344243132671 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._