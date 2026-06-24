import {
  collection, doc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc,
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
  return snap.docs.map(d => {
    const data = d.data()
    return { ...data, id: d.id, wpId: data.id }
  })
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
  try {
    const ref = await addDoc(collection(db, COLECCION), {
      ...data,
      activo: data.activo ?? true,
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
  try {
    const ref = doc(db, COLECCION, id)
    await updateDoc(ref, { ...data, actualizado_en: serverTimestamp() })
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
    // Agrupar items por documento único de producto para evitar lecturas duplicadas
    // y evitar sobrescrituras de stock entre variaciones del mismo producto.
    const itemsPorProducto = {}
    for (const item of datosPedido.items) {
      const productId = String(item.id)
      if (!itemsPorProducto[productId]) {
        itemsPorProducto[productId] = []
      }
      itemsPorProducto[productId].push(item)
    }

    // 1. Ejecutar todas las lecturas primero (una sola lectura por documento de producto)
    const productDocs = {}
    for (const productId of Object.keys(itemsPorProducto)) {
      const prodRef = doc(db, COLECCION, productId)
      const prodSnap = await transaction.get(prodRef)
      
      if (!prodSnap.exists()) {
        throw new Error(`El producto con SKU ${productId} no existe en el catálogo.`)
      }
      
      productDocs[productId] = {
        ref: prodRef,
        data: prodSnap.data()
      }
    }

    // 2. Procesar las validaciones y actualizar los datos en memoria
    for (const [productId, items] of Object.entries(itemsPorProducto)) {
      const prodDoc = productDocs[productId]
      let currentData = prodDoc.data

      for (const item of items) {
        if (item.variante && item.variante !== 'default') {
          // Es una variación del producto
          const variantesActualizadas = (currentData.variantes || []).map((v) => {
            const keyMatch = Object.entries(v.atributos).map(([k, val]) => `${k.toUpperCase()}: ${val}`).join(', ')
            if (keyMatch === item.variante || v.sku === item.sku || String(v.id) === String(item.variante)) {
              if (v.stock < item.cantidad) {
                throw new Error(`El producto "${item.nombre} (${item.variante})" no tiene stock suficiente. Disponible: ${v.stock}, Solicitado: ${item.cantidad}`)
              }
              return { ...v, stock: v.stock - item.cantidad }
            }
            return v
          })
          
          const nuevoStockGeneral = variantesActualizadas.reduce((sum, v) => sum + v.stock, 0)
          
          currentData = {
            ...currentData,
            variantes: variantesActualizadas,
            stock: nuevoStockGeneral
          }
        } else {
          // Producto simple
          if (currentData.stock < item.cantidad) {
            throw new Error(`El producto "${item.nombre}" no tiene stock suficiente. Disponible: ${currentData.stock}, Solicitado: ${item.cantidad}`)
          }
          
          currentData = {
            ...currentData,
            stock: currentData.stock - item.cantidad
          }
        }
      }

      // Guardar la data modificada en el mapa en memoria
      prodDoc.data = currentData
    }

    // 3. Ejecutar todas las escrituras después de todas las lecturas
    for (const [productId, prodDoc] of Object.entries(productDocs)) {
      transaction.update(prodDoc.ref, {
        variantes: prodDoc.data.variantes || null,
        stock: prodDoc.data.stock,
        actualizado_en: serverTimestamp()
      })
    }

    // 4. Registrar la orden de pedido en la colección myp_pedidos
    transaction.set(pedidoRef, {
      ...datosPedido,
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp()
    })
  })
  
  return pedidoRef.id
}

// ── OBTENER PEDIDOS (ADMIN) ──────────────────────────────────
export async function obtenerPedidosAdmin(filtros = {}) {
  try {
    let q = query(
      collection(db, 'myp_pedidos'),
      orderBy('creado_en', 'desc')
    )
    
    if (filtros.estado && filtros.estado !== 'todos') {
      q = query(q, where('estado', '==', filtros.estado))
    }
    
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error al obtener pedidos en admin:', e)
    throw e;
  }
}

// ── ACTUALIZAR ESTADO DE PEDIDO ──────────────────────────────
export async function actualizarEstadoPedido(pedidoId, nuevoEstado, datosExtra = {}, modificadoPor = 'admin') {
  try {
    const pedidoRef = doc(db, 'myp_pedidos', pedidoId)
    const snap = await getDoc(pedidoRef)
    if (!snap.exists()) {
      throw new Error(`El pedido ${pedidoId} no existe.`)
    }
    
    const pedidoActual = snap.data()
    const estadoAnterior = pedidoActual.estado
    
    // Si ya está en el estado solicitado, no hacer nada
    if (estadoAnterior === nuevoEstado) return;

    const actualizaciones = {
      estado: nuevoEstado,
      actualizado_en: serverTimestamp(),
      historial_estados: [
        ...(pedidoActual.historial_estados || []),
        {
          estado: nuevoEstado,
          fecha: new Date(),
          modificado_por: modificadoPor
        }
      ]
    }

    // Lógica específica para confirmación de pago
    if (nuevoEstado === 'preparando' && estadoAnterior === 'recibido') {
      actualizaciones['pago.estado'] = 'confirmado'
      actualizaciones['pago.confirmado_en'] = new Date()
    }

    // Datos de Courier y seguimiento en estado enviado
    if (nuevoEstado === 'enviado' && datosExtra.courier) {
      actualizaciones['envio.courier'] = datosExtra.courier
      actualizaciones['envio.tracking_code'] = datosExtra.tracking_code || ''
      actualizaciones['envio.tracking_link'] = datosExtra.tracking_link || ''
    }

    // 1. Ejecutar actualización del estado del pedido
    await updateDoc(pedidoRef, actualizaciones)

    // 2. Si se cancela, reestablecer el stock de los productos
    if (nuevoEstado === 'cancelado' && estadoAnterior !== 'cancelado') {
      await reestablecerStockPedidoConTransaccion(pedidoActual.items)
    }
  } catch (e) {
    console.error('Error al actualizar estado del pedido:', e)
    throw e;
  }
}

// ── REESTABLECER STOCK TRANSACCIONAL POR CANCELACIÓN ──────────
export async function reestablecerStockPedidoConTransaccion(items) {
  await runTransaction(db, async (transaction) => {
    const itemsPorProducto = {}
    for (const item of items) {
      const productId = String(item.id)
      if (!itemsPorProducto[productId]) {
        itemsPorProducto[productId] = []
      }
      itemsPorProducto[productId].push(item)
    }

    const productDocs = {}
    for (const productId of Object.keys(itemsPorProducto)) {
      const prodRef = doc(db, 'myp_productos', productId)
      const prodSnap = await transaction.get(prodRef)
      if (prodSnap.exists()) {
        productDocs[productId] = {
          ref: prodRef,
          data: prodSnap.data()
        }
      }
    }

    for (const [productId, prodItems] of Object.entries(itemsPorProducto)) {
      const prodDoc = productDocs[productId]
      if (!prodDoc) continue // Si el producto fue eliminado del catálogo, omitimos

      let currentData = prodDoc.data

      for (const item of prodItems) {
        if (item.variante && item.variante !== 'default') {
          const variantesActualizadas = (currentData.variantes || []).map((v) => {
            const keyMatch = Object.entries(v.atributos).map(([k, val]) => `${k.toUpperCase()}: ${val}`).join(', ')
            if (keyMatch === item.variante || v.sku === item.sku || String(v.id) === String(item.variante)) {
              return { ...v, stock: v.stock + item.cantidad }
            }
            return v
          })
          
          const nuevoStockGeneral = variantesActualizadas.reduce((sum, v) => sum + v.stock, 0)
          
          currentData = {
            ...currentData,
            variantes: variantesActualizadas,
            stock: nuevoStockGeneral
          }
        } else {
          currentData = {
            ...currentData,
            stock: currentData.stock + item.cantidad
          }
        }
      }
      prodDoc.data = currentData
    }

    for (const [productId, prodDoc] of Object.entries(productDocs)) {
      transaction.update(prodDoc.ref, {
        variantes: prodDoc.data.variantes || null,
        stock: prodDoc.data.stock,
        actualizado_en: serverTimestamp()
      })
    }
  })
}

// ── CAJA DIARIA: OBTENER CAJA ACTIVA (ABIERTA) ────────────────
export async function obtenerCajaActiva() {
  try {
    const q = query(
      collection(db, 'myp_caja_diaria'),
      where('estado', '==', 'abierta'),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() }
  } catch (e) {
    console.error('Error al obtener caja activa:', e)
    throw e
  }
}

// ── CAJA DIARIA: ABRIR CAJA ──────────────────────────────────
export async function abrirCajaDiaria(montoAperturaCents, adminEmail) {
  try {
    // Generamos un ID basado en la fecha YYYY-MM-DD en la zona horaria del cliente
    const ahora = new Date()
    const offset = ahora.getTimezoneOffset()
    const fechaLocal = new Date(ahora.getTime() - (offset * 60 * 1000))
    const cajaId = fechaLocal.toISOString().split('T')[0] // 'YYYY-MM-DD'
    
    const cajaRef = doc(db, 'myp_caja_diaria', cajaId)
    const snap = await getDoc(cajaRef)
    
    // Si ya existe una caja para este día y está abierta, la devolvemos
    if (snap.exists() && snap.data().estado === 'abierta') {
      return { id: snap.id, ...snap.data() }
    }

    const nuevaCaja = {
      fecha_apertura: serverTimestamp(),
      monto_apertura: montoAperturaCents,
      estado: 'abierta',
      abierta_por: adminEmail,
      transacciones_manuales: [],
      fecha_cierre: null,
      monto_cierre: null,
      cerrada_por: null
    }

    await runTransaction(db, async (transaction) => {
      // Verificar si hay alguna caja abierta en todo el sistema
      const q = query(collection(db, 'myp_caja_diaria'), where('estado', '==', 'abierta'))
      const snapAbiertas = await getDocs(q)
      if (!snapAbiertas.empty && snapAbiertas.docs[0].id !== cajaId) {
        throw new Error(`Ya existe una caja abierta en el sistema (${snapAbiertas.docs[0].id}). Debes cerrarla primero antes de abrir una nueva.`)
      }
      
      transaction.set(cajaRef, nuevaCaja)
    })

    return { id: cajaId, ...nuevaCaja }
  } catch (e) {
    console.error('Error al abrir la caja diaria:', e)
    throw e
  }
}

// ── CAJA DIARIA: REGISTRAR TRANSACCIÓN MANUAL (INGRESO/EGRESO) ─
export async function registrarTransaccionManual(cajaId, transaccion) {
  try {
    const cajaRef = doc(db, 'myp_caja_diaria', cajaId)
    const snap = await getDoc(cajaRef)
    if (!snap.exists()) {
      throw new Error(`La caja ${cajaId} no existe.`)
    }

    const data = snap.data()
    if (data.estado !== 'abierta') {
      throw new Error(`La caja ${cajaId} está cerrada. No se pueden registrar transacciones.`)
    }

    const nuevaTransaccion = {
      ...transaccion,
      fecha: new Date() // Registrar fecha local actual
    }

    await updateDoc(cajaRef, {
      transacciones_manuales: [
        ...(data.transacciones_manuales || []),
        nuevaTransaccion
      ]
    })

    return nuevaTransaccion
  } catch (e) {
    console.error('Error al registrar transacción manual:', e)
    throw e
  }
}

// ── CAJA DIARIA: CERRAR CAJA ─────────────────────────────────
export async function cerrarCajaDiaria(cajaId, montoCierreCents, adminEmail) {
  try {
    const cajaRef = doc(db, 'myp_caja_diaria', cajaId)
    const snap = await getDoc(cajaRef)
    if (!snap.exists()) {
      throw new Error(`La caja ${cajaId} no existe.`)
    }

    const data = snap.data()
    if (data.estado !== 'abierta') {
      throw new Error('La caja ya se encuentra cerrada.')
    }

    await updateDoc(cajaRef, {
      estado: 'cerrada',
      monto_cierre: montoCierreCents,
      cerrada_por: adminEmail,
      fecha_cierre: serverTimestamp()
    })
  } catch (e) {
    console.error('Error al cerrar la caja diaria:', e)
    throw e
  }
}

// ── CAJA DIARIA: HISTORIAL DE CAJAS ──────────────────────────
export async function obtenerHistorialCajas(limite = 30) {
  try {
    const q = query(
      collection(db, 'myp_caja_diaria'),
      orderBy('fecha_apertura', 'desc'),
      limit(limite)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error al obtener historial de cajas:', e)
    throw e
  }
}

// ── CAJA DIARIA: VENTAS CONFIRMADAS DE UN DÍA ───────────────
export async function obtenerVentasConfirmadasDia(fechaIdStr) {
  try {
    // Convertir 'YYYY-MM-DD' a rangos de fechas UTC/Local
    // Para simplificar, buscamos los pedidos cuya fecha de creación o confirmación caiga en ese día
    const partes = fechaIdStr.split('-')
    const anio = parseInt(partes[0])
    const mes = parseInt(partes[1]) - 1
    const dia = parseInt(partes[2])
    
    const inicio = new Date(anio, mes, dia, 0, 0, 0, 0)
    const fin = new Date(anio, mes, dia, 23, 59, 59, 999)

    // Buscaremos todos los pedidos confirmados del día
    // Consideramos pago.confirmado_en o creado_en dentro de este rango
    const q = query(
      collection(db, 'myp_pedidos'),
      where('creado_en', '>=', inicio),
      where('creado_en', '<=', fin)
    )
    
    const snap = await getDocs(q)
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Filtrar en memoria por estado de pago == confirmado para asegurar exactitud
    return pedidos.filter(p => p.pago?.estado === 'confirmado')
  } catch (e) {
    console.error('Error al obtener ventas confirmadas del día:', e)
    throw e
  }
}

// ── ADMIN: ACTUALIZAR STOCK Y VARIANTES DE PRODUCTO ──────────
export async function actualizarStockProductoAdmin(productId, stock, variantes = null) {
  try {
    const ref = doc(db, 'myp_productos', String(productId))
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

// ── ADMIN: OBTENER TODOS LOS PRODUCTOS ───────────────────────
export async function obtenerTodosProductosAdmin() {
  try {
    // Obtenemos todos los productos (incluso si tienen stock 0 o inactivos si quisiéramos auditarlos)
    const q = query(collection(db, 'myp_productos'), where('activo', '==', true))
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
  try {
    const cleanCodigo = codigo.toUpperCase().trim()
    const ref = doc(db, 'myp_cupones', cleanCodigo)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      throw new Error(`El cupón con código "${cleanCodigo}" ya existe en el sistema.`)
    }

    const nuevoCupon = {
      descuento: parseInt(descuentoPorcentaje),
      compra_minima: Math.round(parseFloat(compraMinimaSoles) * 100), // guardar en centavos
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

// ── ADMIN: GUARDAR CONFIGURACIÓN DE ENVÍO ────────────────────
export async function guardarConfiguracionEnvio(config) {
  try {
    const ref = doc(db, 'myp_config', 'shipping')
    await setDoc(ref, {
      arequipaFreeLimit: parseFloat(config.arequipaFreeLimit),
      nationalFreeLimit: parseFloat(config.nationalFreeLimit),
      arequipaFee: parseFloat(config.arequipaFee),
      nationalFee: parseFloat(config.nationalFee),
      actualizado_en: serverTimestamp()
    }, { merge: true })
  } catch (e) {
    console.error('Error al guardar configuración de envío:', e)
    throw e
  }
}

// ── ADMIN: ASIGNAR REPARTIDOR A PEDIDO ─────────────────────────
export async function asignarRepartidorPedido(pedidoId, repartidorData) {
  try {
    const pedidoRef = doc(db, 'myp_pedidos', pedidoId)
    await updateDoc(pedidoRef, {
      'envio.repartidor': {
        nombre: repartidorData.nombre || '',
        celular: repartidorData.celular || '',
        compania: repartidorData.compania || '',
        asignado_en: new Date()
      },
      actualizado_en: serverTimestamp()
    })
  } catch (e) {
    console.error('Error al asignar repartidor al pedido:', e)
    throw e
  }
}



// ============================================================
// ADMIN: KPIs DE VENTAS (para Dashboard de Ventas)
// ============================================================

/**
 * Obtiene pedidos de los últimos N días para calcular KPIs.
 * @param {number} dias - Rango de días hacia atrás (default 30).
 * @returns {Array} Pedidos dentro del rango.
 */
export async function obtenerPedidosRango(dias = 30) {
  try {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    const q = query(
      collection(db, 'myp_pedidos'),
      where('creado_en', '>=', desde),
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
    console.error('Error al obtener pedidos por rango:', e)
    throw e
  }
}

/**
 * Obtiene los productos más vendidos basado en los items de todos los pedidos confirmados.
 * @param {number} limite - Número máximo de resultados.
 * @returns {Array} Productos ordenados por cantidad vendida.
 */
export async function obtenerProductosMasVendidos(limite = 4) {
  try {
    // Traer pedidos confirmados (no cancelados)
    const q = query(
      collection(db, 'myp_pedidos'),
      where('estado', '!=', 'cancelado'),
      limit(100) // acotar para no leer toda la colección
    )
    const snap = await getDocs(q)
    
    // Agregar ventas por producto
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

// ============================================================
// ADMIN: RESEÑAS (myp_reviews)
// ============================================================

/**
 * Obtiene todas las reseñas. Filtrables por estado.
 * @param {'pendiente'|'aprobada'|'rechazada'|null} estado
 */
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

/**
 * Cambia el estado de una reseña (aprobada/rechazada/pendiente).
 */
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

/**
 * Elimina una reseña permanentemente.
 */
export async function eliminarResena(resenaId) {
  try {
    await deleteDoc(doc(db, 'myp_reviews', resenaId))
  } catch (e) {
    console.error('Error al eliminar reseña:', e)
    throw e
  }
}

/**
 * Crea una nueva reseña desde la página de producto (cliente autenticado o invitado).
 */
export async function crearResena({ productoId, productoNombre, autorNombre, calificacion, comentario, userId = null }) {
  try {
    await addDoc(collection(db, 'myp_reviews'), {
      producto_id: productoId,
      producto_nombre: productoNombre,
      autor_nombre: autorNombre,
      calificacion,
      comentario,
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

/**
 * Obtiene las reseñas aprobadas de un producto (para mostrar en tienda).
 */
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
        creado_en: data.creado_en?.toDate ? data.creado_en.toDate() : new Date(),
      }
    })
  } catch (e) {
    console.error('Error al obtener reseñas del producto:', e)
    return []
  }
}

