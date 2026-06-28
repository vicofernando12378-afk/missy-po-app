# Graph Report - missy-po  (2026-06-27)

## Corpus Check
- 92 files · ~247,458 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 434 nodes · 609 edges · 31 communities (28 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2d6dfad1`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `../layouts/Layout.astro` - 29 edges
2. `useCartStore` - 19 edges
3. `🧩 COMPONENTES UI — ESPECIFICACIONES EXACTAS` - 17 edges
4. `3. BUGS CRÍTICOS ENCONTRADOS` - 13 edges
5. `🐾 MISSY & PO PET SHOP — MASTER CONTEXT FILE` - 12 edges
6. `useCatalogStore` - 11 edges
7. `scripts` - 9 edges
8. `🐾 DIAGNÓSTICO TÉCNICO — Missy & Po Pet Shop` - 9 edges
9. `Plan de Implementación: Checkout y Pasarelas de Pago (Fase 4)` - 7 edges
10. `Missy & Po Pet Shop — AI Context` - 6 edges

## Surprising Connections (you probably didn't know these)
- `CartDrawerItem()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/cartStore.js
- `CartDrawer()` --calls--> `useCatalogStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/catalogStore.js
- `ProductCard()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/catalog/ProductCard.jsx → src/store/cartStore.js
- `CheckoutPage()` --calls--> `useCartStore`  [EXTRACTED]
  src/pages/CheckoutPage.jsx → src/store/cartStore.js
- `ProductPage()` --calls--> `useCartStore`  [EXTRACTED]
  src/pages/ProductPage.jsx → src/store/cartStore.js

## Import Cycles
- None detected.

## Communities (31 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (49): AdminLayout(), CajaDiaria(), ConfiguracionEnviosCupones(), CVRMDashboard(), TABS, InventarioStock(), PedidosDashboard(), CATEGORIAS (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (15): ./StorePage.jsx, ../services/firestore.js, MOCK_PRODUCTS, ProductGrid(), CTABanner(), LiveSearch(), AnimatedTitle(), HeroSlider() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (29): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (3): app, db, firebaseConfig

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (23): ../assets/club/cumple.jpeg, ../assets/club/descuentos.jpeg, ../assets/club/enviorapido.jpeg, ../assets/club/exclusivo.jpeg, ../assets/club/Mypo_puntos.jpeg, ../assets/club/youtube.jpeg, ../assets/logoheader.jpeg, ../components/cart/CartDrawer (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): 1. Análisis General de la Aplicación, 2. Mapa de Rutas y Páginas, 3. BUGS CRÍTICOS ENCONTRADOS, 4. Funcionalidades Incompletas / Pendientes en el Admin, 5. Análisis del Flujo de Carrito y Checkout, 6. Análisis de la Calidad del Código, 7. Plan de Corrección Priorizado, 8. Recomendaciones de Arquitectura a Mediano Plazo (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (16): CartDrawer(), CartDrawerItem(), CartHoverPopup(), MARQUEE_ITEMS, MarqueeBanner(), Footer(), FOOTER_LINKS, Layout() (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (37): 10. PRODUCT CARD (Tarjeta de producto), 11. PRODUCT DETAIL PAGE (Ficha de Producto), 12. CHECKOUT PAGE, 13. MI CUENTA (Account Dashboard), 14. CTA BANNER (Pre-Footer), 15. FOOTER (3 columnas fijas sobre fondo blanco), 16. ELEMENTOS FLOTANTES PERMANENTES, 1. NAVBAR (Header Sticky) (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (8): ../../data/blog-posts, ../data/blog-posts.js, articulosBlog, articulos, categorias, emptyState, form, searchInput

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (7): ./CheckoutPage.jsx, PaymentMpBrick(), PaymentQrCulqi(), AREQUIPA_DISTRICTS, CheckoutPage(), LIMA_REGIONS, crearPedidoConTransaccion()

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (10): app, cleanVal(), DATABASE_SQL, db, firebaseConfig, parsePHPSerialize(), parseSqlValues(), runMigration() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (11): dependencies, astro, @astrojs/react, firebase, html2canvas, jspdf, react, react-dom (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (6): app, db, firebaseConfig, app, db, firebaseConfig

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (12): ../../pages/ProductPage.jsx, ../../services/firestore, PriceDisplay(), ProductCard(), SaleBadge(), cleanDescription(), ProductPage(), getStaticPaths() (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

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

## Knowledge Gaps
- **182 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `../layouts/Layout.astro` connect `Community 4` to `Community 0`, `Community 1`, `Community 6`, `Community 8`, `Community 9`, `Community 13`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `useCartStore` connect `Community 6` to `Community 9`, `Community 13`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `useCatalogStore` connect `Community 1` to `Community 13`, `Community 6`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1164021164021164 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._