import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../services/firebase'
import OrderTimeline from '../../../components/account/OrderTimeline'

const STATUS_MAP = {
  recibido: { label: 'Recibido', color: '#3b82f6', icon: '📥' },
  preparando: { label: 'Preparando', color: '#f59e0b', icon: '📦' },
  enviado: { label: 'En camino', color: '#8b5cf6', icon: '🚚' },
  entregado: { label: 'Entregado', color: '#10b981', icon: '✅' },
  cancelado: { label: 'Cancelado', color: '#ef4444', icon: '❌' }
}

export default function OrderDetailPage({ forceOrderId, authUser, profile }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authUser) return

    const fetchOrder = async () => {
      const orderId = forceOrderId || new URLSearchParams(window.location.search).get('id')

      if (!orderId) {
        setError('ID de pedido no válido')
        setLoading(false)
        return
      }

      try {
        const orderRef = doc(db, 'myp_pedidos', orderId)
        const orderSnap = await getDoc(orderRef)

        if (!orderSnap.exists()) {
          setError('Pedido no encontrado')
          setLoading(false)
          return
        }

        const orderData = { id: orderSnap.id, ...orderSnap.data() }

        if (orderData.userId && orderData.userId !== authUser.uid) {
          setError('No tienes acceso a este pedido')
          setLoading(false)
          return
        }

        setOrder(orderData)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Error al cargar el pedido')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [authUser, forceOrderId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--color-coral)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-5xl mb-4 block">⚠️</span>
        <h3 className="font-ui font-bold text-lg mb-2" style={{ color: 'var(--color-text-dark)' }}>
          {error}
        </h3>
        <a href="/mi-cuenta#pedidos" className="text-sm font-ui font-bold mt-4 inline-block" style={{ color: 'var(--color-coral)' }}>
          ← Volver a Mis Pedidos
        </a>
      </div>
    )
  }

  if (!order) return null

  const status = STATUS_MAP[order.estado] || STATUS_MAP.recibido
  const fecha = order.creado_en?.toDate
    ? order.creado_en.toDate().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div>
      {/* Back link */}
      <a href="/mi-cuenta#pedidos" className="inline-flex items-center gap-1 text-sm font-ui font-bold mb-6 hover:translate-x-[-2px] transition-transform"
         style={{ color: 'var(--color-coral)' }}>
        ← Mis Pedidos
      </a>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-hero text-2xl mb-1" style={{ color: 'var(--color-text-dark)' }}>
            Pedido #{order.id?.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
            {fecha}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-ui font-bold"
              style={{ color: status.color, backgroundColor: `${status.color}15` }}>
          {status.icon} {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          {order.historial_estados && order.historial_estados.length > 0 && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-ui font-bold text-sm mb-4" style={{ color: 'var(--color-text-dark)' }}>
                Seguimiento del Pedido
              </h2>
              <OrderTimeline history={order.historial_estados} currentStatus={order.estado} />
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="font-ui font-bold text-sm mb-4" style={{ color: 'var(--color-text-dark)' }}>
              Productos ({order.items?.length || 0})
            </h2>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  {item.imagen && (
                    <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-cover rounded-xl border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-ui font-bold text-sm truncate" style={{ color: 'var(--color-text-dark)' }}>
                      {item.nombre}
                    </h3>
                    <p className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-gray)' }}>
                      Cant: {item.cantidad} • Unit: S/ {((item.precio_unitario || item.precio || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-ui font-semibold text-sm" style={{ color: 'var(--color-text-dark)' }}>
                    S/ {(((item.precio_unitario || item.precio || 0) * item.cantidad) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
              Resumen de Pago
            </h2>
            <div className="space-y-2 text-sm pt-2">
              <div className="flex justify-between">
                <span className="font-body" style={{ color: 'var(--color-text-gray)' }}>Subtotal</span>
                <span className="font-ui font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                  S/ {((order.total_items || order.comprobante?.subtotal || order.subtotal || 0) / 100).toFixed(2)}
                </span>
              </div>
              {order.descuento_cupon_monto > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="font-body">Cupón ({order.cupon_codigo})</span>
                  <span>-S/ {(order.descuento_cupon_monto / 100).toFixed(2)}</span>
                </div>
              )}
              {order.envio && (
                <div className="flex justify-between">
                  <span className="font-body" style={{ color: 'var(--color-text-gray)' }}>Envío</span>
                  <span className="font-ui font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                    S/ {(order.envio.costo_envio / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {order.descuento_puntos_monto > 0 && (
                <div className="flex justify-between">
                  <span className="font-body" style={{ color: 'var(--color-text-gray)' }}>Descuento puntos</span>
                  <span className="font-ui font-semibold text-emerald-600">
                    -S/ {(order.descuento_puntos_monto / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <span className="font-ui font-bold" style={{ color: 'var(--color-text-dark)' }}>Total</span>
                <span className="font-ui font-bold text-lg" style={{ color: 'var(--color-coral)' }}>
                  S/ {((order.total_final || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Envío */}
          {order.envio && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
                Dirección de Envío
              </h2>
              <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
                {order.cliente?.nombre} {order.cliente?.apellido}
              </p>
              <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
                {order.envio.direccion}
              </p>
              {order.envio.referencia && (
                <p className="text-xs font-body mt-1" style={{ color: 'var(--color-text-light)' }}>
                  Ref: {order.envio.referencia}
                </p>
              )}
              {order.envio.tracking_link && (
                <a href={order.envio.tracking_link} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-1 text-sm font-ui font-bold mt-3" style={{ color: '#8b5cf6' }}>
                  🚚 Rastrear envío
                </a>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="space-y-3">
            {order.estado === 'enviado' && order.envio?.tracking_link && (
              <a href={order.envio.tracking_link} target="_blank" rel="noopener noreferrer"
                 className="block w-full text-center py-3 rounded-xl text-sm font-ui font-bold text-white transition-all hover:opacity-90"
                 style={{ backgroundColor: '#8b5cf6' }}>
                🚚 Rastrear mi Pedido
              </a>
            )}
            <a href="/tienda"
               className="block w-full text-center py-3 rounded-xl text-sm font-ui font-bold transition-all hover:opacity-90"
               style={{ color: 'var(--color-coral)', backgroundColor: '#fff5f5' }}>
              🛒 Comprar de Nuevo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
