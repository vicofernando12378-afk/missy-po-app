// Texto desplazable horizontal — equivalente al plugin "horizontal-scrolling-announcements"
// Contiene info de courier, métodos de pago y promociones

const MARQUEE_ITEMS = [
  '🐾 Envíos a todo el Perú con Courier Shalom',
  '📦 Olva Express — Delivery express en Lima',
  '💳 Aceptamos: Yape · Plin · Mercado Pago · Tarjetas de crédito',
  '🎁 ¡Compras desde S/. 50 obtienen envío preferencial!',
  '✨ Nuevos productos todas las semanas',
  '📞 Atención al cliente: WhatsApp +51 999 999 999',
  '🐕 Ropa, accesorios y juguetes para tus mascotas',
  '💝 Contra reembolso disponible en todo el Perú',
]

export default function MarqueeBanner() {
  // Duplicamos el array para el efecto de loop infinito sin saltos
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div
      className="overflow-hidden py-2.5 border-b border-amber-200"
      style={{ backgroundColor: '#FEF3C7' }}
      id="marquee-banner"
      aria-hidden="true"
    >
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: 'marquee 28s linear infinite',
          width: 'max-content',
        }}
      >
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center text-xs sm:text-sm font-ui font-medium px-6"
            style={{ color: 'var(--color-text-dark)' }}
          >
            {item}
            <span className="mx-4 text-amber-400">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
