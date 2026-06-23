# 🐾 DIAGNÓSTICO TÉCNICO — Missy & Po Pet Shop
> **Fecha de auditoría:** 2026-05-28  
> **Auditor:** Antigravity (Tech Lead & Software Architect Senior)  
> **Estado del proyecto:** En Desarrollo activo — Fase 4 (Carrito / Admin)

---

## 1. Análisis General de la Aplicación

**Missy & Po** es un e-commerce de pet shop (tienda para mascotas), orientado al mercado peruano (Arequipa como hub principal), con métodos de pago locales (Yape/Plin, contra entrega) y nacional (Mercado Pago).

### Stack Técnico Identificado

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend Framework | Vite + React | React 18.3, Vite 5.3 |
| Estilos | Tailwind CSS | 3.4.4 |
| Estado Global | Zustand (con persistencia) | 4.5.2 |
| Router | React Router DOM | 6.23.1 |
| Backend / DB | Firebase (Firestore, Auth, Storage) | 10.12.0 |
| SEO | react-helmet-async | 3.0.0 |
| PDF / Tickets | jspdf + html2canvas | 2.5.1 / 1.4.1 |
| Lenguaje | JavaScript (JSX) — sin TypeScript | — |

### Colecciones Firestore (Prefijo `myp_`)

| Colección | Propósito |
|-----------|-----------|
| `myp_productos` | Catálogo de productos con variantes y stock |
| `myp_pedidos` | Órdenes de compra de los clientes |
| `myp_cupones` | Códigos de descuento con % y compra mínima |
| `myp_config` | Configuración dinámica (tarifas de envío) |
| `myp_caja_diaria` | Arqueo y cierre de caja por día |
| `myp_comprobantes` | Boletas/Facturas generadas (colección creada en rules pero NO usada aún en código) |
| `myp_reviews` | Reseñas de productos (en rules pero sin UI implementada) |

---

## 2. Mapa de Rutas y Páginas

```
/ (Layout público)
  ├── /                    → HomePage.jsx
  ├── /tienda              → StorePage.jsx
  ├── /producto/:slug      → ProductPage.jsx
  ├── /carrito             → CartPage.jsx
  ├── /checkout            → CheckoutPage.jsx
  ├── /orden-confirmada/:id → OrderConfirmationPage.jsx
  ├── /login               → LoginPage.jsx
  └── /* (404)             → NotFoundPage.jsx

/admin (AdminLayout — requiere auth)
  ├── /admin               → PedidosDashboard.jsx
  ├── /admin/caja          → CajaDiaria.jsx
  ├── /admin/inventario    → InventarioStock.jsx
  └── /admin/configuracion → ConfiguracionEnviosCupones.jsx
```

---

## 3. BUGS CRÍTICOS ENCONTRADOS

### 🔴 BUG #1 — Carrito: Comparación de clave `_key` nunca coincide (addItem duplica items)

**Archivo:** `src/store/cartStore.js` — Líneas 33–43

```js
// ACTUAL (ROTO):
const existing = items.find(
  (i) => i.id === product.id && i.variante === (product.variante || 'default')
)
// ... si existing es truthy:
newItems = items.map((i) =>
  i._key === key   // ← Esta comparación NUNCA funciona
    ? { ...i, cantidad: i.cantidad + (product.cantidad || 1) }
    : i
)
```

**Diagnóstico:** Se busca el item con `.find()` usando `i.id && i.variante`, pero al intentar actualizar la cantidad se usa `i._key === key`. El item existente tiene `_key` guardado, pero `key` es la variable local definida arriba (`${product.id}-${product.variante || 'default'}`). Esto sí coincide siempre… **a menos que** el `existing` encontrado con `id+variante` tenga un `_key` con formato diferente (p.ej. si el producto se agregó antes de que existiera el campo `_key`). Resultado: si hay items persistidos en localStorage sin `_key`, **los items se duplican** en lugar de sumar cantidad.

**Fix recomendado:**
```js
// CORRECTO: usar la misma lógica de búsqueda para el update
newItems = items.map((i) =>
  i.id === product.id && i.variante === (product.variante || 'default')
    ? { ...i, cantidad: i.cantidad + (product.cantidad || 1) }
    : i
)
```

---

### 🔴 BUG #2 — PedidosDashboard: `item.precio` no existe en el modelo de datos

**Archivo:** `src/pages/admin/PedidosDashboard.jsx` — Líneas 490, 493

```jsx
// ROTO: El modelo guarda 'precio_unitario', no 'precio'
<p className="text-xs text-gray-450 mt-0.5">
  Cant: {item.cantidad} x S/ {(item.precio || 0) / 100}
</p>
// ...
<span>S/ {((item.precio || 0) * item.cantidad) / 100}</span>
```

**Diagnóstico:** En `CheckoutPage.jsx` (línea 203), los items del pedido se guardan con el campo `precio_unitario`. Sin embargo en el dashboard del admin se consulta `item.precio` que siempre es `undefined`. Resultado: **todos los precios en la ficha de pedido aparecen como S/ 0.00**.

**Fix recomendado:** Reemplazar `item.precio` → `item.precio_unitario` en el dashboard.

---

### 🔴 BUG #3 — PedidosDashboard: `pedido.total_final` no existe en el modelo guardado

**Archivo:** `src/pages/admin/PedidosDashboard.jsx` — Líneas 295, 504, 521

```jsx
S/ {(pedido.total_final || 0) / 100}
```

**Diagnóstico:** En `CheckoutPage.jsx` (línea 191), el objeto del pedido guarda el total dentro de `comprobante.total`, NO como `total_final` a nivel raíz. La clave `total_final` no existe en el documento de Firestore. Resultado: **todos los montos en la tabla de pedidos y en la ficha de pedido muestran S/ 0.00** (o S/ NaN en algunos cálculos de subtotal).

**Fix recomendado:** 
- Opción A: Agregar `total_final: totalFinalCents` en el objeto `orderData` en `CheckoutPage.jsx` antes de guardar el pedido.
- Opción B: En el dashboard, usar `pedido.comprobante?.total` en lugar de `pedido.total_final`.
- **La Opción A es más limpia** porque `total_final` es semánticamente correcto y facilita futuras queries en Firestore.

---

### 🔴 BUG #4 — PedidosDashboard: Comprobante de pago Yape no se muestra

**Archivo:** `src/pages/admin/PedidosDashboard.jsx` — Línea 344

```jsx
// Busca pedido.comprobante.url (NO EXISTE)
{pedidoSeleccionado.comprobante?.url ? (
  <img src={pedidoSeleccionado.comprobante.url} ... />
```

**Diagnóstico:** En `CheckoutPage.jsx` (línea 233), la URL del comprobante se guarda en Firestore como `pago.recibo_url`. Sin embargo, el admin la busca en `comprobante.url`. Resultado: **el comprobante de Yape nunca se muestra** y siempre aparece el placeholder "No se subió imagen".

**Fix recomendado:** Cambiar la referencia en el dashboard a `pedidoSeleccionado.pago?.recibo_url`.

---

### 🔴 BUG #5 — CheckoutPage: Método de pago guardado como 'Yape/Plin' vs comparado como 'transferencia'

**Archivo:** `src/components/checkout/PaymentQrCulqi.jsx` — Línea 48 y `src/pages/admin/PedidosDashboard.jsx` — Línea 340

```jsx
// PaymentQrCulqi.jsx guarda:
metodo: 'Yape/Plin'

// PedidosDashboard.jsx compara como:
pedidoSeleccionado.pago?.metodo === 'transferencia'

// CajaDiaria.jsx también filtra como:
v.pago?.metodo === 'transferencia' || v.pago?.metodo === 'yape' || v.pago?.metodo === 'plin'
```

**Diagnóstico:** Existe una inconsistencia en el nombre del método de pago: el componente de pago lo guarda como la cadena `'Yape/Plin'`, pero el dashboard del admin lo compara con `'transferencia'`. Resultado: **la columna de comprobante en el dashboard nunca aparece** para pagos Yape, y en CajaDiaria los totales de billeteras digitales pueden calcularse incorrectamente.

**Fix recomendado:** Estandarizar a `'Yape/Plin'` en todos los lugares de comparación O crear una constante de módulo. La más pragmática es modificar la comparación en el dashboard y en CajaDiaria.

---

### 🟠 BUG #6 — PedidosDashboard: `pedido.cliente.telefono` vs `pedido.cliente.celular`

**Archivo:** `src/pages/admin/PedidosDashboard.jsx` — Líneas 69, 284, 426

```jsx
// Dashboard busca:
const telefonoCliente = (p.cliente?.telefono || '').toLowerCase()
// y en la ficha:
<p>Teléfono: {pedidoSeleccionado.cliente?.telefono}</p>

// CheckoutPage.jsx guarda:
celular: celular    // ← el campo se llama 'celular', no 'telefono'
```

**Diagnóstico:** El formulario de checkout guarda el teléfono del cliente como `cliente.celular`, pero el dashboard lo busca como `cliente.telefono`. Resultado: **el campo teléfono aparece vacío en la ficha del pedido**, y la búsqueda por teléfono en el buscador del admin no funciona. El enlace de WhatsApp también falla.

---

### 🟠 BUG #7 — PedidosDashboard: Comprobante de documento `cliente.documento` vs `cliente.documento_numero`

**Archivo:** `src/pages/admin/PedidosDashboard.jsx` — Líneas 70, 423

```jsx
// Dashboard busca:
const docCliente = (p.cliente?.documento || '').toLowerCase()
// y en la ficha:
<p>DNI/RUC: {pedidoSeleccionado.cliente?.documento || 'No provisto'}</p>

// CheckoutPage.jsx guarda:
documento_tipo: tipoDocumento,
documento_numero: numeroDocumento
```

**Diagnóstico:** Campo guardado como `documento_numero` pero leído como `documento`.

---

### 🟠 BUG #8 — CajaDiaria: `abrirCajaDiaria` usa `getDocs` dentro de una transacción de Firestore

**Archivo:** `src/services/firestore.js` — Líneas 439–448

```js
await runTransaction(db, async (transaction) => {
  // ❌ INCORRECTO: getDocs() NO es parte de la API de transacciones
  const q = query(collection(db, 'myp_caja_diaria'), where('estado', '==', 'abierta'))
  const snapAbiertas = await getDocs(q)  // ← Esto NO está en contexto de transacción
  ...
  transaction.set(cajaRef, nuevaCaja)
})
```

**Diagnóstico:** La regla fundamental de las transacciones de Firestore es que todas las lecturas deben hacerse con `transaction.get(docRef)` (solo para documentos individuales por referencia). Usar `getDocs()` con una query dentro de una transacción no participa del aislamiento transaccional. Esto puede causar condiciones de carrera en producción si dos admins intentan abrir una caja simultáneamente.

---

### 🟠 BUG #9 — CartDrawer: `BEST_SELLERS` son datos mock hardcodeados

**Archivo:** `src/components/cart/CartDrawer.jsx` — Líneas 99–103

```js
const BEST_SELLERS = [
  { id: 'bs1', slug: 'arnes-lou', nombre: 'Arnés Lou', ... },
  // ...
]
```

**Diagnóstico:** Los productos de "Más Vendidos" en el drawer del carrito son datos ficticios que no provienen de Firestore. Si el slug no existe en la base de datos, navegar a esos productos dará 404. Esto es una deuda técnica importante para producción.

---

### 🟠 BUG #10 — PaymentMpBrick: Procesamiento de tarjeta es FAKE (solo simulación)

**Archivo:** `src/components/checkout/PaymentMpBrick.jsx` — Líneas 75–85

```js
setTimeout(() => {
  onConfirm({
    metodo: 'Mercado Pago',
    marca: getCardType(),
    ...
  })
}, 2000)
```

**Diagnóstico:** El flujo de pago con tarjeta NO conecta a ninguna API real de Mercado Pago. Simplemente simula un retraso de 2 segundos y llama `onConfirm()`. Cualquier número de tarjeta "válido" en formato pasa como pago exitoso. El componente tiene un badge "Sandbox" visible en la UI pero **si se despliega a producción así, cualquier pedido con tarjeta se registrará como pagado sin cobro real**.

---

### 🟡 ADVERTENCIA #11 — Seguridad: Reglas Firestore con ventana de desarrollo abierta hasta 2026-06-15

**Archivo:** `firestore.rules`

```
|| request.time < timestamp.date(2026, 6, 15)
```

**Diagnóstico:** Prácticamente TODAS las colecciones tienen un bypass de seguridad activo hasta el 15 de junio de 2026. Esto significa que hasta esa fecha, **cualquier operación de escritura es pública sin autenticación**. Esto es aceptable en desarrollo pero **extremadamente peligroso si el proyecto lleva tráfico real de clientes antes de esa fecha**.

---

### 🟡 ADVERTENCIA #12 — Admin Panel: Sin protección de ruta real con Guards

**Archivo:** `src/pages/admin/AdminLayout.jsx`

**Diagnóstico:** La protección del panel admin se hace solo en el componente `AdminLayout` pero NO hay un Route Guard en el nivel de `App.jsx`. Si hay un error de renderizado en `AdminLayout`, las rutas admin podrían quedar expuestas. Adicionalmente, el bypass de `localStorage.getItem('myp_admin_bypass')` sin expiración es un vector de riesgo si la sesión queda abierta en un equipo compartido.

---

## 4. Funcionalidades Incompletas / Pendientes en el Admin

### Panel de Administración — Análisis de Gaps vs E-Commerce Estándar

| Funcionalidad | Estado | Prioridad |
|--------------|--------|-----------|
| Dashboard de pedidos con filtros | ✅ Implementado | — |
| Ficha de pedido con historial | ✅ Implementado | — |
| Asignación de repartidor | ✅ Implementado | — |
| Impresión de ticket | ✅ Implementado (básico) | — |
| Caja diaria (arqueo) | ✅ Implementado | — |
| Gestión de cupones | ✅ Implementado | — |
| Configuración de envíos | ✅ Implementado | — |
| Inventario (ajuste de stock) | ✅ Implementado | — |
| **CRUD de Productos** | ❌ **NO EXISTE** | 🔴 Crítico |
| Gestión de imágenes de productos | ❌ **NO EXISTE** | 🔴 Crítico |
| Dashboard KPI con ventas del mes | ❌ **NO EXISTE** | 🟠 Alto |
| Gráficas de ventas históricas | ❌ **NO EXISTE** | 🟠 Alto |
| Exportar pedidos a CSV/Excel | ❌ **NO EXISTE** | 🟠 Alto |
| Notificaciones de nuevos pedidos | ❌ **NO EXISTE** | 🟠 Alto |
| Gestión de categorías | ❌ **NO EXISTE** | 🟡 Medio |
| Reseñas de productos (moderación) | ❌ **NO EXISTE** (solo rules) | 🟡 Medio |
| Control de acceso multi-usuario admin | ❌ **NO EXISTE** | 🟡 Medio |
| Reportes financieros mensuales | ❌ **NO EXISTE** | 🟡 Medio |
| Gestión de descuentos por categoría | ❌ **NO EXISTE** | 🟡 Bajo |

**La ausencia más crítica es el CRUD de Productos.** Actualmente no existe ninguna página en el admin para crear, editar o eliminar productos del catálogo. El admin solo puede ajustar stock. Para agregar un producto nuevo habría que hacerlo directamente desde la consola de Firebase.

---

## 5. Análisis del Flujo de Carrito y Checkout

### Flujo correcto (cuando funciona)
```
[Tienda] → addItem() → CartStore (Zustand + localStorage) → CartDrawer (slide-in)
         → /carrito → applyCoupon() → /checkout → procesarCompraFinal()
         → crearPedidoConTransaccion() [transacción Firestore] → clearCart()
         → /orden-confirmada/:id
```

### Problemas en el flujo:
1. **Cart Store**: Bug de `_key` puede duplicar items (Bug #1)
2. **CartDrawer**: Best sellers hardcodeados (Bug #9)  
3. **Checkout**: El método de pago `'Yape/Plin'` vs `'transferencia'` causa inconsistencias (Bug #5)
4. **Checkout Tarjeta**: No hay integración real con Mercado Pago (Bug #10)
5. **Modelo de datos del pedido**: Falta `total_final` a nivel raíz (Bug #3)
6. **Modelo de cliente**: `celular` vs `telefono`, `documento_numero` vs `documento` (Bugs #6 y #7)

---

## 6. Análisis de la Calidad del Código

### Fortalezas 💪
- **Transacciones de stock bien diseñadas**: La función `crearPedidoConTransaccion()` sigue correctamente el patrón reads-first, writes-last de Firestore.
- **Zustand con persistencia**: Carrito persiste correctamente en localStorage con `partialize`.
- **Separación de capas**: Existe una capa de servicios (`firestore.js`) bien separada de los componentes.
- **Prefijado de colecciones**: El prefijo `myp_` está respetado consistentemente.
- **UI/UX del admin**: El panel de pedidos con modal de ficha y vista de impresión está bien pensado.
- **Responsive**: El admin tiene sidebar móvil con overlay funcional.

### Debilidades 🚨
- **Sin TypeScript**: La ausencia de tipos hace que los bugs de nombrado de campos (`precio` vs `precio_unitario`) sean imposibles de detectar en compilación.
- **Modelos de datos no documentados**: No hay interfaces/schemas definidos para `Pedido`, `Producto`, `Cliente`.
- **Inconsistencia en nombres de campos**: El mismo dato se llama diferente en distintas partes (`celular/telefono`, `precio/precio_unitario`, etc.).
- **Sin tests unitarios**: No existe ningún archivo de test en el proyecto.
- **Componentes muy grandes**: `PedidosDashboard.jsx` (804 líneas), `CheckoutPage.jsx` (591 líneas) — deberían ser refactorizados.
- **Mezcla de lógica y UI**: Los archivos de página mezclan lógica de negocio, llamadas a servicios y JSX sin separación por hooks custom.
- **Best sellers hardcodeados**: Los datos mock en el CartDrawer deben conectarse a Firestore.

---

## 7. Plan de Corrección Priorizado

### 🔴 Sprint 1 — Bugs Bloqueantes (Afectan directamente al negocio)

| # | Bug | Archivo | Impacto |
|---|-----|---------|---------|
| 1 | Campos `precio_unitario` + `total_final` en PedidosDashboard | `PedidosDashboard.jsx` | S/ 0 en todos los pedidos |
| 2 | Campo `pago.recibo_url` vs `comprobante.url` | `PedidosDashboard.jsx` | Comprobantes invisibles |
| 3 | `cliente.celular` vs `cliente.telefono` y `documento_numero` | `PedidosDashboard.jsx` | Datos de cliente vacíos |
| 4 | Método de pago `'Yape/Plin'` vs `'transferencia'` | `PedidosDashboard.jsx`, `CajaDiaria.jsx` | Comprobantes y caja incorrectos |
| 5 | Agregar `total_final` al objeto de pedido en Checkout | `CheckoutPage.jsx` | Todos los montos en admin en 0 |

### 🟠 Sprint 2 — Funcionalidad Core Faltante

| # | Tarea | Descripción |
|---|-------|-------------|
| 6 | CRUD de Productos (Admin) | Crear `ProductosCRUD.jsx` — formulario para crear/editar/eliminar productos con variantes e imágenes |
| 7 | Fix del `_key` en cartStore addItem | Corregir la comparación en el map |
| 8 | Integración real Mercado Pago | Reemplazar la simulación por el SDK real de MP |
| 9 | Expiración del bypass de rules | Actualizar fecha o configurar roles Firebase correctamente |

### 🟡 Sprint 3 — Mejoras del Panel Admin

| # | Tarea | Descripción |
|---|-------|-------------|
| 10 | Dashboard KPIs de ventas del mes | Gráficas de ingresos, pedidos por estado, productos más vendidos |
| 11 | Exportar pedidos CSV | Botón de exportación desde el dashboard |
| 12 | Notificaciones de nuevos pedidos | Badge en tiempo real usando `onSnapshot` ya existente |
| 13 | Best sellers dinámicos | Conectar el CartDrawer a los productos más populares de Firestore |
| 14 | Panel de reseñas | Moderación de `myp_reviews` (ya tiene rules, falta UI) |

---

## 8. Recomendaciones de Arquitectura a Mediano Plazo

1. **Migrar a TypeScript**: Mínimo crear `types.js` con JSDoc o interfaces de Zod para los modelos `Producto`, `Pedido`, `Cliente`, `Variante`.

2. **Extraer lógica a hooks custom**: 
   - `useCheckout()` — toda la lógica de checkout
   - `usePedidos()` — carga y filtrado de pedidos en admin
   - `useCajaDiaria()` — estado de la caja

3. **Separar el modelo del pedido**: Crear una constante `buildOrderData()` en un módulo de utilidades para garantizar que los campos sean siempre consistentes entre checkout y admin.

4. **Configurar Firebase Admin SDK** con Cloud Functions para:
   - Asignar claims de admin de forma automática
   - Procesar pagos con Mercado Pago desde el backend (más seguro)
   - Enviar emails de confirmación de pedido

5. **Implementar tests básicos** con Vitest para los stores de Zustand y las funciones de cálculo financiero de `CajaDiaria`.

---

*Diagnóstico generado el 2026-05-28 | Missy & Po Pet Shop v1.0.0 (en desarrollo)*
