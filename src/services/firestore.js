import {
  collection, doc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter,
  serverTimestamp,
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

// ── OBTENER CATÁLOGO PAGINADO ───────────────────────────────
export async function obtenerProductos({
  categoria = null,
  soloOfertas = false,
  orden = 'creado_en',
  paginaSize = 12,
  cursor = null,
} = {}) {
  let q = query(
    collection(db, COLECCION),
    where('activo', '==', true),
    orderBy(orden, 'desc'),
    limit(paginaSize)
  )

  if (categoria) {
    q = query(q, where('categorias', 'array-contains', categoria))
  }

  if (soloOfertas) {
    q = query(q, where('precio_oferta', '!=', null))
  }

  if (cursor) {
    q = query(q, startAfter(cursor))
  }

  const snap = await getDocs(q)
  const productos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const lastDoc = snap.docs[snap.docs.length - 1] || null

  return { productos, lastDoc, hasMore: snap.docs.length === paginaSize }
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
    creado_en: serverTimestamp(),
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
