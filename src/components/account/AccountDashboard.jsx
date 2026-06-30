import AccountHeader from './AccountHeader';
import ContentFeed from './ContentFeed';
import OrderCard from './OrderCard';
import PointsBalance from './PointsBalance';
import SmartCTA from './SmartCTA';

export default function AccountDashboard({ profile, orders = [], points = 0, pointsHistory = [] }) {
  const activeOrders = orders.filter(o => ['recibido', 'preparando', 'enviado'].includes(o.estado));
  const recentOrders = orders.slice(0, 3);

  const stats = {
    totalOrders: orders.length,
    totalPoints: points,
    activeOrders: activeOrders.length,
  };

  return (
    <div>
      {/* Header con resumen */}
      <AccountHeader profile={profile} stats={stats} />

      {/* CTA Inteligente */}
      <div className="mb-6">
        <SmartCTA profile={profile} orders={orders} points={points} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Último pedido */}
          {recentOrders.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-ui font-bold text-lg" style={{ color: 'var(--color-text-dark)' }}>
                  Últimos Pedidos
                </h2>
                <a href="/mi-cuenta/pedidos" className="text-sm font-ui font-bold" style={{ color: 'var(--color-coral)' }}>
                  Ver todos →
                </a>
              </div>
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          )}

          {/* Sin pedidos */}
          {orders.length === 0 && (
            <section className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-5xl mb-4 block">📦</span>
              <h3 className="font-ui font-bold text-lg mb-2" style={{ color: 'var(--color-text-dark)' }}>
                Aún no tienes pedidos
              </h3>
              <p className="text-sm font-body mb-6" style={{ color: 'var(--color-text-gray)' }}>
                ¡Explora nuestra tienda y encuentra los mejores productos para tu mascota!
              </p>
              <a
                href="/tienda"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
              >
                🛒 Ir a la Tienda
              </a>
            </section>
          )}

          {/* Contenido Blog/YouTube */}
          <section>
            <h2 className="font-ui font-bold text-lg mb-4" style={{ color: 'var(--color-text-dark)' }}>
              Contenido para Ti
            </h2>
            <ContentFeed />
          </section>
        </div>

        {/* Sidebar derecha */}
        <div className="space-y-6">
          {/* Puntos del Club */}
          <PointsBalance points={points} history={pointsHistory} />

          {/* Quick links */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
              Accesos Rápidos
            </h3>
            <div className="space-y-2">
              <a href="/mi-cuenta/direcciones" className="flex items-center gap-3 py-2 px-3 rounded-xl text-sm font-ui font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span>🏠</span> Mis Direcciones
              </a>
              <a href="/mi-cuenta/mascotas" className="flex items-center gap-3 py-2 px-3 rounded-xl text-sm font-ui font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span>🐾</span> Mis Mascotas
              </a>
              <a href="/mi-cuenta/perfil" className="flex items-center gap-3 py-2 px-3 rounded-xl text-sm font-ui font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span>👤</span> Editar Perfil
              </a>
              <a href="/club-missypo" className="flex items-center gap-3 py-2 px-3 rounded-xl text-sm font-ui font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span>⭐</span> Club de Beneficios
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
