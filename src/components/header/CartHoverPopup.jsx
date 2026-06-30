import { useRef, useEffect } from 'react';

import useCartStore from '../../store/cartStore';

// ============================================================
// CART HOVER POPUP — Aparece al hover sobre el carrito en Navbar
// Especificación: MISSY-PO-CONTEXT.md §4
// ============================================================

export default function CartHoverPopup({ onClose }) {
  const popupRef = useRef(null);
  const { items, total, itemCount } = useCartStore();

  // Cerrar al mover el ratón fuera
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-popup
                 border border-gray-100 z-popup overflow-hidden
                 animate-[fade-in-down_0.15s_ease-out]"
      id="cart-hover-popup"
      onMouseLeave={onClose}
    >
      {/* CABECERA */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-ui text-gray-400 text-center">
          Tu carrito de compras
        </p>
      </div>

      {/* ITEMS */}
      <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
        {items.length === 0 ? (
          <div className="py-6 text-center">
            <span className="text-3xl block mb-2">🛒</span>
            <p className="text-sm font-body text-gray-400">Tu carrito está vacío</p>
          </div>
        ) : (
          items.slice(0, 4).map((item) => (
            <div key={item._key} className="flex items-center gap-3 px-4 py-2.5">
              {/* Miniatura */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {item.imagen
                  ? <img src={item.imagen} alt={item.nombre}
                      className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center">🐾</span>
                }
              </div>

              {/* Nombre + cantidad + precio */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-ui font-semibold text-gray-800 line-clamp-1">
                  {item.nombre}
                </p>
                <p className="text-[10px] text-gray-500 font-body mt-0.5">
                  {item.cantidad} × S/ {(item.precio_unitario / 100).toFixed(2)}
                </p>
              </div>

              {/* Subtotal ítem */}
              <span className="text-xs font-bold text-gray-700 flex-shrink-0">
                S/ {((item.precio_unitario * item.cantidad) / 100).toFixed(2)}
              </span>
            </div>
          ))
        )}

        {/* Más ítems */}
        {items.length > 4 && (
          <p className="text-center text-[10px] text-gray-400 font-body py-2">
            +{items.length - 4} producto{items.length - 4 !== 1 ? 's' : ''} más
          </p>
        )}
      </div>

      {/* SUBTOTAL */}
      {items.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-ui font-semibold text-gray-700">Subtotal</span>
          <span className="text-sm font-bold text-coral">
            S/ {(total / 100).toFixed(2)}
          </span>
        </div>
      )}

      {/* BOTONES */}
      <div className="p-3 space-y-2">
        <a
          href="/carrito"
          onClick={onClose}
          className="block w-full py-2.5 rounded-full text-center font-ui font-semibold text-sm
                     bg-coral text-white hover:bg-coral-dark transition-colors"
          id="cart-popup-view"
        >
          Ver carrito
        </a>
        <a
          href="/checkout"
          onClick={onClose}
          className="block w-full py-2.5 rounded-full text-center font-ui font-semibold text-sm
                     bg-gray-800 text-white hover:bg-gray-900 transition-colors"
          id="cart-popup-checkout"
        >
          Finalizar compra
        </a>
      </div>
    </div>
  );
}
