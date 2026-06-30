import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { ReviewSchema } from '../schemas'

// ── ADMIN: OBTENER RESEÑAS ──────────────────────────────────
export async function obtenerResenas(estado = null) {
  try {
    let q = query(collection(db, 'myp_reviews'), orderBy('creado_en', 'desc'))
    if (estado) {
      q = query(collection(db, 'myp_reviews'), where('estado', '==', estado), orderBy('creado_en', 'desc'))
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(data.creado_en),
      }
    })
  } catch (e) {
    console.error('Error al obtener reseñas:', e)
    throw e
  }
}

// ── ADMIN: ACTUALIZAR ESTADO DE RESEÑA ───────────────────────
export async function actualizarEstadoResena(resenaId, nuevoEstado) {
  try {
    await updateDoc(doc(db, 'myp_reviews', resenaId), {
      estado: nuevoEstado,
      actualizado_en: serverTimestamp(),
    })
  } catch (e) {
    console.error('Error al actualizar estado de reseña:', e)
    throw e
  }
}

// ── ADMIN: ELIMINAR RESEÑA PERMANENTEMENTE ───────────────────
export async function eliminarResena(resenaId) {
  try {
    await deleteDoc(doc(db, 'myp_reviews', resenaId))
  } catch (e) {
    console.error('Error al eliminar reseña:', e)
    throw e
  }
}

// ── CLIENTE/PÚBLICO: CREAR RESEÑA ─────────────────────────────
export async function crearResena({ productoId, productoNombre, autorNombre, calificacion, comentario, userId = null }) {
  const validation = ReviewSchema.safeParse({
    productoId,
    productoNombre,
    autorNombre,
    calificacion,
    comentario
  })
  if (!validation.success) {
    throw new Error(`Reseña inválida: ${validation.error.issues.map(i => i.message).join(', ')}`)
  }
  const cleanData = validation.data

  try {
    await addDoc(collection(db, 'myp_reviews'), {
      producto_id: cleanData.productoId,
      producto_nombre: cleanData.productoNombre,
      autor_nombre: cleanData.autorNombre,
      calificacion: cleanData.calificacion,
      comentario: cleanData.comentario,
      userId,
      estado: 'pendiente', // requiere aprobación del admin
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp(),
    })
  } catch (e) {
    console.error('Error al crear reseña:', e)
    throw e
  }
}

// ── CLIENTE/PÚBLICO: OBTENER RESEÑAS POR PRODUCTO ─────────────
export async function obtenerResenasPorProducto(productoId) {
  try {
    const q = query(
      collection(db, 'myp_reviews'),
      where('producto_id', '==', productoId),
      where('estado', '==', 'aprobada'),
      orderBy('creado_en', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(data.creado_en),
      }
    })
  } catch (e) {
    console.error('Error al obtener reseñas por producto:', e)
    throw e
  }
}
