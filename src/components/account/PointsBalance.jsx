export default function PointsBalance({ points = 0, history = [] }) {
  const recentHistory = history.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      {/* Header */}
      <div className="p-5" style={{ background: 'linear-gradient(135deg, #fffbeb, #fff5f5)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
               style={{ background: 'linear-gradient(135deg, var(--color-gold), #f59e0b)' }}>
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-ui font-bold uppercase tracking-widest" style={{ color: 'var(--color-gold)' }}>
              Club Missy & Po
            </p>
            <h3 className="font-hero text-lg" style={{ color: 'var(--color-text-dark)' }}>
              Tus Puntos
            </h3>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-hero font-black" style={{ color: 'var(--color-gold)' }}>
            {points}
          </span>
          <span className="text-sm font-ui font-semibold" style={{ color: 'var(--color-text-gray)' }}>
            puntos
          </span>
        </div>
      </div>

      {/* Recent history */}
      {recentHistory.length > 0 && (
        <div className="p-4">
          <p className="text-xs font-ui font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-light)' }}>
            Movimientos recientes
          </p>
          <div className="space-y-2">
            {recentHistory.map((entry, i) => {
              const isPositive = entry.puntos > 0;
              const fecha = entry.creado_en instanceof Date
                ? entry.creado_en.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                : '—';
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0"
                     style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body truncate" style={{ color: 'var(--color-text-dark)' }}>
                      {entry.motivo || 'Movimiento'}
                    </p>
                    <p className="text-xs font-body" style={{ color: 'var(--color-text-light)' }}>
                      {fecha}
                    </p>
                  </div>
                  <span className={`text-sm font-ui font-bold ml-3 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{entry.puntos}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-4">
        <a
          href="#club"
          className="block w-full text-center py-2.5 rounded-xl text-sm font-ui font-bold transition-all hover:opacity-90"
          style={{ color: 'var(--color-coral)', backgroundColor: '#fff5f5' }}
        >
          Ver todos mis beneficios →
        </a>
      </div>
    </div>
  );
}
