import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy,
  getDocs, limit as firestoreLimit, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfileSchema } from '../schemas'

const COLECCION = 'myp_user_profiles'

// ── INITIALIZE USER PROFILE (MIGRATE FROM CLUB) ──────────────
export async function initializeUserProfile(uid, email) {
  try {
    const ref = doc(db, COLECCION, uid)
    
    // 1. Intentar buscar si hay miembros en el club con este correo
    const q = query(collection(db, 'myp_club_miembros'), where('email', '==', email.trim().toLowerCase()))
    const snap = await getDocs(q)
    
    let nombre = 'Socio'
    let apellido = 'Missy & Po'
    let telefono = ''
    let documento_tipo = 'DNI'
    let documento_number = ''
    let direcciones = []
    let mascotas = []
    
    if (!snap.empty) {
      // Tomar datos del primer miembro encontrado para el tutor
      const firstMember = snap.docs[0].data()
      if (firstMember.nombre_tutor) {
        const parts = firstMember.nombre_tutor.split(' ')
        nombre = parts[0] || 'Socio'
        apellido = parts.slice(1).join(' ') || 'Missy & Po'
      }
      telefono = firstMember.celular || ''
      documento_tipo = firstMember.documento_tipo || 'DNI'
      documento_number = firstMember.documento_numero || ''
      
      if (firstMember.direccion) {
        direcciones.push({
          alias: 'Dirección Club',
          departamento: firstMember.departamento || 'Arequipa',
          distrito: firstMember.distrito || '',
          direccion: firstMember.direccion,
          referencia: '',
          es_default: true
        })
      }
      
      // Añadir todas las mascotas registradas bajo este mismo correo
      snap.docs.forEach(docSnap => {
        const memberData = docSnap.data()
        if (memberData.nombre_mascota) {
          mascotas.push({
            nombre: memberData.nombre_mascota.trim(),
            especie: 'perro',
            raza: memberData.mascota_raza || '',
            fecha_nacimiento: '',
            foto_url: ''
          })
        }
      })
    }
    
    const initialProfile = {
      uid,
      email,
      nombre,
      apellido,
      telefono,
      documento_tipo,
      documento_numero: documento_number,
      direcciones,
      mascotas,
      preferencias: {
        notificaciones_email: true,
        notificaciones_whatsapp: false,
        idioma: 'es'
      }
    }
    
    const validation = UserProfileSchema.safeParse(initialProfile)
    if (!validation.success) {
      console.warn('Fallo de validación de perfil inicial:', validation.error)
    }
    
    await setDoc(ref, {
      ...(validation.success ? validation.data : initialProfile),
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp()
    })
    
    return { id: uid, ...(validation.success ? validation.data : initialProfile) }
  } catch (e) {
    console.error('Error al inicializar user profile:', e)
    throw e
  }
}

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
