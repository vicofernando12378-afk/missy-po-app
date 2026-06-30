import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, limit, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { ProductSchema } from '../schemas'

const COLECCION = 'myp_productos'

// Generador de slug sencillo (por si no viene definido en el payload)
function generarSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

// ── BÚSQUEDA POR TEXTO (array-contains en tags_busqueda) ───
export async function buscarProductos(termino, limite = 10) {
  const q = query(
    collection(db, COLECCION),
    where('activo', '==', true),
    where('tags_busqueda', 'array-contains', termino.toLowerCase().trim()),
    limit(limite)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return { ...data, id: d.id, wpId: data.id }
  })
}

// ── OBTENER PRODUCTOS PAGINADOS/FILTRADOS ──────────────────
export async function obtenerProductos({
  categoria = null,
  soloOfertas = false,
  orden = 'fecha_creacion',
  paginaSize = 12,
  cursor = null,
} = {}) {
  let q = query(
    collection(db, COLECCION),
    where('activo', '==', true)
  )

  if (categoria) {
    q = query(q, where('categorias', 'array-contains', categoria))
  }

  const snap = await getDocs(q)
  let productos = snap.docs.map(d => {
    const data = d.data()
    return { ...data, id: d.id, wpId: data.id }
  })

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
  const data = d.data()
  return { ...data, id: d.id, wpId: data.id }
}

// ── OBTENER UN PRODUCTO POR ID ─────────────────────────────
export async function obtenerProductoPorId(id) {
  const ref = doc(db, COLECCION, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return { ...data, id: snap.id, wpId: data.id }
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
    .map(d => {
      const data = d.data()
      return { ...data, id: d.id, wpId: data.id }
    })
    .filter(p => p.id !== excludeId)
    .slice(0, limite)
}

// ── ADMIN: CREAR PRODUCTO ──────────────────────────────────
export async function crearProducto(data) {
  const validation = ProductSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(`Datos de producto inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
  }
  const cleanData = validation.data

  try {
    const ref = await addDoc(collection(db, COLECCION), {
      ...cleanData,
      activo: cleanData.activo ?? true,
      fecha_creacion: serverTimestamp(),
      actualizado_en: serverTimestamp(),
    })
    return ref.id
  } catch (e) {
    console.error('Error al crear producto:', e)
    throw e
  }
}

// ── ADMIN: ACTUALIZAR PRODUCTO ─────────────────────────────
export async function actualizarProducto(id, data) {
  const validation = ProductSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(`Datos de producto inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
  }
  const cleanData = validation.data

  try {
    const ref = doc(db, COLECCION, id)
    await updateDoc(ref, { ...cleanData, actualizado_en: serverTimestamp() })
  } catch (e) {
    console.error('Error al actualizar producto:', e)
    throw e
  }
}

// ── ADMIN: ELIMINAR PRODUCTO (soft delete) ─────────────────
export async function eliminarProducto(id) {
  try {
    const ref = doc(db, COLECCION, id)
    await updateDoc(ref, { activo: false, actualizado_en: serverTimestamp() })
  } catch (e) {
    console.error('Error al eliminar producto:', e)
    throw e
  }
}

// ── ADMIN: OBTENER TODOS LOS PRODUCTOS ───────────────────────
export async function obtenerTodosProductosAdmin() {
  try {
    const q = query(collection(db, COLECCION), where('activo', '==', true))
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return { ...data, id: d.id, wpId: data.id }
    })
  } catch (e) {
    console.error('Error al obtener productos para admin:', e)
    throw e
  }
}

// ── ADMIN: ACTUALIZAR STOCK Y VARIANTES DE PRODUCTO ──────────
export async function actualizarStockProductoAdmin(productId, stock, variantes = null) {
  try {
    const ref = doc(db, COLECCION, String(productId))
    const updates = {
      stock: Number(stock),
      actualizado_en: serverTimestamp()
    }
    if (variantes !== null) {
      updates.variantes = variantes.map(v => ({
        ...v,
        stock: Number(v.stock)
      }))
    }
    await updateDoc(ref, updates)
  } catch (e) {
    console.error('Error al actualizar stock de producto:', e)
    throw e
  }
}

// ── ADMIN: PRODUCTOS MÁS VENDIDOS ───────────────────────────
export async function obtenerProductosMasVendidos(limite = 4) {
  try {
    const q = query(
      collection(db, 'myp_pedidos'),
      where('estado', '!=', 'cancelado'),
      limit(100)
    )
    const snap = await getDocs(q)
    const conteo = {}
    snap.docs.forEach(d => {
      const items = d.data().items || []
      items.forEach(item => {
        const key = item.sku || item.id
        if (!conteo[key]) {
          conteo[key] = {
            sku: item.sku,
            nombre: item.nombre,
            imagen: item.imagen,
            slug: item.slug || null,
            cantidad: 0,
          }
        }
        conteo[key].cantidad += item.cantidad || 1
      })
    })

    return Object.values(conteo)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limite)
  } catch (e) {
    console.error('Error al obtener productos más vendidos:', e)
    return []
  }
}
