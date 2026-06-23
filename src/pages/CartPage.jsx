import { useState } from 'react'
import useCartStore from '../store/cartStore'

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export default function CartPage() {
  const { items, subtotal, total, couponCode, couponDiscount, applyCoupon, removeCoupon, updateQuantity, removeItem } = useCartStore()
  
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState(null)
  const [isApplying, setIsApplying] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setIsApplying(true)
    const result = await applyCoupon(couponInput)
    setCouponMsg(result)
    if (result.success) setCouponInput('')
    setIsApplying(false)
    setTimeout(() => setCouponMsg(null), 3000)
  }

  return (
    <>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="font-ui font-bold text-3xl text-gray-800 mb-8">Tu Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl p-8 max-w-xl mx-auto">
            <span className="text-7xl block mb-6 animate-bounce">🛒</span>
            <h2 className="font-ui font-bold text-xl text-gray-700 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 font-body text-sm mb-8">
              Aún no has agregado productos a tu carrito. ¡Explora nuestra tienda y regálale algo especial a tu engreído!
            </p>
            <a
              href="/tienda"
              className="inline-block bg-coral text-white font-ui font-semibold px-8 py-3.5 rounded-full hover:bg-coral-dark shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Ir a la Tienda
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LISTA DE PRODUCTOS */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
                {items.map((item) => (
                  <div key={item._key} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Imagen */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🐾</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <a href={`/producto/${item.slug}`} className="font-ui font-bold text-sm sm:text-base text-gray-800 hover:text-coral transition-colors line-clamp-2">
                        {item.nombre}
                      </a>
                      {item.variante !== 'default' && (
                        <p className="text-xs text-coral font-ui font-semibold mt-1 bg-coral/5 px-2.5 py-0.5 rounded-md w-fit">
                          {item.variante}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 font-body mt-1">EAN: {item.ean || 'N/A'}</p>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start mt-2 sm:mt-0">
                      <div className="flex items-center border border-gray-200 rounded-full bg-white h-9 px-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.variante, item.cantidad - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-coral font-bold transition-colors rounded-full"
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-ui font-semibold text-gray-700">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.variante, item.cantidad + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-coral font-bold transition-colors rounded-full"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal Item */}
                      <div className="text-right sm:min-w-[100px]">
                        <p className="font-ui font-bold text-sm sm:text-base text-gray-800">
                          S/ {((item.precio_unitario * item.cantidad) / 100).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-body">c/u S/ {(item.precio_unitario / 100).toFixed(2)}</p>
                      </div>

                      {/* Quitar */}
                      <button
                        onClick={() => removeItem(item.id, item.variante)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Quitar producto"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RESUMEN DE COMPRA */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <h2 className="font-ui font-bold text-lg text-gray-800">Resumen de la orden</h2>

              {/* Sección de Cupón */}
              <div className="space-y-2">
                <span className="text-xs font-ui font-semibold text-gray-500 block">¿Tienes un cupón de descuento?</span>
                {couponCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-150 rounded-2xl px-4 py-2.5">
                    <div className="min-w-0">
                      <span className="text-xs font-ui font-bold text-green-700 block">Cupón: {couponCode}</span>
                      <span className="text-[10px] font-body text-green-600 block">Ahorraste {couponDiscount}%</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-500 hover:text-red-600 font-ui font-semibold"
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
                      placeholder="Ej: BIENVENIDO10"
                      className="flex-1 h-10 px-4 rounded-full border border-gray-200 text-xs font-body text-gray-700 focus:outline-none focus:border-coral"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplying || !couponInput.trim()}
                      className="px-5 h-10 rounded-full bg-gray-900 text-white text-xs font-ui font-semibold hover:bg-coral transition-colors disabled:opacity-50"
                    >
                      {isApplying ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {couponMsg && (
                  <p className={`text-[10px] font-body mt-1 pl-2 ${couponMsg.success ? 'text-green-600' : 'text-red-500'}`}>
                    {couponMsg.success ? '¡Cupón aplicado con éxito!' : couponMsg.message}
                  </p>
                )}
              </div>

              {/* Totales */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-body text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-ui font-semibold text-gray-800">S/ {(subtotal / 100).toFixed(2)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm font-body text-green-600">
                    <span>Descuento ({couponDiscount}%)</span>
                    <span className="font-ui font-semibold">− S/ {((subtotal * couponDiscount) / 10000).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-body text-gray-400">
                  <span>Envío</span>
                  <span>Se calcula en el checkout</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="font-ui font-bold text-gray-800">Total estimado</span>
                  <span className="font-ui font-bold text-2xl text-coral">S/ {(total / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-2">
                <a
                  href="/checkout"
                  className="block w-full py-4 bg-coral text-white text-center font-ui font-bold text-sm rounded-full hover:bg-coral-dark shadow-lg shadow-coral/10 hover:shadow-coral/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  PROCEDER AL PAGO →
                </a>
                <a
                  href="/tienda"
                  className="block w-full py-3 border border-gray-200 text-gray-600 text-center font-ui font-semibold text-xs rounded-full hover:bg-gray-50 transition-colors"
                >
                  Seguir Comprando
                </a>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}
