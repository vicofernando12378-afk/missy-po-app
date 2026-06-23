# 🐾 MISSY & PO PET SHOP — MASTER CONTEXT FILE
> Archivo de referencia técnica y visual completo para el agente de IA.
> Generado el: 2026-05-27 tras auditoría visual y estructural del sitio WordPress original.
> **LEER ESTE ARCHIVO ANTES DE ESCRIBIR CUALQUIER LÍNEA DE CÓDIGO.**

---

## 🎯 PROPÓSITO DEL PROYECTO

Relanzamiento de la tienda virtual "Missy & Po Pet Shop" (venta de ropa y accesorios para mascotas en Perú).
- Stack nuevo: **React + Vite + Tailwind CSS + Firebase**
- Hosting: **Firebase Hosting** (CDN global, < 1 segundo de carga)
- Base de datos: **Cloud Firestore** (prefijo de colecciones: `myp_`)
- Auth: **Firebase Authentication** (email/pass + Google OAuth)
- Imágenes: **Firebase Storage** (`myp/productos/{sku}/`)
- Enfoque: **Mobile-First** para tráfico orgánico de TikTok e Instagram (Perú)
- Proyecto Firebase: **NUEVO** (exclusivo para esta app, sin apps hermanas)

---

## 🎨 DESIGN SYSTEM — TOKENS DE COLOR EXACTOS

```css
:root {
  /* ═══ COLORES PRIMARIOS ═══ */
  --color-coral:        #E56A6A;   /* Navbar bg, botones CTA principales */
  --color-coral-dark:   #C85A5A;   /* Hover state de coral */
  --color-coral-light:  #F08080;   /* Estados secundarios */

  /* ═══ FONDOS DE PÁGINA ═══ */
  --color-salmon-bg:    #F4A0A0;   /* Fondo general de la página (rosa pastel) */
  --color-page-bg:      #FAD4D4;   /* Versión más clara del fondo */

  /* ═══ GRADIENTE DEL CATÁLOGO (bg-gradient-to-b) ═══ */
  --grad-catalog-from:  #F4A0A0;   /* Inicio arriba: Rosa pastel/salmón */
  --grad-catalog-to:    #F5A623;   /* Final abajo: Naranja cálido/oro */
  /* Tailwind: from-[#F4A0A0] to-[#F5A623] */

  /* ═══ ACENTOS ═══ */
  --color-sale-green:   #22C55E;   /* Badge circular "Sale!" en tarjetas */
  --color-price-green:  #16A34A;   /* Precio de oferta en tarjetas y fichas */
  --color-price-strike: #9CA3AF;   /* Precio tachado (gris) */
  --color-yellow-cta:   #FBBF24;   /* Banner CTA pre-footer (amarillo sólido brillante) */
  --color-whatsapp:     #25D366;   /* Botón WhatsApp flotante */
  --color-star:         #F59E0B;   /* Estrellas de valoración */

  /* ═══ NEUTRALES ═══ */
  --color-text-dark:    #1F2937;   /* Títulos principales */
  --color-text-gray:    #6B7280;   /* Texto secundario, metadatos */
  --color-footer-bg:    #FFFFFF;   /* Footer blanco puro */
  --color-card-btn:     #111827;   /* Botón "Add to cart" negro sólido */

  /* ═══ TIPOGRAFÍA ═══ */
  --font-brand:    'Dancing Script', cursive;  /* Títulos hero animados "NOVEDADES..." */
  --font-body:     'Inter', sans-serif;        /* Cuerpo, descripciones */
  --font-ui:       'Poppins', sans-serif;      /* Navegación, labels, botones */
}
```

### Tailwind Config Extensions (tailwind.config.js)
```js
theme: {
  extend: {
    colors: {
      coral:  { DEFAULT: '#E56A6A', dark: '#C85A5A', light: '#F08080' },
      salmon: { DEFAULT: '#F4A0A0' },
      'price-green': '#16A34A',
      'sale-green':  '#22C55E',
      'cta-yellow':  '#FBBF24',
      whatsapp:      '#25D366',
    },
    fontFamily: {
      brand: ['Dancing Script', 'cursive'],
      body:  ['Inter', 'sans-serif'],
      ui:    ['Poppins', 'sans-serif'],
    },
  }
}
```

---

## 🧩 COMPONENTES UI — ESPECIFICACIONES EXACTAS

### 1. NAVBAR (Header Sticky)
- `position: sticky; top: 0; z-index: 50`
- **Sección izquierda:** Caja beige clara con logo circular de la marca (Yorkie con texto "Missy & Po PET SHOP")
- **Sección central-derecha:** Bloque coral (`#E56A6A`) que contiene:
  - Barra de búsqueda: `rounded-full`, borde sutil color ámbar, placeholder EXACTO: **`¿HOLA!!! Que Buscas?`**
  - Menú de navegación 2 líneas:
    - Línea 1: `Ofertas | Novedades | Ropitas Missy & Po | Collares y Articulos | Seccion Comida Missy`
    - Línea 2: `Blog | Mi Cuenta`
- **Sección derecha:** `Cart / S/. X.XX` con ícono de bolsa + badge rojo con contador de ítems
- **Selector de moneda:** Pestañas `PEN` / `USD` flotando en el extremo derecho de la pantalla

### 2. LIVE SEARCH (Buscador Predictivo)
- Debounce: **300ms** antes de disparar la búsqueda
- Panel de resultados dividido en **2 columnas** al escribir:
  - **Columna izquierda (~40%):** Lista vertical de resultados:
    - Miniatura cuadrada ~40×40px
    - Nombre del producto en **negrita color coral** con el fragmento matching resaltado
    - SKU entre paréntesis debajo del nombre
    - Extracto de descripción truncado (máx. 80 chars)
    - Precio tachado + precio oferta alineados a la derecha
  - **Columna derecha (~60%):** Preview card del ítem seleccionado/hover:
    - Imagen grande
    - Nombre completo + precio
    - Descripción corta
    - Indicador de stock: `"N in stock"`
    - Input cantidad + botón `"Add to cart"` en coral `rounded-full`
- **Bug WP a eliminar:** Los datos de AliExpress venían con `&nbsp;` sin decodificar → limpiar en la ingesta

### 3. CART INDICATOR (en Navbar)
- Texto: `"Cart / S/. 9.00"` con ícono de bolsa de compras
- Badge rojo circular con número de ítems encima del ícono
- **Comportamiento hover (`onMouseEnter`):** Aparece `CartHoverPopup`
- **Comportamiento click (en botón flotante):** Abre `CartDrawer`

### 4. CART HOVER POPUP (mouseover en Cart Indicator)
- Popup flotante a la derecha del header, `drop-shadow-lg`
- Cabecera: texto gris `"View your shopping cart"`
- Fila por ítem: miniatura + nombre + `N × S/. precio`
- Subtotal centrado
- 2 botones coral full-width apilados:
  - `"View cart"` (va a /cart)
  - `"Checkout"` (va a /checkout)
- Desaparece al `onMouseLeave` (sin delay)

### 5. CART DRAWER (clic en botón flotante inferior-izquierda)
- Panel lateral **izquierdo**: `width: ~320px`, `fixed left-0 top-0 h-full z-50`
- Overlay oscuro semitransparente sobre el resto de la página
- **Cabecera:** `YOUR CART` en mayúsculas + botón X para cerrar
- Input de cupón: `[ Coupon code ] [ Apply ]` en la parte superior
- **Fila de ítem:** miniatura cuadrada + nombre + controles `[ - ] [ 1 ] [ + ]` + precio S/. alineado derecha
- **Pie:**
  - `Subtotal: S/. X.XX` alineado izquierda
  - Botón `CHECKOUT` en coral, full-width, resaltado
- **Zona inferior:** Sección `"BEST SELLING PRODUCTS"` — carrusel horizontal de 2-3 productos sugeridos con nombre y precio tachado/oferta
- **Nota arquitectónica:** Este drawer es el flujo primario Mobile-First. La página `/cart` es flujo secundario desktop.

### 6. HERO SLIDER
- Transición **cross-fade** (fundido cruzado), NO slide lateral
- Las imágenes se superponen y alternan con `opacity` transition cada ~4 segundos
- Texto hero: `"Ropitas y accesorios desde S/ 15"` en tipografía cursiva coral con sombra

### 7. MARQUEE BANNER (debajo del slider)
- Franja blanca delgada, texto desplazable de derecha a izquierda, velocidad media
- Contenido: `"Hacemos envíos a Nivel Nacional por Courier Shalom u Olva Express...... Aceptamos todas las tarjetas y múltiples formas de pago!!!!"`
- CSS: `animation: marquee 20s linear infinite`

### 8. ANIMATED TITLE (sección Novedades)
- Texto: **`NOVEDADES MISSY & PO!!!!`**
- Efecto: cada letra hace micro-salto de aparición secuencial (**Bounce in / Shuffle**)
- Estilo: stroke/delineado con gradiente **púrpura/magenta reflectante**
- Fondo de la sección: **fucsia/rosa vibrante** (`#E91E8C` aprox.)

### 9. PRODUCT GRID (Catálogo)
- Fondo: gradiente vertical `from-[#F4A0A0] to-[#F5A623]` (rosa pastel → naranja oro)
- Grid: `grid-cols-1 md:grid-cols-3` con `gap-6`
- Padding general: `px-4 py-8`

### 10. PRODUCT CARD (Tarjeta de producto)
- Contenedor: fondo transparente (muestra el degradado del catálogo)
- **Imagen:** `aspect-square`, bordes definidos, `object-cover`
- **Badge "Sale!":** Círculo verde sólido (`bg-green-600`), `position: absolute`, esquina superior derecha de la imagen, texto blanco bold
- **EAN visible:** Texto pequeño `"EAN: 7750000XXXXX"` en color coral/enlace clickeable
- **Categoría:** texto pequeño sobre el nombre
- **Nombre:** negrita oscura
- **Stars:** 5 estrellas (vacías si sin reseñas)
- **Precio:** `S/ 3000` tachado gris + `S/ 2500` verde vibrante (`#16A34A`) al lado
- **Botón:** `"Add to cart"` negro sólido (`bg-gray-900 text-white`), hover con cambio de opacidad, bordes rectos (no redondeados)

### 11. PRODUCT DETAIL PAGE (Ficha de Producto)
- Layout 2 columnas en desktop:
  - **Izquierda:** Imagen principal grande + grid de **8 miniaturas** en 4×2
  - **Derecha:** 
    - Badge `"Sale!"` en esquina
    - Nombre del producto (h1)
    - Precio tachado + precio oferta en coral
    - Selector de variante (bandera de Perú + dropdown de colores/tallas)
    - `Availability: N in stock (can be backordered)`
    - Input cantidad + botón `"Add to cart"` en coral `rounded-full`
    - Metadata: EAN, SKU, Categorías, Tags
- **Tabs debajo:** "Descripción" | "Reviews (N)"
- **Descripción:** Copywriting empático ej: `"Para los engreídos que no les gusta el collar"`
- **Sección "You may also like...":** Grid de productos misma categoría (con badge Sale!)
- **Sección "Related products":** Carrusel horizontal de productos relacionados

### 12. CHECKOUT PAGE
- Layout 2 columnas:
  - **Izquierda (Billing details):**
    - First name + Last name (row)
    - Company name (optional)
    - Country/Region (dropdown)
    - Street address (2 campos)
    - Town/City
    - State/County — **UBIGEO PERÚ** (cascada: Departamento → Provincia → Distrito, ~1800 distritos)
    - Postcode/ZIP
  - **Derecha (Your order / Order Summary):**
    - Tabla: Product | Price | Qty | Subtotal
    - Subtotal / Shipping ("Precio fijo") / Total
    - Métodos de pago (ver sección Pagos)
- Banner superior colapsable: `"Have a coupon? Click here to enter your code"`

### 13. MI CUENTA (Account Dashboard)
- Título: `"Mi Cuenta en Missy & Po"` en tipografía coral cursiva
- **5 íconos de acceso rápido** en fila horizontal, cada uno con borde circular:
  1. 📦 **Pedidos**
  2. 📁 **Info de Cuenta**
  3. 🏠 **Dirección**
  4. 💳 **Mis Tarjetas**
  5. 🔙 **Cerrar y Salir**

### 14. CTA BANNER (Pre-Footer)
- Fondo: `bg-yellow-400` (amarillo sólido brillante)
- Texto: `"Que esperas comprales a tus..."` (texto de llamada a la acción)
- Botón: `bg-gray-600 text-white` con texto `"ir a la tienda"`
- Imagen de fondo de transición: **Yorkie con lazo morado** (foto de perro)

### 15. FOOTER (3 columnas fijas sobre fondo blanco)
- Fondo: `bg-white`
- **Columna 1 — "Quedate con nosotros!!!":**
  - Texto: `"Missy & Po es una tienda hecha por verdaderos apasionados de las mascotas!!"`
  - Logo compacto centrado (circular)
  - Fila de 4 botones circulares oscuros con íconos blancos: **Facebook | Twitter | Instagram | LinkedIn**
- **Columna 2 — "Quick Links":**
  - Preguntas Frecuentes
  - Acerca de Nosotros
  - Visita Nuestra Tienda
  - Contactanos
- **Columna 3 — "Important Links":**
  - Politica de Privacidad
  - Detalles de Envio y Devoluciones
  - Terminos y Condiciones
  - **Libro de Reclamaciones y Quejas** ← Requisito legal Perú DL 1380
- **Barra de copyright:** Franja inferior delgada, texto izquierda + texto derecha

### 16. ELEMENTOS FLOTANTES PERMANENTES
- **Esquina inferior IZQUIERDA:** Botón circular coral con ícono de carrito + badge rojo de cantidad → abre `CartDrawer`
- **Esquina inferior DERECHA:** Botón WhatsApp `#25D366` con ícono blanco, `z-index` máximo (siempre visible)
- **Lateral derecho:** Pestañas `PEN` / `USD` para cambio de moneda (sticky)

---

## 💳 MÉTODOS DE PAGO (Fase 4)

| Método | Estado | Implementación |
|---|---|---|
| **Contra reembolso** | Default activo | Radio button + texto "Paga en efectivo en el momento de la entrega" |
| **Mercado Pago** | Sandbox (→ producción) | SDK oficial MP Checkout Pro. Credenciales en Firebase Secret Manager |
| **Yape / Plin** | Por implementar | **Culqi QR Dinámico** → confirmación automática vía Webhook → Cloud Function → Firestore |

### Flujo Yape/Plin (Culqi):
```
React Checkout → Cloud Function (SECRET_KEY Culqi protegida)
→ Culqi genera QR Dinámico con monto exacto
→ Desktop: muestra <img> QR para escanear con app
→ Mobile: Deep Link "yape://..." abre la app directamente
→ Cliente confirma pago en su app
→ Culqi dispara Webhook → Cloud Function valida firma
→ Firestore: myp_pedidos.estado = "pagado"
→ Cliente ve confirmación ✅
```
**Requisito operativo:** Alta en Culqi Empresa + Yape Empresa + Plin Negocios (gratuito)

---

## 🗄️ SCHEMA DE FIRESTORE (colecciones con prefijo `myp_`)

### `myp_productos` (documento por producto)
```js
{
  id: "auto",
  titulo: "Arnes Lou",
  slug: "arnes-lou",
  sku: "AL1",
  ean: "7750000018521",
  precio_regular: 3000,      // en céntimos o soles*2 para evitar floats
  precio_oferta: 2500,
  imagenes: ["gs://bucket/myp/productos/AL1/img1.jpg", ...],  // URLs Firebase Storage
  stock: 3,
  stock_status: "instock",   // "instock" | "outofstock" | "onbackorder"
  categoria: "Collares y Articulos",
  categorias: ["Collares y Articulos", "Ofertas"],
  tags: ["Arnes"],
  tags_busqueda: ["arnes", "lou", "collar", "regulable", ...], // array para búsqueda
  variantes: [
    { atributo: "Color/Talla", valor: "Rosa talla S" },
    { atributo: "Color/Talla", valor: "Azul celeste talla M" }
  ],
  descripcion_corta: "Para los engreídos que no les gusta el collar",
  descripcion_larga: "...",
  // Campos AliExpress Dropshipping (preservar del WP original)
  ali_product_id: "",
  ali_supplier_url: "",
  ali_shipping_time: "",
  copywriting: "",
  activo: true,
  creado_en: Timestamp,
  actualizado_en: Timestamp,
}
```

### `myp_pedidos` (documento por pedido)
```js
{
  id: "auto",
  id_cliente: "firebase_uid",
  numero_pedido: "MYP-2026-0001",
  items: [
    { producto_id, titulo, sku, ean, precio_unitario, cantidad, subtotal }
  ],
  subtotal: 2500,
  envio: 0,              // "Precio fijo" (contra reembolso)
  descuento: 0,
  total: 2500,
  cupon: null,
  metodo_pago: "contra_reembolso", // | "mercadopago" | "yape_plin"
  estado_pago: "pendiente",        // | "pagado" | "rechazado"
  estado_pedido: "nuevo",          // | "procesando" | "enviado" | "entregado" | "cancelado"
  tracking_id: "",
  courier: "",           // "Shalom" | "Olva Express"
  // Billing
  cliente_nombre: "",
  cliente_email: "",
  cliente_celular: "",
  direccion: {
    calle: "", ciudad: "", departamento: "", provincia: "", distrito: "",
    codigo_postal: ""
  },
  // Dropshipping
  estado_dropshipping: "pendiente", // | "ordenado" | "enviado_ali" | "recibido"
  creado_en: Timestamp,
}
```

### `myp_caja_diaria` (documento por transacción)
```js
{
  id: "auto",
  tipo: "ingreso",    // | "egreso"
  concepto: "Venta pedido MYP-2026-0001",
  monto: 2500,
  metodo: "contra_reembolso",
  pedido_id: "ref",
  fecha: Timestamp,
  registrado_por: "admin_uid",
}
```

### `myp_comprobantes` (boletas de venta)
```js
{
  id: "auto",
  numero: "B001-00000001",
  tipo: "boleta",
  tiene_igv: true,
  pedido_id: "ref",
  cliente_nombre: "",
  cliente_dni: "",
  items: [...],
  op_gravada: 2118.64,  // subtotal sin IGV
  igv: 381.36,          // 18%
  total: 2500,
  estado: "emitida",    // | "anulada"
  pdf_url: "gs://...",
  creado_en: Timestamp,
}
```

---

## 🗂️ MIGRACIÓN WORDPRESS → FIRESTORE

### Fuente de datos:
- **Base de datos:** `c:\MIS PROYECTOS\missy-po\database.sql` (41.6 MB, prefijo tablas: `wpcs_`)
- **Imágenes:** `C:\Users\victo\Local Sites\missy-po\uploads\` (ruta local LocalWP)

### Tablas WP relevantes:
| Tabla WP | Datos extraídos |
|---|---|
| `wpcs_posts` (type=product) | ID, título, slug, descripción, estado |
| `wpcs_postmeta` | `_sku`, `_ean_for_woocommerce`, `_regular_price`, `_sale_price`, `_stock`, `_stock_status`, `_product_image_gallery` |
| `wpcs_terms` + `wpcs_term_taxonomy` | Categorías y tags |
| `wpcs_term_relationships` | Relación producto ↔ categoría/tag |
| `wpcs_woocommerce_attribute_taxonomies` | Variantes (colores, tallas) |

### Script: `scripts/migrate-wp-to-firestore.js`
- Lee `database.sql` con parser SQL (librería `sql-parse` o regex)
- Mapea campos WP → schema `myp_productos`
- Lee imágenes de `C:\Users\victo\Local Sites\missy-po\uploads\`
- Sube imágenes a Firebase Storage: `myp/productos/{sku}/{nombre-archivo}`
- Escribe documentos en Firestore bajo colección `myp_productos`
- Genera log de errores y resumen al final

---

## 🏗️ ARQUITECTURA DEL PROYECTO NUEVO

```
c:\MIS PROYECTOS\missy-po\   ← carpeta del nuevo proyecto React
│
├── src/
│   ├── components/
│   │   ├── layout/         (Navbar, Footer, Layout)
│   │   ├── header/         (LiveSearch, CartIndicator, CartHoverPopup, CurrencyToggle)
│   │   ├── hero/           (HeroSlider, MarqueeBanner, AnimatedTitle)
│   │   ├── catalog/        (ProductGrid, ProductCard, SaleBadge, PriceDisplay, CategoryFilter)
│   │   ├── product/        (ProductDetail, ImageGallery, VariantSelector, YouMayAlsoLike, RelatedProducts)
│   │   ├── cart/           (CartDrawer, CartItem, CouponInput, BestSellingRow, CartPage)
│   │   ├── checkout/       (CheckoutPage, BillingForm, UbigeoPeru, PaymentMethods, YapePlinQR, OrderSummary)
│   │   ├── account/        (AccountPage, OrderHistory, AccountSettings)
│   │   ├── cta/            (CTABanner, CurrencyToggle)
│   │   └── shared/         (WhatsAppFloat, CartFloat, LoadingSpinner, SEOHead)
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── StorePage.jsx
│   │   ├── ProductPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── AccountPage.jsx
│   │   ├── legal/          (PrivacyPage, ShippingPage, TermsPage, ReclamacionesPage)
│   │   └── admin/          (AdminLayout, ProductsAdmin, OrdersAdmin, CajaAdmin, BoletasAdmin)
│   ├── services/           (firebase.js, firestore.js, storage.js, auth.js, search.js, mercadopago.js, culqi.js, boleta.js)
│   ├── store/              (cartStore.js, searchStore.js, authStore.js) ← Zustand
│   ├── hooks/              (useDebounce.js, useCart.js, useAuth.js)
│   └── data/               (ubigeo-peru.json)
├── functions/              ← Firebase Cloud Functions
│   ├── payments/           (createCulqiOrder.js, culqiWebhook.js, mercadopagoWebhook.js)
│   ├── orders/             (onOrderCreate.js)
│   ├── ingest/             (aliexpressIngest.js) ← Extensión Chrome → Firestore
│   └── legal/              (reclamacionesEmail.js)
├── scripts/
│   └── migrate-wp-to-firestore.js
├── public/
│   └── index.html          (Meta SEO, Google Fonts, gtag.js)
├── MISSY-PO-CONTEXT.md     ← ESTE ARCHIVO
├── .env.example
├── firebase.json
├── .firebaserc
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 📋 ESTADO DE IMPLEMENTACIÓN

| Fase | Descripción | Estado |
|---|---|---|
| Prereq | Crear proyecto Firebase nuevo + habilitar servicios | ⬜ Pendiente |
| Fase 1 | Scaffold + Design System completo (visual estático) | ⬜ Pendiente |
| Fase 2 | Firebase + migración catálogo + LiveSearch | ⬜ Pendiente |
| Fase 3 | Ficha de producto + Cart Drawer completo | ⬜ Pendiente |
| Fase 4 | Checkout + Pagos (reembolso/MP/Yape/Plin) + Auth | ⬜ Pendiente |
| Fase 5 | Admin Dashboard + Boletas PDF + Control Caja | ⬜ Pendiente |
| Fase 6 | Páginas legales + Deploy Firebase Hosting + CI/CD | ⬜ Pendiente |
| Fase 7 | SUNAT SEE (firma XML, CDR) — Requiere certificado .p12 | 🔒 Futuro |

---

## 🔑 VARIABLES DE ENTORNO REQUERIDAS (`.env`)

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Mercado Pago (poner en Cloud Functions, NO en frontend)
MP_ACCESS_TOKEN=        # Sandbox o Producción según env
MP_PUBLIC_KEY=

# Culqi (Yape/Plin) - SOLO en Cloud Functions
CULQI_SECRET_KEY=
CULQI_PUBLIC_KEY=

# Ingesta AliExpress Chrome Extension
ALIEXPRESS_INGEST_TOKEN=   # Bearer token secreto

# Admin
ADMIN_EMAIL=               # Email del usuario con rol admin en Firestore
```

---

## 🧭 NAVEGACIÓN DEL SITIO

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `HomePage` | Hero slider + Novedades + Grid productos |
| `/tienda` | `StorePage` | Catálogo completo con filtros laterales |
| `/producto/:slug` | `ProductPage` | Ficha detallada de producto |
| `/cart` | `CartPage` | Tabla de carrito (flujo desktop) |
| `/checkout` | `CheckoutPage` | Formulario de pago |
| `/login` | `LoginPage` | Autenticación |
| `/mi-cuenta` | `AccountPage` | Dashboard del cliente |
| `/mi-cuenta/pedidos` | `OrderHistory` | Historial de pedidos |
| `/preguntas-frecuentes` | — | FAQ |
| `/acerca-de-nosotros` | — | About |
| `/contactanos` | — | Contacto |
| `/politica-de-privacidad` | `PrivacyPage` | Legal |
| `/envio-y-devoluciones` | `ShippingPage` | Legal |
| `/terminos-y-condiciones` | `TermsPage` | Legal |
| `/reclamaciones` | `ReclamacionesPage` | Libro de reclamaciones (req. legal Perú DL 1380) |
| `/admin` | `AdminLayout` | Panel administrador (solo rol `admin`) |
| `/admin/productos` | `ProductsAdmin` | CRUD catálogo |
| `/admin/pedidos` | `OrdersAdmin` | Gestión pedidos |
| `/admin/caja` | `CajaAdmin` | Control de caja diaria |
| `/admin/boletas` | `BoletasAdmin` | Generación boletas PDF |

---

## ⚙️ REGLAS DE NEGOCIO IMPORTANTES

1. **Precios:** Están almacenados como enteros (sin decimales) en la BD WP. Ejemplo: `3000` = S/ 30.00 o S/ 3000? → **VERIFICAR con el dueño**. En las capturas se ve "S/ 3500", "S/ 2500", "S/ 900" que parecen ser soles completos (no céntimos).
2. **Cupones:** El carrito tiene input de cupón en el Drawer y en la página /cart.
3. **Envío:** "Precio fijo" — el monto exacto debe configurarse en el admin. Por ahora aparece como texto estático.
4. **Stock:** Se puede backorder. Mostrar `"N in stock (can be backordered)"`.
5. **EAN:** Código de barras visible en tarjetas y fichas. Formato: `7750000XXXXXXX` (13 dígitos).
6. **Moneda:** La app opera en **Soles peruanos (PEN)** por defecto. Hay un selector PEN/USD decorativo (puede ser solo informativo con tipo de cambio estático inicialmente).
7. **Dropshipping:** Los productos de AliExpress se ingresan vía extensión de Chrome → endpoint POST Cloud Function `/myp/ingest` protegido con Bearer Token → escribe en `myp_productos`.

---

*Archivo generado por Antigravity — Actualizar el campo "Estado de Implementación" al avanzar fases.*
