# Graph Report - missy-po  (2026-06-30)

## Corpus Check
- 164 files · ~274,611 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 744 nodes · 1092 edges · 42 communities (33 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f938242`
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
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]

## God Nodes (most connected - your core abstractions)
1. `../layouts/Layout.astro` - 30 edges
2. `useCartStore` - 19 edges
3. `🧩 COMPONENTES UI — ESPECIFICACIONES EXACTAS` - 17 edges
4. `3. BUGS CRÍTICOS ENCONTRADOS` - 13 edges
5. `Plan de Acción: Seguridad, Arquitectura y Deuda Técnica — Missy & Po Pet Shop` - 13 edges
6. `useUserStore` - 12 edges
7. `🐾 MISSY & PO PET SHOP — MASTER CONTEXT FILE` - 12 edges
8. `useCatalogStore` - 11 edges
9. `Plan de Acción: Implementación de Zod en Missy & Po Pet Shop` - 11 edges
10. `Fase 1 — Schemas Base (archivos nuevos)` - 11 edges

## Surprising Connections (you probably didn't know these)
- `CartDrawerItem()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/cartStore.js
- `CartDrawer()` --calls--> `useCatalogStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/catalogStore.js
- `ProductCard()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/catalog/ProductCard.jsx → src/store/cartStore.js
- `useUserProfile()` --calls--> `useUserStore`  [EXTRACTED]
  src/hooks/useUserProfile.js → src/store/userStore.js
- `ProductPage()` --calls--> `useCartStore`  [EXTRACTED]
  src/pages/ProductPage.jsx → src/store/cartStore.js

## Import Cycles
- 1-file cycle: `src/services/auth.js -> src/services/auth.js`
- 3-file cycle: `src/App.jsx -> src/pages/OrderConfirmationPage.jsx -> src/services/firebase.js -> src/App.jsx`
- 4-file cycle: `src/App.jsx -> src/pages/LoginPage.jsx -> src/services/auth.js -> src/services/firebase.js -> src/App.jsx`
- 4-file cycle: `src/App.jsx -> src/pages/CheckoutPage.jsx -> src/components/checkout/CheckoutForm.jsx -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/components/layout/Layout.jsx -> src/components/layout/Navbar.jsx -> src/services/auth.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/reclamaciones.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/cashRegister.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/config.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/coupons.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/orders.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/products.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/reviews.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/ProductPage.jsx -> src/services/index.js -> src/services/userProfile.js -> src/services/firebase.js -> src/App.jsx`
- 5-file cycle: `src/App.jsx -> src/pages/CheckoutPage.jsx -> src/components/checkout/CheckoutForm.jsx -> src/hooks/useClubMembership.js -> src/services/firebase.js -> src/App.jsx`

## Communities (42 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (32): DEPARTAMENTOS_DATA, AperturaCajaSchema, CierreCajaSchema, MovimientoSchema, CartItemSchema, CartStateSchema, CheckoutSchema, CouponSchema (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (26): firebase/firestore, AddressForm(), OrderTimeline(), TIMELINE_STEPS, PetForm(), useOrdersByUser(), useUserProfile(), AccountPage() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (45): dependencies, astro, @astrojs/react, firebase, html2canvas, jspdf, react, react-dom (+37 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (17): CheckoutForm(), ClubSection(), ContactFields(), CouponSection(), DocumentFields(), OrderSummary(), PaymentMethods(), PaymentMpBrick() (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): 1. Análisis General de la Aplicación, 2. Mapa de Rutas y Páginas, 3. BUGS CRÍTICOS ENCONTRADOS, 4. Funcionalidades Incompletas / Pendientes en el Admin, 5. Análisis del Flujo de Carrito y Checkout, 6. Análisis de la Calidad del Código, 7. Plan de Corrección Priorizado, 8. Recomendaciones de Arquitectura a Mediano Plazo (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (25): 1.2 — Descomponer `CheckoutPage.jsx` (973 líneas), 1.3 — Code splitting con React.lazy para rutas admin, 2.1 — Extraer sidebar admin reutilizable, 2.2 — Limpiar dynamic imports en cartStore.js, 2.3 — Unificar campo estado en pedidos, 2.4 — Mapeo de categorías desde Firestore, 3.1 — Extraer constantes hardcodeadas de CheckoutPage, 3.2 — Agregar JSDoc a funciones de services (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (37): 10. PRODUCT CARD (Tarjeta de producto), 11. PRODUCT DETAIL PAGE (Ficha de Producto), 12. CHECKOUT PAGE, 13. MI CUENTA (Account Dashboard), 14. CTA BANNER (Pre-Footer), 15. FOOTER (3 columnas fijas sobre fondo blanco), 16. ELEMENTOS FLOTANTES PERMANENTES, 1. NAVBAR (Header Sticky) (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (9): ../assets/logoheader.jpeg, ../components/cart/CartDrawer, ../components/layout/Footer, ../components/layout/Navbar, ../components/legal/ReclamacionesForm.jsx, ../components/shared/CartFloat, ../components/shared/WhatsAppFloat, ./NotFoundPage.jsx (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (18): CartDrawer(), CartDrawerItem(), CartHoverPopup(), MARQUEE_ITEMS, MarqueeBanner(), Footer(), FOOTER_LINKS, Layout() (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (10): app, cleanVal(), DATABASE_SQL, db, firebaseConfig, parsePHPSerialize(), parseSqlValues(), runMigration() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (45): 1. Nuevo archivo: `src/services/auth.js`, 2. Nuevo archivo: `src/pages/AdminLoginPage.jsx`, 3. Modificar `src/pages/LoginPage.jsx` — Solo clientes, 4. Modificar `src/pages/admin/AdminLayout.jsx`, 5. Actualizar rutas en `src/pages/admin/[...all].astro` y `src/components/admin/AdminApp.jsx`, 6. Actualizar `src/pages/admin/AdminLayout.jsx`, Archivos a crear: `src/utils/sanitize.js`, Archivos a modificar: (+37 more)

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (6): ../data/blog-posts.js, articulos, categorias, emptyState, form, searchInput

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (29): 0.1 Instalar dependencia, 0.2 Crear estructura de schemas, 1.10 `src/schemas/index.js` (barrel), 1.1 `src/schemas/product.js`, 1.2 `src/schemas/checkout.js`, 1.3 `src/schemas/cart.js`, 1.4 `src/schemas/coupon.js`, 1.5 `src/schemas/shippingConfig.js` (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (16): 1.1 — Separar `firestore.js` en módulos domain-oriented, 1.2 — Descomponer `CheckoutPage.jsx` en componentes y hooks, 1.3 — Code splitting con React.lazy para rutas admin, 2.1 — Extraer sidebar admin reutilizable, 2.2 — Limpiar dynamic imports en cartStore, 2.3 — Unificar campo de estado en pedidos, 2.4 — Mapeo de categorías desde Firestore, 3.1 — Extraer constantes hardcodeadas de CheckoutPage (+8 more)

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

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (12): AccountDashboard(), AccountHeader(), ContentFeed(), OrderCard(), STATUS_MAP, PointsBalance(), SmartCTA(), ACTIVE_STATES (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.04
Nodes (28): ../../index.css, app, db, firebaseConfig, app, db, firebaseConfig, app (+20 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (7): ../assets/club/cumple.jpeg, ../assets/club/descuentos.jpeg, ../assets/club/enviorapido.jpeg, ../assets/club/exclusivo.jpeg, ../assets/club/Mypo_puntos.jpeg, ../assets/club/youtube.jpeg, ../services/firebase

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (29): ../../pages/ProductPage.jsx, ./StorePage.jsx, ../services, PriceDisplay(), ProductCard(), MOCK_PRODUCTS, ProductGrid(), SaleBadge() (+21 more)

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (3): episodios, featuredVideo, string

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (12): ../../components/admin/AdminApp, AdminLayout, AdminLoginPage, CajaDiaria, ConfiguracionEnviosCupones, CVRMDashboard, InventarioStock, PedidosDashboard (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): Contract, Loading protocol, Skill Registry — missy-po, Skills, Sources scanned

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (19): CATEGORIAS, ProductoFormModal(), productoVacio, TABS, ESTADOS_COLOR, RANGOS, firebaseConfig, storage (+11 more)

## Knowledge Gaps
- **310 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+305 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `../layouts/Layout.astro` connect `Community 8` to `Community 33`, `Community 35`, `Community 4`, `Community 37`, `Community 9`, `Community 41`, `Community 42`, `Community 12`, `Community 44`, `Community 15`, `Community 16`, `Community 19`, `Community 24`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `firebase` connect `Community 2` to `Community 46`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _310 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0672316384180791 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11794871794871795 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09659090909090909 - nodes in this community are weakly interconnected._