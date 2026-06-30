import { useState, useEffect } from 'react'
import useCartStore from '../../store/cartStore'
import { obtenerProductosMasVendidos } from '../../services'
import useCatalogStore from '../../store/catalogStore'


// ============================================================
// CART DRAWER — Panel lateral izquierdo (flujo primario mobile)
// Especificación: MISSY-PO-CONTEXT.md §5
// ============================================================

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

// ─── ÍTEM DEL CARRITO ──────────────────────────────────────
function CartDrawerItem({ item }) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {/* Miniatura */}
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
        {item.imagen
          ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
        }
      </div>

      {/* Info + controles */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-ui font-semibold text-gray-800 leading-snug line-clamp-2 mb-1">
          {item.nombre}
        </p>
        {item.variante !== 'default' && (
          <p className="text-[10px] text-gray-400 font-body mb-1">{item.variante}</p>
        )}

        {/* Controles de cantidad */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
            <button
              onClick={() => updateQuantity(item.id, item.variante, item.cantidad - 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500
                         hover:bg-gray-100 transition-colors font-bold text-sm"
              aria-label="Reducir cantidad"
              id={`cart-qty-minus-${item.id}`}
            >
              −
            </button>
            <span className="w-7 text-center text-xs font-ui font-semibold text-gray-800">
              {item.cantidad}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.variante, item.cantidad + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500
                         hover:bg-gray-100 transition-colors font-bold text-sm"
              aria-label="Aumentar cantidad"
              id={`cart-qty-plus-${item.id}`}
            >
              +
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id, item.variante)}
            className="text-gray-400 hover:text-red-500 transition-colors ml-1"
            aria-label="Eliminar producto"
            id={`cart-remove-${item.id}`}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Precio */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-coral">
          S/ {((item.precio_unitario * item.cantidad) / 100).toFixed(2)}
        </p>
        {item.cantidad > 1 && (
          <p className="text-[10px] text-gray-400 font-body">
            c/u S/ {(item.precio_unitario / 100).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  )
}



// ─── COMPONENTE PRINCIPAL ──────────────────────────────────
export default function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, subtotal, total, couponCode,
          couponDiscount, applyCoupon, removeCoupon } = useCartStore()

  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState(null)
  const [isApplying, setIsApplying] = useState(false)

  const [bestSellers, setBestSellers] = useState([])
  const { productos, fetchCatalog } = useCatalogStore()

  useEffect(() => {
    async function loadBestSellers() {
      let catalog = productos
      if (catalog.length === 0) {
        catalog = await fetchCatalog()
      }

      try {
        const mostSold = await obtenerProductosMasVendidos(5)
        let list = mostSold
          .map(item => {
            const prodCompleto = catalog.find(p => p.sku === item.sku || p.id === item.id || p.slug === item.slug)
            if (prodCompleto && prodCompleto.activo) {
              return prodCompleto
            }
            return null
          })
          .filter(Boolean)

        if (list.length < 3) {
          const ofertas = catalog.filter(p => p.activo && p.precio_oferta && p.stock > 0 && !list.some(item => item.id === p.id))
          const comunes = catalog.filter(p => p.activo && !p.precio_oferta && p.stock > 0 && !list.some(item => item.id === p.id))
          const fallbacks = [...ofertas, ...comunes]
          
          while (list.length < 3 && fallbacks.length > 0) {
            list.push(fallbacks.shift())
          }
        }

        setBestSellers(list.slice(0, 4))
      } catch (err) {
        console.error('Error cargando best sellers:', err)
        const fallbackList = catalog.filter(p => p.activo && p.stock > 0).slice(0, 3)
        setBestSellers(fallbackList)
      }
    }

    if (isDrawerOpen) {
      loadBestSellers()
    }
  }, [isDrawerOpen, productos, fetchCatalog])

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setIsApplying(true)
    const result = await applyCoupon(couponInput)
    setCouponMsg(result)
    if (result.success) setCouponInput('')
    setIsApplying(false)
    setTimeout(() => setCouponMsg(null), 3000)
  }

  if (!isDrawerOpen) return null

  return (
    <>
      {/* OVERLAY */}
      <div
        className="drawer-overlay"
        onClick={closeDrawer}
        id="cart-drawer-overlay"
        aria-hidden="true"
      />

      {/* PANEL */}
      <div
        className="fixed left-0 top-0 h-full w-[340px] max-w-[90vw] bg-white z-drawer
                   flex flex-col shadow-drawer animate-[slide-in-left_0.3s_ease-out]"
        id="cart-drawer"
        role="dialog"
        aria-label="Carrito de compras"
        aria-modal="true"
      >
        {/* ── CABECERA ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="font-ui font-bold text-base text-gray-800 uppercase tracking-wider">
            🛒 Tu Carrito
          </h2>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center
                       text-gray-500 transition-colors"
            id="cart-drawer-close"
            aria-label="Cerrar carrito"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── CUPÓN ────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-gray-100">
          {couponCode ? (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
              <span className="text-xs font-ui font-semibold text-green-700">
                🎉 Cupón <strong>{couponCode}</strong> aplicado ({couponDiscount}% off)
              </span>
              <button
                onClick={removeCoupon}
                className="text-xs text-red-500 hover:text-red-600 font-ui font-semibold"
                id="cart-remove-coupon"
              >
                Quitar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Código de cupón"
                className="flex-1 h-9 px-3 rounded-full border border-gray-200 text-xs
                           font-body text-gray-700 placeholder:text-gray-400
                           focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20"
                id="cart-coupon-input"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={isApplying || !couponInput.trim()}
                className="px-4 h-9 rounded-full bg-coral text-white text-xs font-ui font-semibold
                           hover:bg-coral-dark disabled:opacity-50 transition-colors"
                id="cart-coupon-apply"
              >
                {isApplying ? '...' : 'Aplicar'}
              </button>
            </div>
          )}

          {couponMsg && !couponMsg.success && (
            <p className="text-[11px] text-red-500 font-body mt-1 pl-1">{couponMsg.message}</p>
          )}
        </div>

        {/* ── LISTA DE ÍTEMS ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <span className="text-5xl mb-4">🛒</span>
              <p className="font-ui font-semibold text-gray-600 mb-1">Tu carrito está vacío</p>
              <p className="text-sm font-body text-gray-400 mb-6">
                ¡Agrega productos para comenzar!
              </p>
              <a
                href="/tienda"
                onClick={closeDrawer}
                className="btn-coral text-sm px-6 py-2"
                id="cart-drawer-go-shop"
              >
                Ir a la Tienda
              </a>
            </div>
          ) : (
            items.map((item) => <CartDrawerItem key={item._key} item={item} />)
          )}
        </div>

        {/* ── PIE — TOTALES + CHECKOUT ─────────────────────── */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-4 space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-body text-gray-600">Subtotal</span>
              <span className="font-ui font-semibold text-gray-800">
                S/ {(subtotal / 100).toFixed(2)}
              </span>
            </div>

            {/* Descuento cupón */}
            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-body text-green-600">Descuento ({couponDiscount}%)</span>
                <span className="font-ui font-semibold text-green-600">
                  − S/ {((subtotal * couponDiscount) / 10000).toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-ui font-bold text-gray-800">Total</span>
              <span className="font-ui font-bold text-xl text-coral">
                S/ {(total / 100).toFixed(2)}
              </span>
            </div>

            {/* Botón checkout */}
            <a
              href="/checkout"
              onClick={closeDrawer}
              className="block w-full py-3.5 rounded-full text-center font-ui font-bold text-sm
                         bg-coral text-white hover:bg-coral-dark shadow-coral
                         transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              id="cart-drawer-checkout"
            >
              FINALIZAR COMPRA →
            </a>

            <a
              href="/carrito"
              onClick={closeDrawer}
              className="block w-full py-2.5 rounded-full text-center font-ui font-semibold text-sm
                         border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              id="cart-drawer-view-cart"
            >
              Ver carrito completo
            </a>
          </div>
        )}

        {/* ── BEST SELLING PRODUCTS ─────────────────────────── */}
        {bestSellers.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <p className="text-[10px] font-ui font-bold text-gray-400 uppercase tracking-widest mb-2">
              Más Vendidos
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {bestSellers.map((p) => (
                <a
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  onClick={closeDrawer}
                  className="flex-shrink-0 w-20 text-center"
                  id={`cart-bestseller-${p.id}`}
                >
                  <div className="w-20 h-20 rounded-xl bg-white border border-gray-100 mb-1 overflow-hidden flex items-center justify-center">
                    {p.imagenes?.[0] ? (
                      <img src={p.imagenes[0]} alt={p.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🐾</span>
                    )}
                  </div>
                  <p className="text-[10px] font-ui font-semibold text-gray-700 line-clamp-2 leading-tight mb-0.5">
                    {p.nombre}
                  </p>
                  {p.precio_oferta ? (
                    <>
                      <p className="text-[10px] text-gray-400 line-through font-body">S/ {parseFloat(p.precio_regular).toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-green-600 font-body">S/ {parseFloat(p.precio_oferta).toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="text-[10px] font-bold text-gray-700 font-body">S/ {parseFloat(p.precio_regular).toFixed(2)}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
