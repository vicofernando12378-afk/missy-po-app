import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  arrayUnion,
} from 'firebase/firestore';

import { db } from './firebase';

const COLECCION = 'myp_reclamaciones';

// ── ADMIN: LISTADO PAGINADO / FILTRADO ──────────────────────
export async function obtenerReclamaciones({ estado = null, desdeId = null, limite = 20 } = {}) {
  try {
    const base = collection(db, COLECCION);
    let q = query(base, orderBy('creado_en', 'desc'), limit(limite));

    if (estado) {
      q = query(collection(db, COLECCION), where('estado', '==', estado), orderBy('creado_en', 'desc'), limit(limite));
    }

    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(data.creado_en),
      };
    });
  } catch (e) {
    console.error('Error al obtener reclamaciones:', e);
    throw e;
  }
}

// ── ADMIN: DETALLE ───────────────────────────────────────────
export async function obtenerReclamacionPorId(id) {
  try {
    const ref = doc(db, COLECCION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(data.creado_en),
    };
  } catch (e) {
    console.error('Error al obtener reclamacion:', e);
    throw e;
  }
}

// ── ADMIN: ACTUALIZAR ESTADO ─────────────────────────────────
export async function actualizarEstadoReclamacion(id, estado, nota = null) {
  try {
    const ref = doc(db, COLECCION, id);
    const payload = {
      estado,
      historial_estados: arrayUnion({
        estado,
        fecha: new Date().toISOString(),
        nota: nota || null,
      }),
      actualizado_en: serverTimestamp(),
    };
    if (nota) payload.nota_respuesta = nota;

    await updateDoc(ref, payload);
  } catch (e) {
    console.error('Error al actualizar reclamacion:', e);
    throw e;
  }
}

// ── ADMIN: RESOLVER RECLAMACION CON AUDITORIA ────────────────
export async function resolverReclamacion(id, { estado, resolution }) {
  try {
    const ref = doc(db, COLECCION, id);
    await updateDoc(ref, {
      estado,
      resolution: {
        ...resolution,
        resolvedAt: serverTimestamp(),
      },
      historial_estados: arrayUnion({
        estado,
        fecha: new Date().toISOString(),
        nota: resolution?.nota || null,
      }),
      actualizado_en: serverTimestamp(),
    });
  } catch (e) {
    console.error('Error al resolver reclamacion con auditoría:', e);
    throw e;
  }
}

// ── ADMIN: CERRAR RECLAMACION (confirmación o cierre directo) ─
export async function cerrarReclamacion(id, { motivo = 'confirmacion', nota = null, prueba_conformidad = null } = {}) {
  try {
    const ref = doc(db, COLECCION, id);
    const payload = {
      estado: 'cerrado',
      resolution: {
        confirmadoPorCliente: motivo === 'confirmacion',
        cerradoEn: serverTimestamp(),
        motivoCierre: motivo,
      },
      historial_estados: arrayUnion({
        estado: 'cerrado',
        fecha: new Date().toISOString(),
        nota: nota || (motivo === 'confirmacion' ? 'Confirmado por cliente' : 'Cerrado sin confirmación'),
      }),
      actualizado_en: serverTimestamp(),
    };
    if (prueba_conformidad) {
      payload.prueba_conformidad = prueba_conformidad;
    }
    await updateDoc(ref, payload);
  } catch (e) {
    console.error('Error al cerrar reclamacion:', e);
    throw e;
  }
}

// ── ADMIN: REABRIR RECLAMACION CERRADA ────────────────────────
export async function reabrirReclamacion(id, nota = null) {
  try {
    const ref = doc(db, COLECCION, id);
    await updateDoc(ref, {
      estado: 'en_revision',
      reabiertoEn: serverTimestamp(),
      reabiertoPor: 'admin',
      historial_estados: arrayUnion({
        estado: 'en_revision',
        fecha: new Date().toISOString(),
        nota: nota || 'Caso reabierto por administrador',
      }),
      actualizado_en: serverTimestamp(),
    });
  } catch (e) {
    console.error('Error al reabrir reclamacion:', e);
    throw e;
  }
}
