const TIMELINE_STEPS = [
  { key: 'recibido', label: 'Recibido', icon: '📥', color: '#3b82f6' },
  { key: 'preparando', label: 'Preparando', icon: '📦', color: '#f59e0b' },
  { key: 'enviado', label: 'En camino', icon: '🚚', color: '#8b5cf6' },
  { key: 'entregado', label: 'Entregado', icon: '✅', color: '#10b981' }
]

export default function OrderTimeline({ history = [], currentStatus }) {
  const statusOrder = ['recibido', 'preparando', 'enviado', 'entregado']
  const currentIdx = statusOrder.indexOf(currentStatus)

  const getStatusDate = (statusKey) => {
    const entry = history.find(h => h.estado === statusKey)
    if (!entry?.fecha) return null
    const date = entry.fecha instanceof Date ? entry.fecha : new Date(entry.fecha)
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (currentStatus === 'cancelado') {
    return (
      <div className="flex items-center gap-3 py-4 px-4 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
        <span className="text-2xl">❌</span>
        <div>
          <p className="font-ui font-bold text-sm text-red-600">Pedido Cancelado</p>
          {getStatusDate('cancelado') && (
            <p className="text-xs font-body text-red-400">{getStatusDate('cancelado')}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const isCompleted = i <= currentIdx
        const isCurrent = i === currentIdx
        const date = getStatusDate(step.key)

        return (
          <div key={step.key} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  isCompleted ? 'text-white shadow-md' : 'bg-gray-100 text-gray-400'
                }`}
                style={isCompleted ? { backgroundColor: step.color } : {}}
              >
                {isCompleted ? step.icon : i + 1}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${i < currentIdx ? '' : 'bg-gray-200'}`}
                     style={i < currentIdx ? { backgroundColor: step.color } : {}} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isCurrent ? '' : 'opacity-60'}`}>
              <p className={`font-ui font-bold text-sm ${isCurrent ? '' : ''}`}
                 style={{ color: isCompleted ? 'var(--color-text-dark)' : 'var(--color-text-light)' }}>
                {step.label}
              </p>
              {date && (
                <p className="text-xs font-body" style={{ color: 'var(--color-text-light)' }}>
                  {date}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
