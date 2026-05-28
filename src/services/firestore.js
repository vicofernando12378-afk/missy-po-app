import {
  collection, doc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  serverTimestamp, runTransaction
} from 'firebase/firestore'
import { db } from './firebase'

// ============================================================
// FIRESTORE SERVICE — CRUD para myp_productos
// Missy & Po Pet Shop | Prefijo: myp_
// ============================================================

const COLECCION = 'myp_productos'

// ── BÚSQUEDA POR TEXTO (array-contains en tags_busqueda) ───
export async function buscarProductos(termino, limite = 10) {
  const q = query(
    collection(db, COLECCION),
    where('activo', '==', true),
    where('tags_busqueda', 'array-contains', termino.toLowerCase().trim()),
    limit(limite)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function obtenerProductos({
  categoria = null,
  soloOfertas = false,
  orden = 'fecha_creacion',
  paginaSize = 12,
  cursor = null,
} = {}) {
  // Consulta simple de activos para evitar requerir índices compuestos en Firestore
  let q = query(
    collection(db, COLECCION),
    where('activo', '==', true)
  )

  if (categoria) {
    q = query(q, where('categorias', 'array-contains', categoria))
  }

  const snap = await getDocs(q)
  let productos = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Ordenar en memoria
  productos.sort((a, b) => {
    const valA = a[orden] || 0
    const valB = b[orden] || 0
    if (typeof valA === 'string') {
      return valB.localeCompare(valA)
    }
    return valB - valA
  })

  // Filtrar ofertas en memoria si aplica
  if (soloOfertas) {
    productos = productos.filter(p => p.precio_oferta !== null)
  }

  // Paginación en memoria
  let startIndex = 0
  if (cursor) {
    const idx = productos.findIndex(p => p.id === (cursor.id || cursor))
    if (idx !== -1) startIndex = idx + 1
  }

  const paginated = productos.slice(startIndex, startIndex + paginaSize)
  const lastDoc = paginated[paginated.length - 1] || null

  return { productos: paginated, lastDoc, hasMore: (startIndex + paginaSize) < productos.length }
}

// ── OBTENER UN PRODUCTO POR SLUG ───────────────────────────
export async function obtenerProductoPorSlug(slug) {
  const q = query(
    collection(db, COLECCION),
    where('slug', '==', slug),
    where('activo', '==', true),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

// ── OBTENER UN PRODUCTO POR ID ─────────────────────────────
export async function obtenerProductoPorId(id) {
  const ref = doc(db, COLECCION, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ── PRODUCTOS RELACIONADOS (misma categoría) ───────────────
export async function obtenerRelacionados(categorias = [], excludeId, limite = 6) {
  if (!categorias.length) return []
  const q = query(
    collection(db, COLECCION),
    where('activo', '==', true),
    where('categorias', 'array-contains', categorias[0]),
    limit(limite + 1)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.id !== excludeId)
    .slice(0, limite)
}

// ── ADMIN: CREAR PRODUCTO ──────────────────────────────────
export async function crearProducto(data) {
  const ref = await addDoc(collection(db, COLECCION), {
    ...data,
    activo: true,
    fecha_creacion: serverTimestamp(),
    actualizado_en: serverTimestamp(),
  })
  return ref.id
}

// ── ADMIN: ACTUALIZAR PRODUCTO ─────────────────────────────
export async function actualizarProducto(id, data) {
  const ref = doc(db, COLECCION, id)
  await updateDoc(ref, { ...data, actualizado_en: serverTimestamp() })
}

// ── ADMIN: ELIMINAR PRODUCTO (soft delete) ─────────────────
export async function eliminarProducto(id) {
  const ref = doc(db, COLECCION, id)
  await updateDoc(ref, { activo: false, actualizado_en: serverTimestamp() })
}

// ── CONFIGURACIÓN DE ENVÍOS ──────────────────────────────────
export async function obtenerConfiguracionEnvio() {
  try {
    const docRef = doc(db, 'myp_config', 'shipping')
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return snap.data()
    }
  } catch (e) {
    console.warn('⚠️ Error al consultar configuración de envío en Firestore, usando defaults:', e)
  }
  // Límites por defecto en Soles
  return {
    arequipaFreeLimit: 30,
    nationalFreeLimit: 100,
    arequipaFee: 10,
    nationalFee: 15
  }
}

// ── CREACIÓN DE PEDIDO TRANSACCIONAL (Control de stock seguro)
export async function crearPedidoConTransaccion(datosPedido) {
  const pedidoRef = doc(collection(db, 'myp_pedidos')) // Genera un ID automático
  
  await runTransaction(db, async (transaction) => {
    // 1. Validar y restar stock para cada item
    for (const item of datosPedido.items) {
      // Intentar buscar el producto principal por su SKU (que es la clave del documento)
      // Si el item no tiene sku, usamos su ID/SKU de fallback
      const productSku = item.sku || item.id
      const prodRef = doc(db, COLECCION, String(productSku))
      const prodSnap = await transaction.get(prodRef)
      
      if (!prodSnap.exists()) {
        throw new Error(`El producto con SKU ${productSku} no existe en el catálogo.`)
      }
      
      const prodData = prodSnap.data()
      
      // Si el producto maneja variaciones, debemos verificar stock en la variación
      if (item.variante && item.variante !== 'default') {
        const variantesActualizadas = (prodData.variantes || []).map((v) => {
          // Buscamos la variación que coincida
          const keyMatch = Object.entries(v.atributos).map(([k, val]) => `${k.toUpperCase()}: ${val}`).join(', ')
          // Comparamos de forma flexible el formato de atributos
          if (keyMatch === item.variante || v.sku === item.sku || String(v.id) === String(item.variante)) {
            if (v.stock < item.cantidad) {
              throw new Error(`El producto "${item.nombre} (${item.variante})" no tiene stock suficiente. Disponible: ${v.stock}, Solicitado: ${item.cantidad}`)
            }
            return { ...v, stock: v.stock - item.cantidad }
          }
          return v
        })
        
        // Sumamos el stock restante de todas las variantes para actualizar el total general
        const nuevoStockGeneral = variantesActualizadas.reduce((sum, v) => sum + v.stock, 0)
        
        transaction.update(prodRef, {
          variantes: variantesActualizadas,
          stock: nuevoStockGeneral,
          actualizado_en: serverTimestamp()
        })
      } else {
        // Producto simple
        if (prodData.stock < item.cantidad) {
          throw new Error(`El producto "${item.nombre}" no tiene stock suficiente. Disponible: ${prodData.stock}, Solicitado: ${item.cantidad}`)
        }
        
        transaction.update(prodRef, {
          stock: prodData.stock - item.cantidad,
          actualizado_en: serverTimestamp()
        })
      }
    }
    
    // 2. Guardar la orden de pedido en la colección myp_pedidos
    transaction.set(pedidoRef, {
      ...datosPedido,
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp()
    })
  })
  
  return pedidoRef.id
}
