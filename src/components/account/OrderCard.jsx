const STATUS_MAP = {
  recibido: { label: 'Recibido', color: '#3b82f6', bg: '#eff6ff' },
  preparando: { label: 'Preparando', color: '#f59e0b', bg: '#fffbeb' },
  enviado: { label: 'En camino', color: '#8b5cf6', bg: '#f5f3ff' },
  entregado: { label: 'Entregado', color: '#10b981', bg: '#ecfdf5' },
  cancelado: { label: 'Cancelado', color: '#ef4444', bg: '#fef2f2' }
}

export default function OrderCard({ order }) {
  const status = STATUS_MAP[order.estado] || STATUS_MAP.recibido
  const fecha = order.creado_en instanceof Date
    ? order.creado_en.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const total = order.total_final ? `S/ ${(order.total_final / 100).toFixed(2)}` : '—'
  const itemCount = order.items?.length || 0

  return (
    <div className="bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow duration-200"
         style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-ui font-semibold" style={{ color: 'var(--color-text-light)' }}>
            Pedido
          </p>
          <p className="font-ui font-bold text-sm" style={{ color: 'var(--color-text-dark)' }}>
            #{order.id?.slice(0, 8).toUpperCase() || '—'}
          </p>
        </div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-ui font-bold"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs font-body mb-4" style={{ color: 'var(--color-text-gray)' }}>
        <span>{fecha}</span>
        <span>•</span>
        <span>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
      </div>

      {/* Items preview */}
      {order.items && order.items.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {order.items.slice(0, 3).map((item, i) => (
            <div key={i} className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
              {item.imagen ? (
                <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">📦</div>
              )}
            </div>
          ))}
          {order.items.length > 3 && (
            <span className="text-xs font-ui text-gray-400">+{order.items.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-ui font-bold" style={{ color: 'var(--color-text-dark)' }}>
          {total}
        </span>
        <div className="flex gap-2">
          {order.estado === 'enviado' && order.envio?.tracking_link && (
            <a
              href={order.envio.tracking_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-ui font-bold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{ color: 'white', backgroundColor: '#8b5cf6' }}
            >
              🚚 Rastrear
            </a>
          )}
          <a
            href={`/mi-cuenta/pedidos/detalle?id=${order.id}`}
            className="inline-flex items-center gap-1 text-xs font-ui font-bold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
            style={{ color: 'var(--color-coral)', backgroundColor: '#fff5f5' }}
          >
            Ver detalle →
          </a>
        </div>
      </div>
    </div>
  )
}
