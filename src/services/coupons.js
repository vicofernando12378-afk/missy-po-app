import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { CouponSchema } from '../schemas'

// ── ADMIN: GESTIÓN DE CUPONES ─────────────────────────────────
export async function obtenerCupones() {
  try {
    const snap = await getDocs(collection(db, 'myp_cupones'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error al obtener cupones:', e)
    throw e
  }
}

export async function crearCupon(codigo, descuentoPorcentaje, compraMinimaSoles = 0) {
  const validation = CouponSchema.safeParse({
    codigo,
    descuento: descuentoPorcentaje,
    compraMinima: compraMinimaSoles
  })
  if (!validation.success) {
    throw new Error(`Datos de cupón inválidos: ${validation.error.issues.map(i => i.message).join(', ')}`)
  }
  const cleanData = validation.data

  try {
    const cleanCodigo = cleanData.codigo
    const ref = doc(db, 'myp_cupones', cleanCodigo)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      throw new Error(`El cupón con código "${cleanCodigo}" ya existe en el sistema.`)
    }

    const nuevoCupon = {
      descuento: cleanData.descuento,
      compra_minima: Math.round(cleanData.compraMinima * 100), // guardar en centavos
      activo: true,
      creado_en: serverTimestamp()
    }

    await setDoc(ref, nuevoCupon) // se usa setDoc para usar el código de cupón como el ID del documento
    return { id: cleanCodigo, ...nuevoCupon }
  } catch (e) {
    console.error('Error al crear cupón:', e)
    throw e
  }
}

export async function actualizarEstadoCupon(cuponId, activo) {
  try {
    const ref = doc(db, 'myp_cupones', cuponId)
    await updateDoc(ref, { activo })
  } catch (e) {
    console.error('Error al cambiar estado del cupón:', e)
    throw e
  }
}

export async function eliminarCupon(cuponId) {
  try {
    await deleteDoc(doc(db, 'myp_cupones', cuponId))
  } catch (e) {
    console.error('Error al eliminar cupón:', e)
    throw e
  }
}

// ── COMÚN: VALIDAR CUPÓN CON FALLBACK ─────────────────────────
export async function validarCupon(code, montoCompraSoles = 0) {
  const uppercaseCode = code.toUpperCase().trim()
  try {
    const docRef = doc(db, 'myp_cupones', uppercaseCode)
    const snap = await getDoc(docRef)
    
    if (snap.exists()) {
      const data = snap.data()
      if (data.activo === false) {
        return { success: false, message: 'Este cupón está inactivo' }
      }
      if (data.expiracion && new Date(data.expiracion) < new Date()) {
        return { success: false, message: 'Este cupón ha expirado' }
      }
      
      const compraMinimaCentavos = data.compra_minima || 0
      const montoCompraCentavos = Math.round(montoCompraSoles * 100)
      if (montoCompraCentavos < compraMinimaCentavos) {
        const minSoles = (compraMinimaCentavos / 100).toFixed(2)
        return { success: false, message: `La compra mínima para este cupón es S/ ${minSoles}` }
      }

      const discount = data.descuento || 0
      return { success: true, discount }
    }
  } catch (e) {
    console.warn('⚠️ Error al consultar cupón en Firestore. Usando fallback local:', e)
  }

  // Fallback local
  const mockCoupons = {
    'BIENVENIDO10': 10,
    'MISSY15': 15,
    'MASCOTA20': 20,
  }
  const discount = mockCoupons[uppercaseCode]
  if (discount) {
    return { success: true, discount }
  }
  return { success: false, message: 'Cupón no válido' }
}
