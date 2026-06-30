# Plan de Refactorización — Missy & Po Pet Shop

> Objetivo: Resolver deuda técnica sin romper funcionalidad existente.
> Criterio de éxito: Cada cambio pasa `npm run lint` + `npm run test` + smoke manual.

---

## CRÍTICOS (Impacto alto — hacer primero)

### 1.1 — Separar `firestore.js` en módulos domain-oriented

**Archivo actual**: `src/services/firestore.js` (959 líneas)

**Problema**: Contiene lógica de 6 dominios distintos. Viola SRP. Difícil de testear, revisar y mantener.

**Estructura propuesta**:

```
src/services/
  firebase.js          ← sin cambios (SDK init)
  products.js          ← CRUD de productos
  orders.js            ← pedidos, transacciones de stock, estados
  cashRegister.js      ← caja diaria (abrir, cerrar, transacciones, historial)
  coupons.js           ← cupones CRUD
  reviews.js           ← reseñas CRUD
  config.js            ← configuración de envíos y club
  index.js             ← re-exporta todo (barrel file)
```

**Pasos**:

1. Crear `src/services/products.js` con:
   - `buscarProductos()`
   - `obtenerProductos()`
   - `obtenerProductoPorSlug()`
   - `obtenerProductoPorId()`
   - `obtenerRelacionados()`
   - `crearProducto()`
   - `actualizarProducto()`
   - `eliminarProducto()`
   - `obtenerTodosProductosAdmin()`
   - `actualizarStockProductoAdmin()`
   - `obtenerProductosMasVendidos()`

2. Crear `src/services/orders.js` con:
   - `crearPedidoConTransaccion()`
   - `obtenerPedidosAdmin()`
   - `actualizarEstadoPedido()`
   - `reestablecerStockPedidoConTransaccion()`
   - `obtenerPedidosRango()`
   - `asignarRepartidorPedido()`

3. Crear `src/services/cashRegister.js` con:
   - `obtenerCajaActiva()`
   - `abrirCajaDiaria()`
   - `registrarTransaccionManual()`
   - `cerrarCajaDiaria()`
   - `obtenerHistorialCajas()`
   - `obtenerVentasConfirmadasDia()`

4. Crear `src/services/coupons.js` con:
   - `obtenerCupones()`
   - `crearCupon()`
   - `actualizarEstadoCupon()`
   - `eliminarCupon()`

5. Crear `src/services/reviews.js` con:
   - `obtenerResenas()`
   - `actualizarEstadoResena()`
   - `eliminarResena()`
   - `crearResena()`
   - `obtenerResenasPorProducto()`

6. Crear `src/services/config.js` con:
   - `obtenerConfiguracionEnvio()`
   - `guardarConfiguracionEnvio()`

7. Crear `src/services/index.js` (barrel):
   ```js
   export * from './products'
   export * from './orders'
   export * from './cashRegister'
   export * from './coupons'
   export * from './reviews'
   export * from './config'
   ```

8. Actualizar imports en:
   - `src/pages/admin/PedidosDashboard.jsx`
   - `src/pages/admin/CajaDiaria.jsx`
   - `src/pages/admin/InventarioStock.jsx`
   - `src/pages/admin/ConfiguracionEnviosCupones.jsx`
   - `src/pages/admin/ProductosCRUD.jsx`
   - `src/pages/admin/VentasDashboard.jsx`
   - `src/pages/admin/ResenasDashboard.jsx`
   - `src/pages/CheckoutPage.jsx`
   - `src/pages/ProductPage.jsx`
   - `src/store/catalogStore.js`
   - `src/store/cartStore.js` (dynamic import de coupon)

9. Eliminar `src/services/firestore.js` una vez que no queden imports.

**Verificación**:
- `npm run lint` sin errores
- `npm run test` pasa
- Smoke test: navegar tienda, agregar al carrito, checkout, login admin, verificar pedidos

---

### 1.2 — Descomponer `CheckoutPage.jsx` en componentes y hooks

**Archivo actual**: `src/pages/CheckoutPage.jsx` (973 líneas)

**Problema**: Mezcla formulario de envío, lógica CRM del Club, lógica de pago, cálculos de IGV, subida de archivos, y verificación de membresías. Imposible testear o modificar sin riesgo.

**Estructura propuesta**:

```
src/hooks/
  useCheckoutForm.js        ← estado del formulario + validación
  useClubMembership.js      ← verificación, canje, acumulación de puntos
  useShippingCalc.js        ← cálculo de envío dinámico

src/components/checkout/
  CheckoutForm.jsx          ← wrapper del form completo
  ContactFields.jsx         ← nombre, apellido, email, celular, mascota
  ShippingFields.jsx        ← departamento, distrito, dirección, referencia
  DocumentFields.jsx        ← tipo y número de documento
  OrderSummary.jsx          ← resumen de items + totales
  CouponSection.jsx         ← input de cupón + estado
  ClubSection.jsx           ← verificación de socio + canje de puntos
  PaymentMethods.jsx        ← selección de método de pago
```

**Pasos**:

1. Crear `src/hooks/useCheckoutForm.js`:
   - Mover todos los `useState` del formulario (nombre, apellido, email, celular, departamento, etc.)
   - Mover `validateForm()` y `handleDocumentoChange()`
   - Retornar { formData, setters, validateForm, handleDocumentoChange }

2. Crear `src/hooks/useClubMembership.js`:
   - Mover estados: clubConfig, clubMember, verifyingMember, pointsApplied, verifyEmailInput, verifyAliasInput, verifyError
   - Mover `handleManualVerify()`
   - Mover `useEffect` de carga de config del club
   - Retornar { clubConfig, clubMember, pointsApplied, verify, applyPoints, removePoints }

3. Crear `src/hooks/useShippingCalc.js`:
   - Mover estados: shippingConfig, departamento, distritoArequipa, distritoNacional
   - Mover `useEffect` de carga de config de envío
   - Mover función `getCostoEnvio()`
   - Retornar { shippingConfig, costoEnvio, isArequipa }

4. Crear componentes `<ContactFields />`, `<ShippingFields />`, `<DocumentFields />`:
   - Cada uno recibe props del hook `useCheckoutForm`
   - Renderiza sus campos con labels, inputs, y validación

5. Crear `<OrderSummary />`:
   - Recibe items, subtotal, couponDiscount, pointsDiscountCents, costoEnvio, totalFinalSoles
   - Renderiza desglose de costos

6. Crear `<CouponSection />`:
   - Recibe couponCode, couponDiscount, onApply, onRemove
   - Renderiza input + botón + estado

7. Crear `<ClubSection />`:
   - Recibe todo el estado y funciones de `useClubMembership`
   - Renderiza verificación de socio, puntos disponibles, botón de canje

8. Crear `<PaymentMethods />`:
   - Recibe metodoPago, onSelect
   - Renderiza radio buttons de métodos de pago

9. Crear `src/components/checkout/CheckoutForm.jsx`:
   - Compone todos los componentes anteriores
   - Contiene la lógica de `handleCheckoutSubmit` y `procesarCompraFinal`
   - Recibe props: items, total, clearCart

10. Refactorizar `src/pages/CheckoutPage.jsx`:
    ```jsx
    import CheckoutForm from '../components/checkout/CheckoutForm'
    
    export default function CheckoutPage() {
      return (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1>Finalizar Compra</h1>
          <CheckoutForm />
        </div>
      )
    }
    ```

**Verificación**:
- `npm run lint` sin errores
- `npm run test` pasa
- Smoke test: checkout completo con cada método de pago, verificar Club de Beneficios

---

### 1.3 — Code splitting con React.lazy para rutas admin

**Archivo actual**: `src/App.jsx` importa todo estáticamente.

**Problema**: El bundle incluye ~11 componentes admin (~15-20KB min) que el cliente público nunca necesita. Aumenta tiempo de carga innecesariamente.

**Pasos**:

1. Modificar `src/App.jsx`:
   ```jsx
   import { lazy, Suspense } from 'react'
   
   // Imports estáticos (públicos)
   import Layout from './components/layout/Layout'
   import HomePage from './pages/HomePage'
   import StorePage from './pages/StorePage'
   import ProductPage from './pages/ProductPage'
   import CartPage from './pages/CartPage'
   import CheckoutPage from './pages/CheckoutPage'
   import OrderConfirmationPage from './pages/OrderConfirmationPage'
   import LoginPage from './pages/LoginPage'
   import NotFoundPage from './pages/NotFoundPage'
   
   // Lazy loads (admin)
   const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
   const PedidosDashboard = lazy(() => import('./pages/admin/PedidosDashboard'))
   const CajaDiaria = lazy(() => import('./pages/admin/CajaDiaria'))
   const InventarioStock = lazy(() => import('./pages/admin/InventarioStock'))
   const ConfiguracionEnviosCupones = lazy(() => import('./pages/admin/ConfiguracionEnviosCupones'))
   const ProductosCRUD = lazy(() => import('./pages/admin/ProductosCRUD'))
   const VentasDashboard = lazy(() => import('./pages/admin/VentasDashboard'))
   const ResenasDashboard = lazy(() => import('./pages/admin/ResenasDashboard'))
   
   // Loading fallback
   const AdminLoader = () => (
     <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
     </div>
   )
   
   function App() {
     return (
       <BrowserRouter>
         <Routes>
           {/* Rutas públicas — sin Suspense */}
           <Route path="/" element={<Layout />}>
             <Route index element={<HomePage />} />
             <Route path="tienda" element={<StorePage />} />
             <Route path="producto/:slug" element={<ProductPage />} />
             <Route path="carrito" element={<CartPage />} />
             <Route path="checkout" element={<CheckoutPage />} />
             <Route path="orden-confirmada/:orderId" element={<OrderConfirmationPage />} />
             <Route path="login" element={<LoginPage />} />
             <Route path="*" element={<NotFoundPage />} />
           </Route>
   
           {/* Rutas admin — con Suspense */}
           <Route path="/admin" element={
             <Suspense fallback={<AdminLoader />}>
               <AdminLayout />
             </Suspense>
           }>
             <Route index element={<Suspense fallback={<AdminLoader />}><PedidosDashboard /></Suspense>} />
             <Route path="caja" element={<Suspense fallback={<AdminLoader />}><CajaDiaria /></Suspense>} />
             <Route path="inventario" element={<Suspense fallback={<AdminLoader />}><InventarioStock /></Suspense>} />
             <Route path="configuracion" element={<Suspense fallback={<AdminLoader />}><ConfiguracionEnviosCupones /></Suspense>} />
             <Route path="productos" element={<Suspense fallback={<AdminLoader />}><ProductosCRUD /></Suspense>} />
             <Route path="ventas" element={<Suspense fallback={<AdminLoader />}><VentasDashboard /></Suspense>} />
             <Route path="resenas" element={<Suspense fallback={<AdminLoader />}><ResenasDashboard /></Suspense>} />
           </Route>
         </Routes>
       </BrowserRouter>
     )
   }
   ```

2. Verificar que `vite.config.js` (o `astro.config.mjs`) genera chunks separados:
   - Verificar que el build produce archivos chunk separados para admin
   - Si no, agregar `manualChunks` en la config de Vite:
     ```js
     vite: {
       build: {
         rollupOptions: {
           output: {
             manualChunks: {
               'admin': ['./src/pages/admin/AdminLayout', ...admin routes]
             }
           }
         }
       }
     }
     ```

**Verificación**:
- `npm run build` — verificar chunks en `dist/`
- `npm run preview` — cargar tienda pública, verificar que admin chunk no se descarga
- Navegar a `/admin`, verificar que el chunk admin se carga bajo demanda

---

## MEDIUM (Impacto medio — hacer después)

### 2.1 — Extraer sidebar admin reutilizable

**Archivo actual**: `src/pages/admin/AdminLayout.jsx` (283 líneas)

**Problema**: Desktop sidebar (líneas 130-182) y mobile sidebar (líneas 191-257) tienen código casi idéntico (~90% duplicado).

**Pasos**:

1. Crear `src/components/admin/AdminSidebar.jsx`:
   ```jsx
   export default function AdminSidebar({ 
     isOpen, 
     onClose, 
     user, 
     menuItems, 
     onLogout,
     isMobile = false 
   }) {
     // Lógica unificada para ambos modos
     // isMobile controla visibilidad y transiciones
   }
   ```

2. Refactorizar `AdminLayout.jsx`:
   ```jsx
   import AdminSidebar from '../../components/admin/AdminSidebar'
   
   // Remover código duplicado de sidebar
   // Usar <AdminSidebar /> para desktop y mobile
   ```

3. Eliminar el bloque `sidebarOpen && <div ... />` del overlay mobile — moverlo dentro de `<AdminSidebar />`.

**Verificación**:
- `npm run lint`
- Probar en desktop y mobile (responsive)
- Verificar que el badge de pedidos nuevos sigue funcionando

---

### 2.2 — Limpiar dynamic imports en cartStore

**Archivo actual**: `src/store/cartStore.js` (líneas 107-108)

**Problema**: `applyCoupon()` hace `await import('firebase/firestore')` y `await import('../services/firebase')` en cada llamada. Los imports dinámicos son lentos y inconsistentes con el resto del store.

**Pasos**:

1. Agregar imports estáticos al inicio de `cartStore.js`:
   ```js
   import { doc, getDoc } from 'firebase/firestore'
   import { db } from '../services/firebase'
   ```

2. Reemplazar en `applyCoupon()`:
   ```js
   // ANTES (línea 107-108)
   const { doc, getDoc } = await import('firebase/firestore')
   const { db } = await import('../services/firebase')
   
   // DESPUÉS — usar imports estáticos del archivo
   const docRef = doc(db, 'myp_cupones', uppercaseCode)
   const snap = await getDoc(docRef)
   ```

3. Verificar que el mock fallback de cupones (líneas 134-147) se mantiene intacto.

**Verificación**:
- `npm run lint`
- Aplicar cupón en checkout → verificar que funciona
- Verificar que el fallback local (BIENVENIDO10, MISSY15, MASCOTA20) funciona cuando Firestore no está disponible

---

### 2.3 — Unificar campo de estado en pedidos

**Archivos afectados**:
- `src/pages/admin/AdminLayout.jsx:59` usa `estado_pedido`
- `src/pages/admin/PedidosDashboard.jsx:56` usa `estado`
- `src/services/firestore.js:306` usa `estado`

**Problema**: El listener del badge en `AdminLayout` filtra por `estado_pedido`, pero el dashboard y el service usan `estado`. Si el campo real en Firestore es `estado`, el badge no funciona.

**Pasos**:

1. Verificar en Firestore cuál es el campo real:
   - Abrir Firebase Console → colección `myp_pedidos`
   - Verificar si el campo se llama `estado` o `estado_pedido`

2. Unificar a un solo campo. Recomendación: usar `estado` (más corto, consistente con el resto del código).

3. Actualizar `AdminLayout.jsx:59`:
   ```js
   // ANTES
   where('estado_pedido', '==', 'recibido')
   
   // DESPUÉS
   where('estado', '==', 'recibido')
   ```

4. Si `CheckoutPage.jsx` escribe ambos campos (línea 339-340), dejar solo `estado`:
   ```js
   // ANTES
   estado: 'recibido',
   estado_pedido: 'recibido',
   
   // DESPUÉS
   estado: 'recibido',
   ```

5. Verificar que no hay más referencias a `estado_pedido` en el codebase:
   ```bash
   grep -r "estado_pedido" src/
   ```

**Verificación**:
- Crear un pedido nuevo
- Verificar que el badge de admin se actualiza en tiempo real
- Verificar que el dashboard muestra el pedido correctamente

---

### 2.4 — Mapeo de categorías desde Firestore

**Archivo actual**: `src/pages/StorePage.jsx` (líneas 10-17)

**Problema**: `CAT_SLUG_MAP` está hardcodeado. Si cambian los nombres de categorías en Firestore, hay que actualizar manualmente en el código.

**Pasos**:

1. Crear una colección `myp_config` con documento `categories`:
   ```js
   {
     slugMap: {
       'collares': 'Collares y Articulos',
       'ropa': 'Ropitas Missy & Po',
       // ...
     }
   }
   ```

2. Crear función en `src/services/config.js`:
   ```js
   export async function obtenerCategorySlugMap() {
     const snap = await getDoc(doc(db, 'myp_config', 'categories'))
     return snap.exists() ? snap.data().slugMap : {}
   }
   ```

3. Actualizar `StorePage.jsx`:
   ```js
   const [catSlugMap, setCatSlugMap] = useState({})
   
   useEffect(() => {
     obtenerCategorySlugMap().then(setCatSlugMap)
   }, [])
   ```

4. Mantener el mapa hardcodeado como fallback:
   ```js
   const resolvedMap = { ...FALLBACK_MAP, ...catSlugMap }
   ```

**Verificación**:
- Verificar que la tienda carga categorías correctamente
- Modificar el documento en Firestore y verificar que se refleja sin redeploy

---

## LOW (Impacto bajo — hacer cuando haya tiempo)

### 3.1 — Extraer constantes hardcodeadas de CheckoutPage

**Archivo**: `src/pages/CheckoutPage.jsx` (líneas 12-47)

**Problema**: `LIMA_REGIONS` y `AREQUIPA_DISTRICTS` están inline en el componente. Si cambian, hay que tocar un archivo de 973 líneas.

**Pasos**:

1. Crear `src/data/locations.js`:
   ```js
   export const LIMA_REGIONS = [
     'Arequipa', 'Lima', 'Cusco', // ...
   ]
   
   export const AREQUIPA_DISTRICTS = [
     'Arequipa (Cercado)', 'Cayma', // ...
   ]
   ```

2. Actualizar import en `CheckoutPage.jsx` (o en `<ShippingFields />` si ya se extrajo).

3. Verificar que no hay más constantes de ubicaciones en otros archivos.

---

### 3.2 — Agregar JSDoc a funciones de services

**Archivos**: Todos en `src/services/*.js`

**Problema**: Las funciones públicas no documentan parámetros, retorno ni errores. Dificulta integración por otros devs.

**Pasos**:

1. Agregar JSDoc a cada función exportada:
   ```js
   /**
    * Obtiene productos activos con filtro y paginación en memoria.
    * @param {Object} options
    * @param {string|null} options.categoria - Filtrar por categoría (opcional)
    * @param {boolean} options.soloOfertas - Solo productos con precio de oferta
    * @param {string} options.orden - Campo de ordenamiento (default: 'fecha_creacion')
    * @param {number} options.paginaSize - Tamaño de página (default: 12)
    * @param {string|null} options.cursor - ID del último producto de la página anterior
    * @returns {Promise<{productos: Array, lastDoc: string|null, hasMore: boolean}>}
    */
   ```

2. Priorizar: `products.js`, `orders.js`, `cashRegister.js` (los más usados).

---

### 3.3 — Agregar test unitarios para hooks nuevos

**Directorio**: `src/hooks/__tests__/`

**Problema**: Los hooks `useCheckoutForm`, `useClubMembership`, `useShippingCalc` no tienen tests.

**Pasos**:

1. Crear `src/hooks/__tests__/useCheckoutForm.test.js`:
   - Test: inicialización con valores por defecto
   - Test: `validateForm()` retorna false con campos vacíos
   - Test: `handleDocumentoChange` filtra no-numéricos y limita longitud

2. Crear `src/hooks/__tests__/useClubMembership.test.js`:
   - Test: carga de configuración del club
   - Test: verificación de socio existente
   - Test: verificación de socio inexistente

3. Crear `src/hooks/__tests__/useShippingCalc.test.js`:
   - Test: envío gratis para Arequipa sobre el límite
   - Test: envío gratis para nacional sobre el límite
   - Test: cobro de envío bajo el límite

4. Ejecutar `npm run test` y verificar cobertura.

---

## Orden de Ejecución

| Fase | Tarea | Dependencias |
|------|-------|--------------|
| 1 | 1.1 — Separar firestore.js | Ninguna |
| 2 | 1.2 — Descomponer CheckoutPage | 1.1 (imports actualizados) |
| 3 | 1.3 — Code splitting admin | 1.1 (imports limpios) |
| 4 | 2.1 — Extraer AdminSidebar | Ninguna |
| 5 | 2.2 — Limpiar cartStore imports | Ninguna |
| 6 | 2.3 — Unificar campo estado | Ninguna |
| 7 | 2.4 — Categorías desde Firestore | Ninguna |
| 8 | 3.1 — Extraer constantes | 1.2 (CheckoutPage ya refactorizado) |
| 9 | 3.2 — Agregar JSDoc | 1.1 (archivos separados) |
| 10 | 3.3 — Tests de hooks | 1.2 (hooks creados) |

**Total estimado**: 10 tareas, ~4-6 horas de trabajo.

---

## Reglas durante la refactorización

1. **No cambiar comportamiento** — solo reorganizar código existente.
2. **Correr `npm run lint` después de cada tarea** — nunca acumular errores.
3. **Correr `npm run test` después de cada tarea** — detectar regresiones temprano.
4. **Un commit por tarea** — facilitar rollback si algo se rompe.
5. **Verificar en browser después de cada tarea** — smoke test manual.
6. **No agregar features nuevas** — esto es refactor, no feature.
