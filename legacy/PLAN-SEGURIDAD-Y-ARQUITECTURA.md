# Plan de Acción: Seguridad, Arquitectura y Deuda Técnica — Missy & Po Pet Shop

Companion del `PLAN-ZOD.md`. Este plan cubre TODO lo que la validación Zod **no resuelve**: backdoors de seguridad, reglas Firestore vencidas, XSS, deuda técnica y arquitectónica.

---

## Tabla de Hallazgos y Acciones

| # | Hallazgo | Severidad | Archivo(s) | Acción |
|---|---|---|---|---|
| S1 | Auth bypass hardcodeado (`admin123`) | **CRITICAL** | `LoginPage.jsx` | Separar auth: Admin → Google OAuth, Clientes → email/password |
| S2 | Firestore Rules con bypass temporal vencido | **CRITICAL** | `firestore.rules` | Eliminar `request.time` bypass |
| S3 | Sin sanitización XSS en free-text | **HIGH** | Múltiples | Instalar DOMPurify, sanear inputs |
| S4 | localStorage trusted sin validación | **HIGH** | `cartStore.js` | Cubierto por PLAN-ZOD (Fase 1.3) |
| S5 | `firestore.js` monolito 900 líneas | **MEDIUM** | `firestore.js` | Separar en módulos por dominio |
| S6 | Lógica duplicada de cupones | **LOW** | `cartStore.js`, `firestore.js` | Eliminar fallback local |
| S7 | `obtenerProductos` sort/paginate en memoria | **LOW** | `firestore.js` | Crear índices compuestos en Firestore |
| S8 | Sin `.env.example` actualizado | **LOW** | `.env.example` | Verificar que refleje variables actuales |

---

## Fase S1 — Rediseñar Auth: Admin Google OAuth + Clientes Email/Password (CRITICAL)

### Problema actual

`LoginPage.jsx` maneja admin y clientes en un solo componente con un bypass compartido:
1. Hardcodea email `victorchavezd@gmail.com` y contraseña `admin123` (línea 6, 72)
2. Crea la cuenta Firebase si no existe (líneas 279-281)
3. Persiste acceso admin en `localStorage` key `myp_admin_bypass` (línea 19, 286)
4. Botón visible en UI: "Entrar con Bypass de Desarrollo" (línea 298)

Cualquier persona con acceso al bundle puede loguearse como admin. El mismo formulario sirve para admin y clientes, lo cual mezcla responsabilidades.

### Arquitectura propuesta: Dos flujos de auth separados

```
┌──────────────────────────────────────────────────────────┐
│  CLIENTE — /login                                        │
│                                                          │
│  Email:    [________________]                            │
│  Password: [________________]                            │
│  [Iniciar Sesión]                                        │
│                                                          │
│  ¿No tenés cuenta? [Registrarse]                         │
│  ¿Olvidaste tu contraseña? [Recuperar]                   │
│                                                          │
│  (Método: email/password — estándar ecommerce)           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  ADMIN — /admin                                          │
│                                                          │
│  🔒 Acceso restringido                                   │
│                                                          │
│  [Iniciar sesión con Google]  ← Popup OAuth de Google    │
│                                                          │
│  Si no tenés claim admin → "Acceso no autorizado"        │
│  (Método: Google OAuth — sin contraseñas en código)      │
└──────────────────────────────────────────────────────────┘
```

**Por qué dual:**
- **Clientes:** son reacios a usar Google Auth en un ecommerce. Email/password es lo que esperan. Ya tienen guest checkout, esto es opcional.
- **Admin:** sos una sola persona. Google OAuth elimina contraseñas, by-passes, y da 2FA gratis.

### Prerequisito: Custom claim `admin`

ANTES de implementar esto, verificar que tu usuario Firebase tiene el custom claim `admin: true`. Si no lo tiene, el bypass actual es tu única entrada — hay que setearlo primero.

**Opción A — Firebase Console (si soporta custom claims):**
No soporta directamente.

**Opción B — Script temporal con Firebase Admin SDK:**

```bash
npm install firebase-admin
```

```js
// scripts/set-admin-claim.js
const admin = require('firebase-admin')
const serviceAccount = require('../serviceAccountKey.json') // descargado de Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

async function setAdminClaim(email) {
  const user = await admin.auth().getUserByEmail(email)
  await admin.auth().setCustomUserClaims(user.uid, { admin: true })
  console.log(`✅ Claim 'admin: true' seteado para ${email} (uid: ${user.uid})`)
  process.exit(0)
}

setAdminClaim('victorchavezd@gmail.com').catch(err => {
  console.error(err)
  process.exit(1)
})
```

```bash
node scripts/set-admin-claim.js
```

**Verificar:**

```js
// En la consola del navegador, después de loguearte:
const user = firebase.auth().currentUser
const token = await user.getIdTokenResult()
console.log(token.claims.admin) // debe imprimir true
```

### Cambios de código

#### 1. Nuevo archivo: `src/services/auth.js`

Centraliza toda la lógica de autenticación:

```js
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, sendPasswordResetEmail,
         onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

// ─── ADMIN: Google OAuth ───────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function checkIsAdmin(user) {
  if (!user) return false
  const token = await user.getIdTokenResult(true)
  return !!token.claims.admin
}

// ─── CLIENTES: Email/Password ──────────────────────────
export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

// ─── COMÚN ─────────────────────────────────────────────
export function listenAuth(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function logout() {
  return signOut(auth)
}
```

#### 2. Nuevo archivo: `src/pages/AdminLoginPage.jsx`

Login exclusivo para admin — solo botón de Google:

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, checkIsAdmin, listenAuth } from '../../services/auth'

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = listenAuth(async (user) => {
      if (user) {
        const admin = await checkIsAdmin(user)
        if (admin) {
          navigate('/admin', { replace: true })
        }
      }
    })
    return unsub
  }, [navigate])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const user = await signInWithGoogle()
      const admin = await checkIsAdmin(user)
      if (!admin) {
        await signOut(auth)
        setError('Tu cuenta no tiene permisos de administrador.')
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('')
      } else {
        setError('Error al iniciar sesión con Google.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm text-center">
        <h1 className="text-xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-500 text-sm mb-6">Acceso restringido</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Iniciando...' : 'Iniciar sesión con Google'}
        </button>

        <a href="/" className="block mt-4 text-sm text-gray-400 hover:text-gray-600">
          ← Volver a la tienda
        </a>
      </div>
    </div>
  )
}
```

#### 3. Modificar `src/pages/LoginPage.jsx` — Solo clientes

**Eliminar TODO lo relacionado al bypass:**
- Constante `ADMIN_EMAIL_BYPASS` (línea 6)
- Bloque `localStorage.getItem('myp_admin_bypass')` en `useEffect` (líneas 18-28)
- Condición `isBypassEmail` en `handleLogin` (líneas 69-72, bloques internos 73-88)
- Condición `isBypassEmail` en `onAuthStateChanged` (línea 39)
- Botón de bypass en JSX (líneas 267-299)
- La lógica de auto-redirect a `/admin` (líneas 43-45)

**Resultado:** `LoginPage.jsx` maneja SOLO login/registro de clientes con email/password. Sin menciones de admin, sin bypass, sin redirects a `/admin`.

#### 4. Modificar `src/pages/admin/AdminLayout.jsx`

Agregar guard de ruta — si el usuario no es admin, redirigir a `/admin/login`:

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listenAuth, checkIsAdmin } from '../../services/auth'

export default function AdminLayout({ children }) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = listenAuth(async (user) => {
      if (!user) {
        navigate('/admin/login', { replace: true })
        return
      }
      const admin = await checkIsAdmin(user)
      if (!admin) {
        navigate('/admin/login', { replace: true })
        return
      }
      setAuthorized(true)
      setLoading(false)
    })
    return unsub
  }, [navigate])

  if (loading) return <div className="p-8 text-center">Verificando acceso...</div>
  if (!authorized) return null

  return ( /* layout existente */ )
}
```

#### 5. Actualizar rutas en `src/pages/admin/[...all].astro` y `src/components/admin/AdminApp.jsx`

Agregar ruta `/admin/login`:

```jsx
// AdminApp.jsx — agregar import y ruta
import AdminLoginPage from '../../pages/admin/AdminLoginPage'

<Route path="login" element={<AdminLoginPage />} />
```

```astro
// [...all].astro — agregar al getStaticPaths
{ params: { all: 'login' } },
```

#### 6. Actualizar `src/pages/admin/AdminLayout.jsx`

El botón de "Salir" del admin debe usar `signOut` de Firebase y redirect a `/admin/login`:

```jsx
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'

const handleLogout = async () => {
  await signOut(auth)
  navigate('/admin/login', { replace: true })
}
```

### Archivos modificados/resumidos

| Archivo | Acción |
|---|---|
| `src/services/auth.js` | **NUEVO** — Centraliza auth (Google + Email/Password) |
| `src/pages/admin/AdminLoginPage.jsx` | **NUEVO** — Login admin con Google OAuth |
| `src/pages/LoginPage.jsx` | **MODIFICAR** — Eliminar bypass, dejar solo email/password para clientes |
| `src/pages/admin/AdminLayout.jsx` | **MODIFICAR** — Agregar auth guard |
| `src/components/admin/AdminApp.jsx` | **MODIFICAR** — Agregar ruta `/admin/login` |
| `src/pages/admin/[...all].astro` | **MODIFICAR** — Agregar `login` a `getStaticPaths` |
| `scripts/set-admin-claim.js` | **NUEVO** (temporal) — Script para setear claim admin |

### Orden de ejecución

1. Ejecutar `set-admin-claim.js` para setear el claim en tu usuario
2. Verificar con `getIdTokenResult()` que `claims.admin === true`
3. Crear `src/services/auth.js`
4. Crear `src/pages/admin/AdminLoginPage.jsx`
5. Modificar `AdminApp.jsx` y `[...all].astro` para agregar ruta `/admin/login`
6. Modificar `AdminLayout.jsx` para agregar auth guard
7. Modificar `LoginPage.jsx` — eliminar bypass, dejar solo clientes
8. Probar: login admin con Google → `/admin`
9. Probar: login cliente con email/password → `/login`
10. Probar: usuario sin claim → ve "Acceso no autorizado"
11. Eliminar `scripts/set-admin-claim.js` (ya no se necesita)

---

## Fase S2 — Firestore Rules: Eliminar Bypass Temporal (CRITICAL)

**Problema:** Todas las reglas tienen `request.time < timestamp.date(2026, 6, 15)` como condición alternativa. Hoy es 28/06/2026 — el bypass ya venció, pero:

1. **Si no se desplegó desde el 15/06:** Las reglas actuales en producción podrían tener el bypass activo si el último deploy fue antes del 15/06
2. **Si se desplegó después:** Las reglas actuales ya no tienen el bypass, pero el código fuente aún lo contiene — confusiones futuras

### Cambios en `firestore.rules`:

Eliminar TODAS las ocurrencias de `|| request.time < timestamp.date(2026, 6, 15)`:

```
Lineas a modificar: 13, 17, 33, 41, 47, 56, 58, 69, 90
```

**Regla resultante para `myp_productos`:**

```firestore
match /myp_productos/{productId} {
  allow read: if true;
  allow create, delete: if request.auth != null && (
    request.auth.token.admin == true ||
    request.auth.token.email == 'victorchavezd@gmail.com'
  );
  allow update: if request.auth != null && (
    request.auth.token.admin == true ||
    request.auth.token.email == 'victorchavezd@gmail.com'
  ) || (
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock', 'variantes', 'actualizado_en']) &&
    request.resource.data.stock <= resource.data.stock
  );
}
```

**Nota:** El email hardcodeado en las reglas (`victorchavezd@gmail.com`) es un patrón aceptable en Firestore Rules porque es server-side y no se expone en el bundle del cliente. Sin embargo, el ideal es usar solo `request.auth.token.admin == true` y gestionar el claim via Admin SDK.

### Post-deploy:
- Verificar en Firebase Console → Firestore → Rules que el deploy fue exitoso
- Probar que un usuario NO admin no puede escribir en `myp_productos`

---

## Fase S3 — Sanitización XSS (HIGH)

**Problema:** Todos los campos de texto libre aceptan strings arbitrarios sin sanitización. Si bien React escapa JSX por defecto, hay puntos de peligro:

1. `dangerouslySetInnerHTML` — no se usa actualmente (bien)
2. URLs interpoladas directamente en `href` o `src` — pueden contener `javascript:` protocol
3. Contenido de Firestore renderizado sin escaping — si un admin inyecta HTML en descripciones de productos, se renderiza
4. `innerHTML` implícito vía markdown/rich text si se agrega en el futuro

### Instalación:

```bash
npm install dompurify
```

No se necesita `isomorphic-dompurify` porque el proyecto es CSR puro (no hay SSR que necesite sanitización en servidor).

### Archivos a crear: `src/utils/sanitize.js`

```js
import DOMPurify from 'dompurify'

export function sanitizeText(text) {
  if (typeof text !== 'string') return ''
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  })
}
```

### Archivos a modificar:

| Archivo | Campo | Acción |
|---|---|---|
| `CheckoutPage.jsx` | nombre, apellido, direccion, referencia, nombreMascota | `sanitizeText()` antes de `setNombre()`, etc. |
| `ProductoFormModal.jsx` | nombre, descripcion | `sanitizeText()` en `handleSubmit` antes de armar `datos` |
| `ReclamacionesForm.jsx` | todos los campos de texto | `sanitizeText()` en `handleSubmit` |
| `ProductPage.jsx` | autorNombre, comentario | `sanitizeText()` en `handleSubmitResena` |
| `CVRMDashboard.jsx` | newMember.tutor, newMember.mascota | `sanitizeText()` al registrar miembro |

**Nota:** `sanitizeText` elimina todo HTML. `sanitizeHtml` se reserva para campos que legítimamente contengan HTML (ej: descripción de producto con formato rico, si se implementa en el futuro).

---

## Fase S5 — Refactor de `firestore.js` (MEDIUM)

**Problema:** 899 líneas, 30+ funciones, todo en un solo archivo. Difícil de mantener, testear y hacer code review.

### Estrategia: Separar por dominio de negocio

**Nuevo estructura:**

```
src/services/
├── firebase.js              # Sin cambios (SDK init)
├── firestore.js             # Re-exports barrel (importa todo y re-exporta)
├── products.js              # CRUD productos, variantes, stock
├── orders.js                # Pedidos, transacciones stock, estados
├── caja.js                  # Caja diaria: abrir, cerrar, transacciones
├── coupons.js               # Cupones CRUD
├── config.js                # Configuración envíos, club
├── reviews.js               # Reseñas CRUD
└── members.js               # Club miembros, puntos (si se agrega)
```

### Mapeo de funciones a módulos:

| Módulo | Funciones actuales (líneas) |
|---|---|
| `products.js` | `buscarProductos` (17), `obtenerProductos` (31), `obtenerProductoPorSlug` (83), `obtenerProductoPorId` (98), `obtenerRelacionados` (107), `crearProducto` (126), `actualizarProducto` (142), `eliminarProducto` (153), `actualizarStockProductoAdmin` (591), `obtenerTodosProductosAdmin` (612) |
| `orders.js` | `crearPedidoConTransaccion` (184), `obtenerPedidosAdmin` (279), `actualizarEstadoPedido` (299), `reestablecerStockPedidoConTransaccion` (353), `obtenerPedidosRango` (729), `obtenerProductosMasVendidos` (758) |
| `caja.js` | `obtenerCajaActiva` (420), `abrirCajaDiaria` (438), `registrarTransaccionManual` (484), `cerrarCajaDiaria` (517), `obtenerHistorialCajas` (543), `obtenerVentasConfirmadasDia` (559) |
| `coupons.js` | `obtenerCupones` (628), `crearCupon` (638), `actualizarEstadoCupon` (663), `eliminarCupon` (673) |
| `config.js` | `obtenerConfiguracionEnvio` (164), `guardarConfiguracionEnvio` (683), `asignarRepartidorPedido` (700) |
| `reviews.js` | `obtenerResenas` (804), `actualizarEstadoResena` (828), `eliminarResena` (843), `crearResena` (855), `obtenerResenasPorProducto` (877) |

### `firestore.js` como barrel:

```js
export { buscarProductos, obtenerProductos, /* ... */ } from './products'
export { crearPedidoConTransaccion, /* ... */ } from './orders'
export { obtenerCajaActiva, /* ... */ } from './caja'
export { obtenerCupones, /* ... */ } from './coupons'
export { obtenerConfiguracionEnvio, /* ... */ } from './config'
export { obtenerResenas, /* ... */ } from './reviews'
```

### Beneficio: Imports existentes no rompen

Todos los archivos que hacen `import { crearPedidoConTransaccion } from '../services/firestore'` siguen funcionando porque el barrel re-exporta todo. No hay que modificar ningún import.

### Orden de migración:
1. Crear módulos nuevos (`products.js`, `orders.js`, etc.)
2. Mover funciones de `firestore.js` al módulo correspondiente
3. Actualizar `firestore.js` para re-exportar desde los nuevos módulos
4. Verificar que `npm run build` pasa
5. Verificar tests: `npm run test`

---

## Fase S6 — Eliminar Lógica Duplicada de Cupones (LOW)

**Problema:** `cartStore.js` (líneas 132-146) tiene un fallback local con cupones hardcodeados:

```js
const mockCoupons = {
  'BIENVENIDO10': 10,
  'MISSY15': 15,
  'MASCOTA20': 20,
}
```

Esto significa que si Firestore falla, cualquier usuario puede usar estos cupones sin verificación server-side. Es un riesgo de seguridad y genera confusión (el admin no sabe por qué un cupón "no existe" en Firestore pero funciona en la tienda).

### Cambios en `src/store/cartStore.js`:

Eliminar el bloque completo del fallback (líneas 131-146):

```js
// ANTES (líneas 127-146):
} catch (e) {
  console.warn('⚠️ Error al consultar cupón en Firestore. Usando fallback local:', e)
}
// Fallback local
const mockCoupons = { ... }
const discount = mockCoupons[uppercaseCode]
if (discount) { ... }
return { success: false, message: 'Cupón no válido' }

// DESPUÉS:
} catch (e) {
  console.error('Error al validar cupón:', e)
  return { success: false, message: 'Error al validar el cupón. Intenta de nuevo.' }
}
return { success: false, message: 'Cupón no válido' }
```

Si Firestore está caído, el usuario ve "Error al validar el cupón" en vez de que cupones fantasma funcionen.

---

## Fase S7 — Índices Firestore Compuestos (LOW)

**Problema:** `obtenerProductos` en `firestore.js` (líneas 31-80) hace sort y paginate en memoria porque no hay índices compuestos que permitan `where + orderBy` en Firestore.

### Índices a crear en `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "myp_productos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activo", "order": "ASCENDING" },
        { "fieldPath": "fecha_creacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "myp_productos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "activo", "order": "ASCENDING" },
        { "fieldPath": "categorias", "arrayConfig": "CONTAINS" },
        { "fieldPath": "fecha_creacion", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "myp_pedidos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "creado_en", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "myp_pedidos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "creado_en", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "myp_reviews",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "producto_id", "order": "ASCENDING" },
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "creado_en", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Deploy:

```bash
firebase deploy --only firestore:indexes
```

### Optimización posterior (opcional):

Una vez creados los índices, se puede refactorizar `obtenerProductos` para hacer sort en Firestore en vez de en memoria. Esto requiere cambiar la query para incluir `orderBy` y manejar la paginación con `startAfter` en vez de `slice`. **No es urgente** con ~41 productos, pero prepara el terreno para escalar.

---

## Fase S8 — `.env.example` Actualizado (LOW)

Verificar que `.env.example` refleje todas las variables que `firebase.js` espera:

```
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=
```

Estas son las que lee `firebase.js` (líneas 17-23). Verificar que no haya variables viejas de Vite que ya no se usen.

---

## Orden de Ejecución Recomendado

| Paso | Fase | Dependencias | Estimación |
|---|---|---|---|
| 1 | S1 (Auth dual: Admin Google + Clientes Email) | Ninguna — URGENTE. Requiere setear custom claim primero | 2h |
| 2 | S2 (Firestore Rules) | Ninguna — URGENTE | 0.5h |
| 3 | S6 (Cupones duplicados) | Ninguna | 0.25h |
| 4 | S8 (.env.example) | Ninguna | 0.1h |
| 5 | S3 (XSS sanitization) | Ninguna | 1.5h |
| 6 | S5 (firestore.js split) | Mejor hacer DESPUÉS de ZOD (PLAN-ZOD Fase 3.9) para no tener que resolver conflictos de merge | 2h |
| 7 | S7 (Índices Firestore) | Mejor hacer después de S5 para confirmar queries finales | 0.5h |
| **Total** | | | **~6.85h** |

### Nota de dependencia con PLAN-ZOD:

- **S5 (firestore.js split)** debe hacerse **DESPUÉS** de la Fase 3.9 del PLAN-ZOD (integración de Zod en `firestore.js`). Si se hace al revés, las ediciones de Zod y las del split chocan.
- **S3 (XSS)** es independiente y puede hacerse en paralelo con ZOD.
- **S1 y S2** son urgentes y deben hacerse ANTES de todo lo demás.

---

## Criterios de Aceptación

- [ ] **S1:** No existe ningún `admin123` ni `myp_admin_bypass` en el código fuente
- [ ] **S1:** `/admin/login` muestra solo botón "Iniciar con Google"
- [ ] **S1:** Admin se loguea con Google → entra a `/admin` si tiene claim `admin: true`
- [ ] **S1:** Admin sin claim → ve "Acceso no autorizado"
- [ ] **S1:** `/login` funciona con email/password para clientes (sin menciones de admin)
- [ ] **S1:** `LoginPage.jsx` no contiene referencias a `admin`, `bypass`, ni `isBypassEmail`
- [ ] **S2:** Ninguna regla en `firestore.rules` contiene `request.time < timestamp`
- [ ] **S2:** Reglas desplegadas en producción y verificadas en Firebase Console
- [ ] **S3:** Todo campo de texto libre pasa por `sanitizeText()` antes de guardarse
- [ ] **S5:** `firestore.js` es un barrel < 30 líneas, funciones en módulos separados
- [ ] **S5:** `npm run build` y `npm run test` pasan sin errores
- [ ] **S6:** No existen `mockCoupons` en `cartStore.js`
- [ ] **S7:** Índices compuestos desplegados en Firestore
- [ ] **S8:** `.env.example` refleja las variables reales de `firebase.js`

---

## Relación con PLAN-ZOD.md

| Este plan | PLAN-ZOD | Relación |
|---|---|---|
| S1 (Auth) | — | Independiente, hacer primero |
| S2 (Rules) | — | Independiente, hacer primero |
| S3 (XSS) | — | Independiente, paralelo con ZOD |
| S4 (localStorage) | Fase 1.3 | **Cubierto por ZOD** |
| S5 (Split) | Fase 3.9 | Hacer DESPUÉS de ZOD |
| S6 (Cupones) | — | Independiente |
| S7 (Índices) | — | Hacer después de S5 |
| S8 (.env) | — | Independiente |
| — | Fase 1-2 (Schemas) | Cubierto por ZOD |
| — | Fase 3 (Integración) | Cubierto por ZOD |
| — | Fase 4 (Tests) | Cubierto por ZOD |
| — | Fase 5 (Limpieza) | Cubierto por ZOD |

---

## Opinión

### ¿Es la decisión correcta?

Sí. La separación dual es el patrón estándar para ecommerce con panel admin:

1. **No inventás nada nuevo** — Firebase soporta múltiples proveedores de auth en el mismo proyecto. Podés tener Google OAuth para admin y email/password para clientes simultáneamente. No hay conflicto.

2. **La fricción del cliente es la prioridad #1 en ecommerce** — Cada paso extra en el registro/login de un cliente es un carrito abandonado. Email/password es el mínimo. Google OAuth para clientes es válido PERO reduce la tasa de conversión en mercados donde no es común (Latam).

3. **El admin es una sola persona** — No necesitás "flexibilidad" para el admin. Necesitás seguridad máxima con cero mantenimiento. Google OAuth cumple: sin contraseñas que rotar, sin hashes que gestionar, 2FA gratis.

4. **El bypass actual es un risk real** — No es "temporal de desarrollo". Está en producción. Cualquiera que inspeccione el bundle tiene acceso admin. Esto ya debería estar fixeado.

### Riesgo a vigilar

**El custom claim es el punto único de fallo.** Si tu usuario Google es comprometido, el atacante tiene acceso admin completo. Mitigaciones:
- **2FA en tu Google Account** (obligatorio, no opcional)
- **Verificar que el claim solo esté en tu usuario** — no lo setees para otros emails
- **Firestore Rules** (Fase S2) como segunda barrera — incluso con claim admin, las reglas definen QUÉ puede escribir

### ¿Por qué NO solo email/password para admin?

Podrías. Pero:
- Tenés que elegir una contraseña segura y recordarla
- Si la perdés, la recuperás manualmente desde Firebase Console
- No tenés 2FA a menos que lo configures por separado
- El bypass actual demuestra que la tendencia natural es simplificar demasiado (admin123) — Google OAuth elimina esa tentación

### ¿Por qué NO Google OAuth para clientes también?

Podrías agregarlo como **opción adicional** (no reemplazar email/password). Pero:
- En Perú/Latam, muchos usuarios no tienen Google asociado a su correo principal
- La expectativa del cliente promedio de un pet shop es email + contraseña
- Guest checkout ya funciona — el login es opcional para el cliente
- Si en el futuro querés agregar "Iniciar con Google" como opción extra para clientes, es trivial: solo agregar el botón en `LoginPage.jsx` usando el mismo `signInWithGoogle()` de `auth.js`

### Veredicto

La arquitectura propuesta es la correcta para tu caso. No es overengineering, es el mínimo responsable. Ejecutá S1 completo (claim + auth dual) antes de cualquier otra cosa — es la puerta de entrada a todo el panel administrativo.
