# Plan de Acción: Implementación de Zod en Missy & Po Pet Shop

## Objetivo

Eliminar toda la validación hand-rolled dispersa en 15+ archivos y reemplazarla por schemas Zod centralizados, tipados y reutilizables. Cada módulo que acepta datos de usuario o escribe a Firestore pasa a tener una capa de validación declarativa antes de cualquier efecto secundario.

---

## Fase 0 — Setup

### 0.1 Instalar dependencia

```bash
npm install zod
```

No se necesita `@hookform/resolvers` ni `react-hook-form` — el proyecto usa estado local con `useState`, no form libraries. Zod se usa directamente con `safeParse`.

### 0.2 Crear estructura de schemas

```
src/
└── schemas/
    ├── index.js          # Re-exports barrel
    ├── product.js         # Producto (admin CRUD + Firestore writes)
    ├── checkout.js        # Formulario de checkout (cliente)
    ├── cart.js            # Item del carrito (hidratación localStorage)
    ├── coupon.js          # Cupón de descuento
    ├── shippingConfig.js  # Configuración de envíos
    ├── cajaDiaria.js      # Apertura, movimiento, cierre de caja
    ├── review.js          # Reseña de producto
    ├── reclamacion.js     # Formulario de reclamaciones
    └── payment.js         # Pago Yape/Plin (operación + archivo)
```

Cada archivo exporta el schema y un helper `validate` que encapsula `safeParse` con formato de error amigable.

---

## Fase 1 — Schemas Base (archivos nuevos)

### 1.1 `src/schemas/product.js`

**Campos a validar:**

| Campo | Regla |
|---|---|
| `nombre` | `string().min(1).max(200).trim()` |
| `slug` | `string().max(200).trim()` (auto-generado si vacío) |
| `sku` | `string().min(1).max(50).trim().toUpperCase()` |
| `descripcion` | `string().max(2000).default('')` |
| `precio_compra` | `z.coerce.number().min(0)` |
| `precio_regular` | `z.coerce.number().min(0)` |
| `precio_oferta` | `z.coerce.number().min(0).nullable()` |
| `categorias` | `array(string()).min(1)` |
| `stock` | `z.coerce.number().int().min(0)` |
| `activo` | `boolean().default(true)` |
| `imagenes` | `array(string().url()).min(1)` |
| `variantes` | `array(VarianteSchema).default([])` |
| `tags_busqueda` | `array(string()).default([])` |

**Sub-schema `VarianteSchema`:**

| Campo | Regla |
|---|---|
| `id` | `z.coerce.number()` |
| `sku` | `string()` |
| `atributos` | `record(string(), string())` |
| `precio_unitario` | `z.coerce.number().min(0).nullable()` |
| `stock` | `z.coerce.number().int().min(0)` |

**Regla de negocio adicional:** Si `precio_oferta` no es null, debe ser menor que `precio_regular`. Usar `.refine()`.

**Archivos afectados:**
- `src/schemas/product.js` (nuevo)
- `src/components/admin/ProductoFormModal.jsx` — reemplazar `handleSubmit` validation (líneas 157-161)
- `src/services/firestore.js` — envolver `crearProducto()` y `actualizarProducto()` con `ProductSchema.safeParse(data)` antes de `addDoc`/`updateDoc`

### 1.2 `src/schemas/checkout.js`

**Campos a validar:**

| Campo | Regla |
|---|---|
| `nombre` | `string().min(1, 'Requerido').max(100).trim()` |
| `apellido` | `string().min(1, 'Requerido').max(100).trim()` |
| `email` | `string().email('Email inválido').max(150)` |
| `celular` | `string().regex(/^\d{9}$/, 'Celular debe tener 9 dígitos')` |
| `tipoDocumento` | `enum(['DNI', 'RUC'])` |
| `numeroDocumento` | `string()` — refinado: `.refine(v => tipoDoc==='DNI' ? v.length===8 : v.length===11, 'DNI: 8 dígitos, RUC: 11')` |
| `departamento` | `string().min(1)` |
| `distritoArequipa` | `string()` (condicional si departamento=Arequipa) |
| `distritoNacional` | `string()` (condicional si departamento!=Arequipa) |
| `direccion` | `string().min(5, 'Dirección muy corta').max(300)` |
| `referencia` | `string().max(200).default('')` |
| `nombreMascota` | `string().min(1).max(50)` |
| `metodoPago` | `enum(['yape', 'tarjeta', 'contraEntrega'])` |
| `notas` | `string().max(500).default('')` |

**Refinamiento condicional:** Usar `z.discriminatedUnion` o `.refine()` para validar que si `departamento === 'Arequipa'`, `distritoArequipa` es requerido, y si es otro departamento, `distritoNacional` es requerido.

**Archivos afectados:**
- `src/schemas/checkout.js` (nuevo)
- `src/pages/CheckoutPage.jsx` — reemplazar `validateForm()` (líneas 252-271) con `CheckoutSchema.safeParse({...})`
- El `setErrorMsg` se alimenta del `.error.issues[0].message` de Zod

### 1.3 `src/schemas/cart.js`

**Schema `CartItemSchema`:**

| Campo | Regla |
|---|---|
| `id` | `z.coerce.number().positive()` |
| `sku` | `string()` |
| `slug` | `string()` |
| `nombre` | `string().min(1)` |
| `precio_unitario` | `z.coerce.number().int().positive()` (está en centavos) |
| `imagen` | `string()` |
| `ean` | `string().default('')` |
| `variante` | `string().default('default')` |
| `cantidad` | `z.coerce.number().int().min(1).max(999)` |
| `_key` | `string().optional()` |

**Schema `CartStateSchema`** (para hidratación de localStorage):

```js
z.object({
  items: z.array(CartItemSchema),
  couponCode: z.string().default(''),
  couponDiscount: z.number().min(0).max(100).default(0),
  subtotal: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  itemCount: z.number().int().min(0).default(0),
})
```

**Archivos afectados:**
- `src/schemas/cart.js` (nuevo)
- `src/store/cartStore.js` — en la configuración `persist`, agregar `merge` personalizado que use `CartStateSchema.safeParse()` para filtrar items corruptos al hidratar desde localStorage

**Implementación en cartStore.js:**

```js
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: 'myp-cart',
    partialize: (state) => ({ /* ... */ }),
    merge: (persistedState, currentState) => {
      const result = CartStateSchema.safeParse(persistedState)
      if (result.success) {
        return { ...currentState, ...result.data }
      }
      console.warn('Cart data corrupted, using defaults:', result.error)
      return currentState
    },
  }
)
```

### 1.4 `src/schemas/coupon.js`

| Campo | Regla |
|---|---|
| `codigo` | `string().min(1).max(20).trim().toUpperCase()` |
| `descuento` | `z.coerce.number().int().min(1).max(100)` |
| `compraMinima` | `z.coerce.number().min(0).default(0)` |

**Archivos afectados:**
- `src/schemas/coupon.js` (nuevo)
- `src/pages/admin/ConfiguracionEnviosCupones.jsx` — reemplazar validación manual en `handleCrearCupon` (líneas 90-104)
- `src/services/firestore.js` — envolver `crearCupon()` con schema

### 1.5 `src/schemas/shippingConfig.js`

| Campo | Regla |
|---|---|
| `arequipaFee` | `z.coerce.number().min(0)` |
| `arequipaFreeLimit` | `z.coerce.number().min(0)` |
| `nationalFee` | `z.coerce.number().min(0)` |
| `nationalFreeLimit` | `z.coerce.number().min(0)` |

**Archivos afectados:**
- `src/schemas/shippingConfig.js` (nuevo)
- `src/pages/admin/ConfiguracionEnviosCupones.jsx` — reemplazar validación en `handleGuardarShipping`
- `src/services/firestore.js` — envolver `guardarConfiguracionEnvio()` con schema
- `src/pages/CheckoutPage.jsx` — validar `shippingConfig` al cargar de Firestore antes de usarlo en cálculos (líneas 94-104)

### 1.6 `src/schemas/cajaDiaria.js`

**Schema `AperturaCajaSchema`:**

| Campo | Regla |
|---|---|
| `monto` | `z.coerce.number().min(0, 'Monto debe ser ≥ 0')` |

**Schema `MovimientoSchema`:**

| Campo | Regla |
|---|---|
| `tipo` | `enum(['ingreso', 'egreso'])` |
| `monto` | `z.coerce.number().positive('Monto debe ser > 0')` |
| `concepto` | `string().min(1, 'Concepto requerido').max(200)` |

**Schema `CierreCajaSchema`:**

| Campo | Regla |
|---|---|
| `monto` | `z.coerce.number().min(0, 'Monto debe ser ≥ 0')` |

**Archivos afectados:**
- `src/schemas/cajaDiaria.js` (nuevo)
- `src/pages/admin/CajaDiaria.jsx` — reemplazar validación en `handleAbrirCaja` (68-73), `handleRegistrarMovimiento` (94-104), `handleCerrarCaja` (135-139)
- `src/services/firestore.js` — envolver `registrarTransaccionManual()` con `MovimientoSchema`

### 1.7 `src/schemas/review.js`

| Campo | Regla |
|---|---|
| `productoId` | `z.coerce.number().positive()` |
| `productoNombre` | `string().min(1)` |
| `autorNombre` | `string().min(1, 'Nombre requerido').max(100).trim()` |
| `calificacion` | `z.coerce.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5')` |
| `comentario` | `string().min(3, 'Comentario muy corto').max(1000).trim()` |

**Archivos afectados:**
- `src/schemas/review.js` (nuevo)
- `src/pages/ProductPage.jsx` — reemplazar validación en `handleSubmitResena` (95-101)
- `src/services/firestore.js` — envolver `crearResena()` con schema

### 1.8 `src/schemas/reclamacion.js`

| Campo | Regla |
|---|---|
| `nombre` | `string().min(1).max(100)` |
| `apellido` | `string().min(1).max(100)` |
| `tipoDoc` | `enum(['DNI', 'CE', 'RUC'])` |
| `numDoc` | `string()` — refinado por tipoDoc (DNI=8, RUC=11, CE=9-12) |
| `telefono` | `string().regex(/^\d{7,9}$/, 'Teléfono inválido')` |
| `email` | `string().email()` |
| `departamento` | `string().min(1)` |
| `provincia` | `string().min(1)` |
| `distrito` | `string().min(1)` |
| `tipoBien` | `enum(['Producto', 'Servicio'])` |
| `montoReclamado` | `z.coerce.number().min(0)` |
| `descripcionBien` | `string().min(10).max(500)` |
| `tipoReclamo` | `enum(['Reclamo', 'Queja'])` |
| `detalleReclamo` | `string().min(10).max(1000)` |
| `pedidoConsumidor` | `string().max(200).default('')` |
| `autorizoNotif` | `literal(true, { errorMap: () => ({ message: 'Debes autorizar las notificaciones' }) })` |

**Archivos afectados:**
- `src/schemas/reclamacion.js` (nuevo)
- `src/components/legal/ReclamacionesForm.jsx` — reemplazar el `handleSubmit` que actualmente hace zero validación JS (solo HTML `required`)

### 1.9 `src/schemas/payment.js`

**Schema `YapePlinSchema`:**

| Campo | Regla |
|---|---|
| `operacion` | `string().regex(/^\d{6,8}$/, 'Operación: 6-8 dígitos')` |
| `comprobanteFile` | `instanceof File` con refinación `.refine(f => f.size <= 2*1024*1024, 'Máx 2MB')` |

**Archivos afectados:**
- `src/schemas/payment.js` (nuevo)
- `src/components/checkout/PaymentQrCulqi.jsx` — reemplazar validación en `handleSubmit` (34-40)

### 1.10 `src/schemas/index.js` (barrel)

```js
export { ProductSchema, VarianteSchema } from './product'
export { CheckoutSchema } from './checkout'
export { CartItemSchema, CartStateSchema } from './cart'
export { CouponSchema } from './coupon'
export { ShippingConfigSchema } from './shippingConfig'
export { AperturaCajaSchema, MovimientoSchema, CierreCajaSchema } from './cajaDiaria'
export { ReviewSchema } from './review'
export { ReclamacionSchema } from './reclamacion'
export { YapePlinSchema } from './payment'
```

---

## Fase 2 — Helper de Utilidad

### 2.1 `src/schemas/validate.js`

Función helper que centraliza el patrón `safeParse` → `setError`:

```js
/**
 * Valida data con un schema Zod. Si falla, retorna { ok: false, error: string }.
 * Si pasa, retorna { ok: true, data: parsed }.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) {
    return { ok: true, data: result.data }
  }
  const firstIssue = result.error.issues[0]
  return { ok: false, error: firstIssue?.message || 'Datos inválidos' }
}
```

Esto reduce el boilerplate en cada componente de 5-10 líneas a 1 línea:

```js
// Antes (CheckoutPage.jsx líneas 252-271):
const validateForm = () => {
  if (!nombre.trim() || !apellido.trim() || ...) {
    setErrorMsg('Por favor completa todos los campos obligatorios.')
    return false
  }
  if (tipoDocumento === 'DNI' && numeroDocumento.length !== 8) { ... }
  // ... 15 líneas más
  return true
}

// Después:
const { ok, error } = validate(CheckoutSchema, { nombre, apellido, email, ... })
if (!ok) { setErrorMsg(error); return false }
```

---

## Fase 3 — Integración por Archivo

### Orden de implementación (de menor a mayor riesgo de regressión):

| Paso | Archivo | Cambio | Riesgo |
|---|---|---|---|
| 3.1 | `src/pages/admin/CajaDiaria.jsx` | Reemplazar 3 bloques de validación manual con `validate()` usando schemas de caja | Bajo — aislado, solo admin |
| 3.2 | `src/pages/admin/ConfiguracionEnviosCupones.jsx` | Reemplazar validación de cupones y config envíos | Bajo — solo admin |
| 3.3 | `src/components/checkout/PaymentQrCulqi.jsx` | Reemplazar validación de operación y archivo | Bajo — modal aislado |
| 3.4 | `src/pages/ProductPage.jsx` | Reemplazar validación de reseña | Bajo — 2 campos simples |
| 3.5 | `src/components/admin/ProductoFormModal.jsx` | Reemplazar validación del form de producto | Medio — afecta CRUD admin |
| 3.6 | `src/components/legal/ReclamacionesForm.jsx` | Agregar validación JS completa (actualmente cero) | Medio — formulario largo |
| 3.7 | `src/store/cartStore.js` | Agregar `merge` con `CartStateSchema` para hidratación segura | Medio — afecta carrito entero |
| 3.8 | `src/pages/CheckoutPage.jsx` | Reemplazar `validateForm()` + validar configs de Firestore | Alto — flujo crítico de compra |
| 3.9 | `src/services/firestore.js` | Envolver `crearProducto`, `actualizarProducto`, `crearResena`, `registrarTransaccionManual`, `crearCupon`, `guardarConfiguracionEnvio` con schemas | Alto — capa de datos |

---

## Fase 4 — Tests

### 4.1 Archivo: `src/schemas/__tests__/schemas.test.js`

Tests unitarios para cada schema usando Vitest:

```js
import { describe, it, expect } from 'vitest'
import { ProductSchema, CheckoutSchema, CartItemSchema, /* ... */ } from '../index'

describe('ProductSchema', () => {
  it('rejects product without name', () => { ... })
  it('rejects negative stock', () => { ... })
  it('rejects oferta > regular', () => { ... })
  it('coerces string prices to numbers', () => { ... })
  it('accepts valid product', () => { ... })
})

describe('CheckoutSchema', () => {
  it('rejects DNI with wrong length', () => { ... })
  it('rejects invalid email', () => { ... })
  it('rejects celular without 9 digits', () => { ... })
  it('requires distritoArequipa when departamento is Arequipa', () => { ... })
  it('requires distritoNacional when departamento is not Arequipa', () => { ... })
})

describe('CartItemSchema', () => {
  it('rejects item with negative price', () => { ... })
  it('rejects quantity > 999', () => { ... })
  it('accepts valid cart item', () => { ... })
})

describe('CartStateSchema', () => {
  it('filters corrupted items from localStorage', () => { ... })
  it('defaults missing fields', () => { ... })
})

describe('MovimientoSchema', () => {
  it('rejects monto <= 0', () => { ... })
  it('rejects empty concepto', () => { ... })
  it('accepts valid movimiento', () => { ... })
})

describe('ReclamacionSchema', () => {
  it('rejects numDoc wrong length for DNI', () => { ... })
  it('requires autorizoNotif = true', () => { ... })
})
```

### 4.2 Verificar que los tests existentes pasan

```bash
npm run test
```

Los tests existentes en `src/store/__tests/` no deberían romperse porque Zod solo agrega una capa de validación antes de las operaciones existentes — no cambia la lógica interna.

---

## Fase 5 — Limpieza

### 5.1 Eliminar código de validación redundante

Una vez que los schemas estén integrados y testeados, eliminar:

| Archivo | Líneas a eliminar |
|---|---|
| `CheckoutPage.jsx` | Función `validateForm()` completa (252-271), validación en `handleDocumentoChange` |
| `ProductoFormModal.jsx` | Bloque if de validación en `handleSubmit` (157-161) |
| `CajaDiaria.jsx` | Bloques if de validación en los 3 handlers (68-73, 94-104, 135-139) |
| `ConfiguracionEnviosCupones.jsx` | Bloques if de validación en `handleCrearCupon` (90-104) |
| `PaymentQrCulqi.jsx` | Bloque if de validación en `handleSubmit` (34-40) |
| `ProductPage.jsx` | Bloques if de validación en `handleSubmitResena` (95-101) |
| `ReclamacionesForm.jsx` | Ninguno — se agrega validación donde no existía |

### 5.2 Opcional: Eliminar fallback local de cupones

En `cartStore.js` (líneas 132-146) hay un objeto `mockCoupons` hardcodeado que actúa como fallback cuando Firestore falla. Esto es un riesgo de seguridad (cualquier código de cupón en ese objeto funciona sin verificación server-side). Evaluar eliminarlo.

---

## Resumen de Entregables

| # | Entregable | Tipo |
|---|---|---|
| 1 | `npm install zod` | Comando |
| 2 | `src/schemas/` (10 archivos) | Nuevo directorio |
| 3 | 6 componentes modificados | Edición |
| 1 archivo de servicio modificado (`firestore.js`) | Edición |
| 4 | `src/schemas/__tests__/schemas.test.js` | Nuevo archivo |
| 5 | Limpieza de validación redundante | Edición |

## Criterios de Aceptación

- [ ] Todo formulario existente valida con Zod antes de enviar
- [ ] `firestore.js` rechaza writes con datos inválidos antes de `addDoc`/`updateDoc`
- [ ] `cartStore` filtra items corruptos de localStorage al hidratar
- [ ] Tests cubren happy paths + edge cases de cada schema
- [ ] Ningún test existente falla
- [ ] No hay duplicación de reglas de validación (schema es source of truth)

## Estimación

| Fase | Horas |
|---|---|
| Fase 0 (setup) | 0.5h |
| Fase 1 (schemas) | 3h |
| Fase 2 (helper) | 0.25h |
| Fase 3 (integración) | 3h |
| Fase 4 (tests) | 1.5h |
| Fase 5 (limpieza) | 0.5h |
| **Total** | **~8.75h** |
