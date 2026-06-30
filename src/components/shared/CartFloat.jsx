import useCartStore from '../../store/cartStore';

const CartIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
  </svg>
);

export default function CartFloat() {
  const { itemCount, total, openDrawer } = useCartStore();
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.cantidad, 0));
  const totalVal = useCartStore(s => s.items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0));

  return (
    <button
      onClick={openDrawer}
      className="float-btn left-5 bottom-6 group"
      style={{ backgroundColor: 'var(--color-coral)' }}
      id="cart-float-btn"
      aria-label={`Abrir carrito — ${count} producto${count !== 1 ? 's' : ''}`}
    >
      <CartIcon />

      {/* Badge de cantidad */}
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1
                     rounded-full bg-yellow-400 text-gray-900 text-[11px] font-bold
                     flex items-center justify-center shadow-sm
                     animate-[scale-in_0.2s_ease-out]"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}

      {/* Tooltip con total */}
      <span className="absolute left-16 bg-gray-800 text-white text-xs font-ui
                       px-3 py-1.5 rounded-full whitespace-nowrap opacity-0
                       group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none">
        {count > 0 ? `S/. ${(totalVal / 100).toFixed(2)} · Ver carrito` : 'Carrito vacío'}
      </span>
    </button>
  );
}

