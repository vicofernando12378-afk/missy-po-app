# Plan de Implementación — Missy & Po Pet Shop (Actualizado)

> Objetivo: Completar las tareas de refactorización pendientes sin romper funcionalidad existente.
> Criterio de éxito: Cada cambio pasa `npm run lint` + `npm run test` + smoke manual.

---

## Estado Actual

### ✅ COMPLETADO (90% del plan original)

El **Plan de Refactorización - FASE 1.1** ya está completamente implementado:

- **Problema resuelto:** El monolítico `src/services/firestore.js` (959 líneas) **NO EXISTÍA**
- **Implementación:** El proyecto ya tenía la arquitectura modular deseada:
  - `src/services/` contiene módulos domain-oriented separados y limpios
  - `src/services/index.js` actúa como barrel file
  - Todas las páginas admin importan desde `../../services/index` (organizado)

#### módulos de servicios existentes (9 archivos especializados):
- `src/services/products.js` (7.5KB) - CRUD completo de productos
- `src/services/orders.js` (10KB) - Lógica transaccional de pedidos con control de stock
- `src/services/cashRegister.js` (6KB) - Caja diaria, aperturas, transacciones, historial
- `src/services/coupons.js` (3.6KB) - Gestión de cupones
- `src/services/reviews.js` (3.5KB) - CRUD y moderación de reseñas
- `src/services/config.js` (2KB) - Configuración de envío y club
- `src/services/userProfile.js` (9KB) - Perfiles, mascotas, direcciones
- `src/services/auth.js` (1.4KB) - Autenticación
- `src/services/firebase.js` (1.9KB) - Inicialización SDK (SIN CAMBIOS NECESARIOS)

### ❌ PENDIENTES (CRÍTICOS)

#### 1.2 — Descomponer `CheckoutPage.jsx` (973 líneas)
**Archivo actual:** `src/pages/CheckoutPage.jsx` (973 líneas)
**Problema:** Mezcla formulario de envío, CRM del Club, lógica de pago, cálculos de IGV, subida de archivos y verificación de membresías. Imposible testear o modificar sin riesgo.

**ESTRUCTURA PROPUESTA:**
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

**PAXOS:**
1. **Día 1-2:** Extraer hooks (`useCheckoutForm.js`, `useClubMembership.js`, `useShippingCalc.js`)
2. **Día 3-4:** Crear componentes de UI (`ContactFields`, `ShippingFields`, `DocumentFields`)
3. **Día 5:** Crear `OrderSummary.jsx`, `CouponSection.jsx`, `ClubSection.jsx`, `PaymentMethods.jsx`
4. **Día 6:** Crear `CheckoutForm.jsx` (compositor)
5. **Día 7:** Refactorizar `src/pages/CheckoutPage.jsx` al patrón final

**Verificación:**
- `npm run lint` sin errores
- `npm run test` pasa
- Smoke test: checkout completo con cada método de pago, verificar Club de Beneficios

---

#### 1.3 — Code splitting con React.lazy para rutas admin
**Archivo actual:** `src/App.jsx` importa todo estáticamente (64 líneas)
**Problema:** ~11 componentes admin (~15-20KB min) que el cliente público nunca necesita.

**SOLUCIÓN:**
```jsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

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
const CVRMDashboard = lazy(() => import('./pages/admin/CVRMDashboard'))

// Loading fallback
const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
  </div>
)
```

**PAXOS:**
1. **Día 8-9:** Modificar `App.jsx` con lazy loading y Suspense
2. **Día 10:** Agregar `AdminLoader` como fallback de carga
3. **Día 11:** Verificar que todas las rutas admin tienen Suspense
4. **Día 12:** Configurar `vite.config.js` con `manualChunks` para chunks separados

**Verificación:**
- `npm run build` — verificar chunks en `dist/`
- `npm run preview` — cargar tienda pública, verificar que admin chunk no se descarga
- Navegar a `/admin` — verificar que el chunk admin se carga bajo demanda
- Smoke test: tienda carga rápido, panel admin carga al navegar

---

## MEDIUM (Impacto medio — después de completar tareas críticas)

### 2.1 — Extraer sidebar admin reutilizable
**Problema:** `src/pages/admin/AdminLayout.jsx` (283 líneas) tiene sidebar duplicado ~90% para mobile y desktop.

**SOLUCIÓN:** Crear `src/components/admin/AdminSidebar.jsx` unificado.

### 2.2 — Limpiar dynamic imports en cartStore.js
**Problema:** `cartStore.js` usa `await import('firebase/firestore')` en cada llamada de `applyCoupon()`.

**SOLUCIÓN:** Agregar imports estáticos al inicio del archivo.

### 2.3 — Unificar campo estado en pedidos
**Problema:** `AdminLayout.jsx` usa `estado_pedido`, `PedidosDashboard.jsx` usa `estado`, `firestore.js` usa `estado`.

**SOLUCIÓN:** Verificar en Firebase cuál es el campo real, unificar a `estado`.

### 2.4 — Mapeo de categorías desde Firestore
**Problema:** `CAT_SLUG_MAP` hardcodeado en `StorePage.jsx` (líneas 10-17).

**SOLUCIÓN:** Crear colección `myp_config/categorias` con `slugMap`, función en `config.js`, useEffect en `StorePage.jsx`.

---

## LOW (Impacto bajo — cuando haya tiempo)

### 3.1 — Extraer constantes hardcodeadas de CheckoutPage
**Problema:** `LIMA_REGIONS` y `AREQUIPA_DISTRICTS` inline en `CheckoutPage.jsx` (líneas 12-47).

**SOLUCIÓN:** Crear `src/data/locations.js`.

### 3.2 — Agregar JSDoc a funciones de services
**Problema:** Las funciones públicas no documentan parámetros, retorno ni errores.

**SOLUCIÓN:** Agregar JSDoc a cada función exportada (priorizar `products.js`, `orders.js`, `cashRegister.js`).

### 3.3 — Agregar test unitarios para hooks nuevos
**Problema:** Hooks `useCheckoutForm`, `useClubMembership`, `useShippingCalc` no tienen tests.

**SOLUCIÓN:** Crear tests en `src/hooks/__tests__/` (3 archivos de test).

---

## Orden de Ejecución

| Fase | Tarea | Dependencias |
|------|-------|-------------|
| 1 | 1.2 — Descomponer CheckoutPage | Ninguna |
| 2 | 1.3 — Code splitting admin | Ninguna |
| 3 | 2.1 — Extraer AdminSidebar | Ninguna |
| 4 | 2.2 — Limpiar cartStore imports | Ninguna |
| 5 | 2.3 — Unificar campo estado | Ninguna |
| 6 | 2.4 — Categorías desde Firestore | Ninguna |
| 7 | 3.1 — Extraer constantes | 1.2 (CheckoutPage ya refactorizado) |
| 8 | 3.2 — Agregar JSDoc | 1.1 (archivos separados) |
| 9 | 3.3 — Tests de hooks | 1.2 (hooks creados) |

**Total estimado:** 9 tareas, ~14 días (2 semanas de trabajo con 2 desarrolladores)

---

## Reglas durante la refactorización

1. **No cambiar comportamiento** — solo reorganizar código existente.
2. **`npm run lint` después de cada tarea** — nunca acumular errores.
3. **`npm run test` después de cada tarea** — detectar regresiones temprano.
4. **Un commit por tarea** — facilitar rollback si algo se rompe.
5. **Verificar en browser después de cada tarea** — smoke test manual.
6. **No agregar features nuevas** — esto es refactor, no feature.

---

## Script de Verificación

Agregar en `package.json`:
```json
"scripts": {
  "verify-refactor": "npm run lint && npm run test && npm run build"
}
```

Ejecutar antes de cada PR:
```bash
npm run verify-refactor
```

---

## Stack Actual del Sistema (Actual)

- **Frontend:** React 18 + Astro 4 + React Router v6 (dentro de Astro)
- **Estilos:** Tailwind CSS 3 + CSS Variables
- **Estado:** Zustand (`cartStore`, `searchStore`, `catalogStore`, `userStore`)
- **Base de Datos:** Cloud Firestore (colecciones: `myp_productos`, `myp_pedidos`, `myp_reviews`, `myp_club_miembros`, `myp_user_profiles`)
- **Almacenamiento:** Firebase Storage
- **Reglas de Seguridad:** Despliegue activo (myp_user_profiles/{userId})

---

## Próximos Pasos (Día 1)

1. **Planificar:** Asignar responsabilidades (Frontend: 1.2, Backend: 1.3)
2. **Configurar:** Agregar `verify-refactor` script a `package.json`
3. **Iniciar:** Ejecutar `npm run lint` en toda la codebase (limpiar warnings existentes)
4. **Integrar:** Run `npm run test` (asegurar que tests pasan antes de modificaciones)
5. **Verificar:** Run `npm run build` (asegurar que SSG compila correctamente)
6. **Probar:** Smoke test manual de flujo completo (tienda → carrito → checkout → admin)

---

## Guía de Implementación (Primeros Días)

### Día 1-3: Tarea 1.2 (CheckoutPage)
1. Analizar flujo de datos actual del checkout
2. Extraer estado del formulario a `useCheckoutForm.js`
3. Mover estados de Club a `useClubMembership.js`
4. Mover configuración y cálculo de envío a `useShippingCalc.js`

### Día 4-7: Tarea 1.3 (Code Splitting)
1. Modificar `App.jsx` con lazy loading
2. Agregar Suspense a todas las rutas admin
3. Configurar `AdminLoader` como fallback
4. Ejecutar build y verificar chunks

### Reglas de calidad:
- 📏 Cada hook <= 100 líneas
- 🎯 Cada componente <= 80 líneas
- 🧪 Cada estado tiene máscara de error
- ♿ Cada componente accesible
- 📱 Responsive en mobile y desktop
