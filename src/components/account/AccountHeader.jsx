export default function AccountHeader({ profile, stats = {} }) {
  const nombre = profile?.nombre || 'Socio';
  const apellido = profile?.apellido || '';
  const email = profile?.email || '';
  const mascota = profile?.mascotas?.[0]?.nombre || null;

  return (
    <div className="relative overflow-hidden rounded-3xl mb-8" style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fff8ec 50%, #fff5f5 100%)' }}>
      {/* Decoración */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: 'var(--color-coral)' }} />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full opacity-10" style={{ background: 'var(--color-gold)' }} />
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Saludo */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-ui font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-coral)' }}>
              {mascota ? `🐾 ${mascota} y tú` : '🐾 Mi Cuenta'}
            </p>
            <h1 className="font-hero text-2xl sm:text-3xl mb-1" style={{ color: 'var(--color-text-dark)' }}>
              Hola, {nombre}
            </h1>
            <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
              {email}
            </p>
          </div>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
               style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}>
            {nombre.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl font-hero font-black" style={{ color: 'var(--color-coral)' }}>
              {stats.totalOrders ?? '—'}
            </div>
            <div className="text-xs font-ui font-semibold mt-1" style={{ color: 'var(--color-text-gray)' }}>
              Pedidos
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl font-hero font-black" style={{ color: 'var(--color-gold)' }}>
              {stats.totalPoints ?? '—'}
            </div>
            <div className="text-xs font-ui font-semibold mt-1" style={{ color: 'var(--color-text-gray)' }}>
              Puntos
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl font-hero font-black" style={{ color: '#14b8a6' }}>
              {stats.activeOrders ?? '—'}
            </div>
            <div className="text-xs font-ui font-semibold mt-1" style={{ color: 'var(--color-text-gray)' }}>
              En camino
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
