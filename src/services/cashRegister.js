import {
  collection, doc, getDocs, getDoc, updateDoc, query, where, orderBy, limit, serverTimestamp, runTransaction,
} from 'firebase/firestore';

import { MovimientoSchema } from '../schemas';

import { db } from './firebase';

// ── CAJA DIARIA: OBTENER CAJA ACTIVA (ABIERTA) ────────────────
export async function obtenerCajaActiva() {
  try {
    const q = query(
      collection(db, 'myp_caja_diaria'),
      where('estado', '==', 'abierta'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (e) {
    console.error('Error al obtener caja activa:', e);
    throw e;
  }
}

// ── CAJA DIARIA: ABRIR CAJA ──────────────────────────────────
export async function abrirCajaDiaria(montoAperturaCents, adminEmail) {
  try {
    // Generamos un ID basado en la fecha YYYY-MM-DD en la zona horaria del cliente
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    const fechaLocal = new Date(ahora.getTime() - (offset * 60 * 1000));
    const cajaId = fechaLocal.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    const cajaRef = doc(db, 'myp_caja_diaria', cajaId);
    const snap = await getDoc(cajaRef);
    
    // Si ya existe una caja para este día y está abierta, la devolvemos
    if (snap.exists() && snap.data().estado === 'abierta') {
      return { id: snap.id, ...snap.data() };
    }

    const nuevaCaja = {
      fecha_apertura: serverTimestamp(),
      monto_apertura: montoAperturaCents,
      estado: 'abierta',
      abierta_por: adminEmail,
      transacciones_manuales: [],
      fecha_cierre: null,
      monto_cierre: null,
      cerrada_por: null,
    };

    await runTransaction(db, async (transaction) => {
      // Verificar si hay alguna caja abierta en todo el sistema
      const q = query(collection(db, 'myp_caja_diaria'), where('estado', '==', 'abierta'));
      const snapAbiertas = await getDocs(q);
      if (!snapAbiertas.empty && snapAbiertas.docs[0].id !== cajaId) {
        throw new Error(`Ya existe una caja abierta en el sistema (${snapAbiertas.docs[0].id}). Debes cerrarla primero antes de abrir una nueva.`);
      }
      
      transaction.set(cajaRef, nuevaCaja);
    });

    return { id: cajaId, ...nuevaCaja };
  } catch (e) {
    console.error('Error al abrir la caja diaria:', e);
    throw e;
  }
}

// ── CAJA DIARIA: REGISTRAR TRANSACCIÓN MANUAL (INGRESO/EGRESO) ─
export async function registrarTransaccionManual(cajaId, transaccion) {
  const validation = MovimientoSchema.safeParse({
    ...transaccion,
    monto: transaccion.monto / 100, // validamos en soles
  });
  if (!validation.success) {
    throw new Error(`Transacción inválida: ${validation.error.issues.map(i => i.message).join(', ')}`);
  }
  const cleanTransaccion = {
    ...validation.data,
    monto: transaccion.monto, // mantener en centavos para Firestore
  };

  try {
    const cajaRef = doc(db, 'myp_caja_diaria', cajaId);
    const snap = await getDoc(cajaRef);
    if (!snap.exists()) {
      throw new Error(`La caja ${cajaId} no existe.`);
    }

    const data = snap.data();
    if (data.estado !== 'abierta') {
      throw new Error(`La caja ${cajaId} está cerrada. No se pueden registrar transacciones.`);
    }

    const nuevaTransaccion = {
      ...cleanTransaccion,
      fecha: new Date(), // Registrar fecha local actual
    };

    await updateDoc(cajaRef, {
      transacciones_manuales: [
        ...(data.transacciones_manuales || []),
        nuevaTransaccion,
      ],
    });

    return nuevaTransaccion;
  } catch (e) {
    console.error('Error al registrar transacción manual:', e);
    throw e;
  }
}

// ── CAJA DIARIA: CERRAR CAJA ─────────────────────────────────
export async function cerrarCajaDiaria(cajaId, montoCierreCents, adminEmail) {
  try {
    const cajaRef = doc(db, 'myp_caja_diaria', cajaId);
    const snap = await getDoc(cajaRef);
    if (!snap.exists()) {
      throw new Error(`La caja ${cajaId} no existe.`);
    }

    const data = snap.data();
    if (data.estado !== 'abierta') {
      throw new Error('La caja ya se encuentra cerrada.');
    }

    await updateDoc(cajaRef, {
      estado: 'cerrada',
      monto_cierre: montoCierreCents,
      cerrada_por: adminEmail,
      fecha_cierre: serverTimestamp(),
    });
  } catch (e) {
    console.error('Error al cerrar la caja diaria:', e);
    throw e;
  }
}

// ── CAJA DIARIA: HISTORIAL DE CAJAS ──────────────────────────
export async function obtenerHistorialCajas(limite = 30) {
  try {
    const q = query(
      collection(db, 'myp_caja_diaria'),
      orderBy('fecha_apertura', 'desc'),
      limit(limite),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error al obtener historial de cajas:', e);
    throw e;
  }
}

// ── CAJA DIARIA: VENTAS CONFIRMADAS DE UN DÍA ───────────────
export async function obtenerVentasConfirmadasDia(fechaIdStr) {
  try {
    const partes = fechaIdStr.split('-');
    const anio = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1;
    const dia = parseInt(partes[2]);
    
    const inicio = new Date(anio, mes, dia, 0, 0, 0, 0);
    const fin = new Date(anio, mes, dia, 23, 59, 59, 999);

    const q = query(
      collection(db, 'myp_pedidos'),
      where('creado_en', '>=', inicio),
      where('creado_en', '<=', fin),
    );
    
    const snap = await getDocs(q);
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    return pedidos.filter(p => p.pago?.estado === 'confirmado');
  } catch (e) {
    console.error('Error al obtener ventas confirmadas del día:', e);
    throw e;
  }
}
