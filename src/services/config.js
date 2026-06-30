import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';

import { ShippingConfigSchema } from '../schemas';

import { db } from './firebase';

// ── CONFIGURACIÓN DE ENVÍOS ──────────────────────────────────
export async function obtenerConfiguracionEnvio() {
  try {
    const docRef = doc(db, 'myp_config', 'shipping');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('⚠️ Error al consultar configuración de envío en Firestore, usando defaults:', e);
  }
  // Límites por defecto en Soles
  return {
    arequipaFreeLimit: 30,
    nationalFreeLimit: 100,
    arequipaFee: 10,
    nationalFee: 15,
  };
}

// ── ADMIN: GUARDAR CONFIGURACIÓN DE ENVÍO ────────────────────
export async function guardarConfiguracionEnvio(config) {
  const validation = ShippingConfigSchema.safeParse(config);
  if (!validation.success) {
    throw new Error(`Configuración de envíos inválida: ${validation.error.issues.map(i => i.message).join(', ')}`);
  }
  const cleanData = validation.data;

  try {
    const ref = doc(db, 'myp_config', 'shipping');
    await setDoc(ref, {
      arequipaFreeLimit: cleanData.arequipaFreeLimit,
      nationalFreeLimit: cleanData.nationalFreeLimit,
      arequipaFee: cleanData.arequipaFee,
      nationalFee: cleanData.nationalFee,
      actualizado_en: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error al guardar configuración de envío:', e);
    throw e;
  }
}

// ── MAPEO DE CATEGORÍAS DESDE FIRESTORE (Fase 2.4 fallback) ───
export async function obtenerCategorySlugMap() {
  try {
    const snap = await getDoc(doc(db, 'myp_config', 'categories'));
    return snap.exists() ? snap.data().slugMap : {};
  } catch (e) {
    console.warn('⚠️ Error al obtener category map de Firestore:', e);
    return {};
  }
}
