import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy,
  getDocs, limit as firestoreLimit, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfileSchema } from '../schemas'

const COLECCION = 'myp_user_profiles'

// ── OBTENER PROFILE POR UID ─────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const ref = doc(db, COLECCION, uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  } catch (e) {
    console.error('Error al obtener user profile:', e)
    throw e
  }
}

// ── CREAR O ACTUALIZAR PROFILE (upsert) ─────────────────────
export async function upsertUserProfile(uid, data) {
  try {
    const ref = doc(db, COLECCION, uid)
    const snap = await getDoc(ref)

    const payload = {
      ...data,
      uid,
      actualizado_en: serverTimestamp()
    }

    if (snap.exists()) {
      await updateDoc(ref, payload)
      return { id: uid, ...snap.data(), ...payload }
    } else {
      const validation = UserProfileSchema.safeParse({ uid, ...data })
      if (!validation.success) {
        throw new Error(`Datos inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
      }
      await setDoc(ref, {
        ...validation.data,
        creado_en: serverTimestamp(),
        actualizado_en: serverTimestamp()
      })
      return { id: uid, ...validation.data }
    }
  } catch (e) {
    console.error('Error al upsert user profile:', e)
    throw e
  }
}

// ── ACTUALIZAR CAMPOS ESPECÍFICOS ───────────────────────────
export async function updateUserProfile(uid, updates) {
  try {
    const ref = doc(db, COLECCION, uid)
    await updateDoc(ref, { ...updates, actualizado_en: serverTimestamp() })
  } catch (e) {
    console.error('Error al actualizar user profile:', e)
    throw e
  }
}

// ── AGREGAR DIRECCIÓN ───────────────────────────────────────
export async function addAddress(uid, address) {
  const profile = await getUserProfile(uid)
  if (!profile) throw new Error('Perfil no encontrado')

  const direcciones = profile.direcciones || []
  if (direcciones.length >= 5) throw new Error('Máximo 5 direcciones permitidas')

  if (address.es_default) {
    direcciones.forEach(d => { d.es_default = false })
  }

  direcciones.push(address)
  await updateUserProfile(uid, { direcciones })
  return direcciones
}

// ── ELIMINAR DIRECCIÓN ──────────────────────────────────────
export async function removeAddress(uid, index) {
  const profile = await getUserProfile(uid)
  if (!profile) throw new Error('Perfil no encontrado')

  const direcciones = [...(profile.direcciones || [])]
  direcciones.splice(index, 1)
  await updateUserProfile(uid, { direcciones })
  return direcciones
}

// ── AGREGAR MASCOTA ─────────────────────────────────────────
export async function addPet(uid, pet) {
  const profile = await getUserProfile(uid)
  if (!profile) throw new Error('Perfil no encontrado')

  const mascotas = profile.mascotas || []
  if (mascotas.length >= 5) throw new Error('Máximo 5 mascotas permitidas')

  mascotas.push(pet)
  await updateUserProfile(uid, { mascotas })
  return mascotas
}

// ── ELIMINAR MASCOTA ────────────────────────────────────────
export async function removePet(uid, index) {
  const profile = await getUserProfile(uid)
  if (!profile) throw new Error('Perfil no encontrado')

  const mascotas = [...(profile.mascotas || [])]
  mascotas.splice(index, 1)
  await updateUserProfile(uid, { mascotas })
  return mascotas
}

// ── OBTENER PEDIDOS POR USUARIO ─────────────────────────────
export async function getOrdersByUser(uid, { limite = 20 } = {}) {
  try {
    const q = query(
      collection(db, 'myp_pedidos'),
      where('userId', '==', uid),
      orderBy('creado_en', 'desc'),
      firestoreLimit(limite)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(data.creado_en)
      }
    })
  } catch (e) {
    console.error('Error al obtener pedidos por usuario:', e)
    throw e
  }
}
