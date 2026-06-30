# Graph Report - missy-po  (2026-06-29)

## Corpus Check
- 133 files · ~261,439 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 627 nodes · 918 edges · 48 communities (42 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3fd4559b`
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
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
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

## God Nodes (most connected - your core abstractions)
1. `../layouts/Layout.astro` - 29 edges
2. `useCartStore` - 19 edges
3. `🧩 COMPONENTES UI — ESPECIFICACIONES EXACTAS` - 17 edges
4. `3. BUGS CRÍTICOS ENCONTRADOS` - 13 edges
5. `Plan de Acción: Seguridad, Arquitectura y Deuda Técnica — Missy & Po Pet Shop` - 13 edges
6. `🐾 MISSY & PO PET SHOP — MASTER CONTEXT FILE` - 12 edges
7. `useCatalogStore` - 11 edges
8. `Plan de Acción: Implementación de Zod en Missy & Po Pet Shop` - 11 edges
9. `Fase 1 — Schemas Base (archivos nuevos)` - 11 edges
10. `validate()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CartDrawerItem()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/cartStore.js
- `CartDrawer()` --calls--> `useCatalogStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/catalogStore.js
- `ProductCard()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/catalog/ProductCard.jsx → src/store/cartStore.js
- `LiveSearch()` --calls--> `useCatalogStore`  [EXTRACTED]
  src/components/header/LiveSearch.jsx → src/store/catalogStore.js
- `Navbar()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/layout/Navbar.jsx → src/store/cartStore.js

## Import Cycles
- None detected.

## Communities (48 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (11): InventarioStock(), CATEGORIAS, ProductoFormModal(), productoVacio, ProductosCRUD(), storage, actualizarProducto(), actualizarStockProductoAdmin() (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (11): ../pages/HomePage, MOCK_PRODUCTS, ProductGrid(), CTABanner(), AnimatedTitle(), HeroSlider(), SLIDES, HomePage() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (41): dependencies, astro, @astrojs/react, firebase, html2canvas, jspdf, react, react-dom (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (25): AdminLoginPage(), AdminSidebar(), firebase/firestore, LoginPage(), app, db, firebaseConfig, app (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (10): ../assets/logoheader.jpeg, ../components/cart/CartDrawer, ../components/layout/Footer, ../components/layout/Navbar, ../components/legal/ReclamacionesForm.jsx, ../components/shared/CartFloat, ../components/shared/WhatsAppFloat, ./CartPage.jsx (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): 1. Análisis General de la Aplicación, 2. Mapa de Rutas y Páginas, 3. BUGS CRÍTICOS ENCONTRADOS, 4. Funcionalidades Incompletas / Pendientes en el Admin, 5. Análisis del Flujo de Carrito y Checkout, 6. Análisis de la Calidad del Código, 7. Plan de Corrección Priorizado, 8. Recomendaciones de Arquitectura a Mediano Plazo (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (7): Footer(), FOOTER_LINKS, Layout(), Navbar(), CartFloat(), WHATSAPP_MESSAGE, WhatsAppFloat()

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (37): 10. PRODUCT CARD (Tarjeta de producto), 11. PRODUCT DETAIL PAGE (Ficha de Producto), 12. CHECKOUT PAGE, 13. MI CUENTA (Account Dashboard), 14. CTA BANNER (Pre-Footer), 15. FOOTER (3 columnas fijas sobre fondo blanco), 16. ELEMENTOS FLOTANTES PERMANENTES, 1. NAVBAR (Header Sticky) (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (8): ../../data/blog-posts, ../data/blog-posts.js, articulosBlog, articulos, categorias, emptyState, form, searchInput

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (26): CajaDiaria(), AperturaCajaSchema, CierreCajaSchema, MovimientoSchema, CartItemSchema, CartStateSchema, CheckoutSchema, CouponSchema (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (10): app, cleanVal(), DATABASE_SQL, db, firebaseConfig, parsePHPSerialize(), parseSqlValues(), runMigration() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (45): 1. Nuevo archivo: `src/services/auth.js`, 2. Nuevo archivo: `src/pages/AdminLoginPage.jsx`, 3. Modificar `src/pages/LoginPage.jsx` — Solo clientes, 4. Modificar `src/pages/admin/AdminLayout.jsx`, 5. Actualizar rutas en `src/pages/admin/[...all].astro` y `src/components/admin/AdminApp.jsx`, 6. Actualizar `src/pages/admin/AdminLayout.jsx`, Archivos a crear: `src/utils/sanitize.js`, Archivos a modificar: (+37 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (16): CheckoutForm(), ClubSection(), ContactFields(), CouponSection(), DocumentFields(), OrderSummary(), PaymentMethods(), PaymentMpBrick() (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (29): 0.1 Instalar dependencia, 0.2 Crear estructura de schemas, 1.10 `src/schemas/index.js` (barrel), 1.1 `src/schemas/product.js`, 1.2 `src/schemas/checkout.js`, 1.3 `src/schemas/cart.js`, 1.4 `src/schemas/coupon.js`, 1.5 `src/schemas/shippingConfig.js` (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (8): CartDrawer(), CartDrawerItem(), CartHoverPopup(), CartPage(), CheckoutPage(), validarCupon(), obtenerProductosMasVendidos(), useCartStore

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (7): ../assets/club/cumple.jpeg, ../assets/club/descuentos.jpeg, ../assets/club/enviorapido.jpeg, ../assets/club/exclusivo.jpeg, ../assets/club/Mypo_puntos.jpeg, ../assets/club/youtube.jpeg, ../services/firebase

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): __dirname, __filename, SERVICE_ACCOUNT_PATH

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (12): 1. Análisis de la App / Requerimiento Actual, 2. ¿Por qué hacer este cambio? / Beneficios, 3. Arquitectura Propuesta (File Tree), 4. User Review Required (Alertas Críticas), 5. Open Questions, 6. Fases de Implementación (Proposed Changes), Fase 1: Implementación de la Vista de Carrito Detallado (`CartPage`), Fase 2: Lógica Transaccional de Pedidos (`firestore.js`) (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (8): 1. Página de Carrito Detallada (`CartPage.jsx`), 2. Formulario de Checkout Inteligente (`CheckoutPage.jsx`), 3. Pasarelas de Pago Interactivas (Simuladores Premium), 4. Transacción Atómica de Stock (`firestore.js`), 5. Página de Éxito y Boleta Térmica (`OrderConfirmationPage.jsx`), 📊 Flujo Probado y Verificado, 🌟 Lo que hemos logrado, Walkthrough: Integración de Checkout, Métodos de Pago y Transacciones de Stock

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): Archivos Creados / Modificados, Decisiones Técnicas Tomadas, Estado Actual, Missy & Po Pet Shop — AI Context, Siguientes Pasos, Stack Actual

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (4): ¿Cómo usarlas en páginas Astro?, Estructura de carpetas, Naming convention, 📁 src/assets — Imágenes Optimizadas por Astro

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): episodios, featuredVideo, string

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (16): 1.1 — Separar `firestore.js` en módulos domain-oriented, 1.2 — Descomponer `CheckoutPage.jsx` en componentes y hooks, 1.3 — Code splitting con React.lazy para rutas admin, 2.1 — Extraer sidebar admin reutilizable, 2.2 — Limpiar dynamic imports en cartStore, 2.3 — Unificar campo de estado en pedidos, 2.4 — Mapeo de categorías desde Firestore, 3.1 — Extraer constantes hardcodeadas de CheckoutPage (+8 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (12): AdminLayout, AdminLoginPage, CajaDiaria, ConfiguracionEnviosCupones, CVRMDashboard, InventarioStock, PedidosDashboard, ProductosCRUD (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (11): AdminLayout(), ConfiguracionEnviosCupones(), NotFoundPage(), AdminLayout, CajaDiaria, ConfiguracionEnviosCupones, InventarioStock, PedidosDashboard (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (5): PriceDisplay(), ProductCard(), SaleBadge(), cleanDescription(), ProductPage()

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (7): ESTADO_CFG, ResenasDashboard(), actualizarEstadoResena(), crearResena(), eliminarResena(), obtenerResenas(), obtenerResenasPorProducto()

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (3): MARQUEE_ITEMS, MarqueeBanner(), NAV_CATEGORIES

### Community 41 - "Community 41"
Cohesion: 0.32
Nodes (5): PedidosDashboard(), actualizarEstadoPedido(), asignarRepartidorPedido(), crearPedidoConTransaccion(), reestablecerStockPedidoConTransaccion()

### Community 42 - "Community 42"
Cohesion: 0.39
Nodes (3): LiveSearch(), useDebounce(), useSearchStore

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (3): ../../components/admin/AdminApp, ../../index.css, App()

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (4): ESTADOS_COLOR, RANGOS, VentasDashboard(), obtenerPedidosRango()

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): Contract, Loading protocol, Skill Registry — missy-po, Skills, Sources scanned

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (3): ../../pages/ProductPage.jsx, ./StorePage.jsx, ../services

## Knowledge Gaps
- **272 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `../layouts/Layout.astro` connect `Community 4` to `Community 32`, `Community 33`, `Community 1`, `Community 35`, `Community 6`, `Community 8`, `Community 40`, `Community 43`, `Community 14`, `Community 47`, `Community 16`, `Community 46`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `useCartStore` connect `Community 14` to `Community 40`, `Community 12`, `Community 38`, `Community 6`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `../../index.css` connect `Community 43` to `Community 4`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _272 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06183574879227053 - nodes in this community are weakly interconnected._