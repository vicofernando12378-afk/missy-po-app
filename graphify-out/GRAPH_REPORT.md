# Graph Report - .  (2026-06-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 308 nodes · 442 edges · 29 communities (23 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c7ce5263`
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

## God Nodes (most connected - your core abstractions)
1. `useCartStore` - 17 edges
2. `useCatalogStore` - 11 edges
3. `scripts` - 9 edges
4. `../layouts/Layout.astro` - 8 edges
5. `ProductPage()` - 5 edges
6. `obtenerTodosProductosAdmin()` - 5 edges
7. `CartDrawer()` - 4 edges
8. `ProductCard()` - 4 edges
9. `LiveSearch()` - 4 edges
10. `auth` - 4 edges

## Surprising Connections (you probably didn't know these)
- `CartDrawerItem()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/cartStore.js
- `CartDrawer()` --calls--> `useCatalogStore`  [EXTRACTED]
  src/components/cart/CartDrawer.jsx → src/store/catalogStore.js
- `ProductCard()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/catalog/ProductCard.jsx → src/store/cartStore.js
- `CartHoverPopup()` --calls--> `useCartStore`  [EXTRACTED]
  src/components/header/CartHoverPopup.jsx → src/store/cartStore.js
- `CheckoutPage()` --calls--> `useCartStore`  [EXTRACTED]
  src/pages/CheckoutPage.jsx → src/store/cartStore.js

## Import Cycles
- None detected.

## Communities (29 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (28): CajaDiaria(), ConfiguracionEnviosCupones(), InventarioStock(), PedidosDashboard(), ESTADO_CFG, ResenasDashboard(), ESTADOS_COLOR, RANGOS (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (16): ../pages/HomePage, ./StorePage.jsx, ProductCard(), MOCK_PRODUCTS, ProductGrid(), CTABanner(), LiveSearch(), AnimatedTitle() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (29): devDependencies, autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, postcss (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (12): AdminLayout(), ../../components/admin/AdminApp, ../index.css, ./LoginPage.jsx, ./NotFoundPage.jsx, ../../pages/OrderConfirmationPage.jsx, LoginPage(), NotFoundPage() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (13): ../components/legal/ReclamacionesForm.jsx, ../../data/blog-posts, ../data/blog-posts.js, ../layouts/Layout.astro, articulosBlog, articulos, categorias, emptyState (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (8): ./CartPage.jsx, CartDrawer(), CartDrawerItem(), CartHoverPopup(), CartPage(), obtenerProductosMasVendidos(), CartFloat(), useCartStore

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (7): Footer(), FOOTER_LINKS, Layout(), NAV_CATEGORIES, Navbar(), WHATSAPP_MESSAGE, WhatsAppFloat()

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (13): CATEGORIAS, ProductoFormModal(), productoVacio, ProductosCRUD(), ../../pages/ProductPage.jsx, ../../services/firestore, getStaticPaths(), storage (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (6): PriceDisplay(), SaleBadge(), cleanDescription(), ProductPage(), crearResena(), obtenerResenasPorProducto()

### Community 9 - "Community 9"
Cohesion: 0.20
Nodes (8): ./CheckoutPage.jsx, PaymentMpBrick(), PaymentQrCulqi(), AREQUIPA_DISTRICTS, CheckoutPage(), LIMA_REGIONS, crearPedidoConTransaccion(), obtenerConfiguracionEnvio()

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (10): app, cleanVal(), DATABASE_SQL, db, firebaseConfig, parsePHPSerialize(), parseSqlValues(), runMigration() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (11): dependencies, astro, @astrojs/react, firebase, html2canvas, jspdf, react, react-dom (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (3): app, db, firebaseConfig

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (3): app, db, firebaseConfig

### Community 17 - "Community 17"
Cohesion: 0.40
Nodes (3): __dirname, __filename, SERVICE_ACCOUNT_PATH

## Knowledge Gaps
- **92 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+87 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useCartStore` connect `Community 5` to `Community 8`, `Community 1`, `Community 9`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useCatalogStore` connect `Community 1` to `Community 8`, `Community 5`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _92 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07973421926910298 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._