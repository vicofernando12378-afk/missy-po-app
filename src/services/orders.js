import {
  collection, doc, getDocs, getDoc, updateDoc, query, where, orderBy, limit, serverTimestamp, runTransaction
} from 'firebase/firestore'
import { db } from './firebase'

// ── CREACIÓN DE PEDIDO TRANSACCIONAL (Control de stock seguro)
export async function crearPedidoConTransaccion(datosPedido) {
  const pedidoRef = doc(collection(db, 'myp_pedidos')) // Genera un ID automático
  
  await runTransaction(db, async (transaction) => {
    // Agrupar items por documento único de producto para evitar lecturas duplicadas
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
      const prodRef = doc(db, 'myp_productos', productId)
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
    // Unificación de campo: solo guardamos "estado", eliminando el duplicado redundante "estado_pedido"
    const finalPedido = { ...datosPedido }
    delete finalPedido.estado_pedido

    transaction.set(pedidoRef, {
      ...finalPedido,
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
    throw e
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
    if (estadoAnterior === nuevoEstado) return

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
    throw e
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

// ── ADMIN: KPIs DE VENTAS (para Dashboard de Ventas) ──────────
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
