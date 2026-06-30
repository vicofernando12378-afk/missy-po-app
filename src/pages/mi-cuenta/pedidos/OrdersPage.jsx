import { useState } from 'react';

import OrderCard from '../../../components/account/OrderCard';

const FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'activos', label: 'Activos' },
  { id: 'completados', label: 'Completados' },
  { id: 'cancelados', label: 'Cancelados' },
];

const ACTIVE_STATES = ['recibido', 'preparando', 'enviado'];
const COMPLETED_STATES = ['entregado'];
const CANCELLED_STATES = ['cancelado'];

export default function OrdersPage({ authUser, profile, orders = [], ordersLoading = false }) {
  const [activeFilter, setActiveFilter] = useState('todos');

  if (ordersLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--color-coral)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'todos') return true;
    if (activeFilter === 'activos') return ACTIVE_STATES.includes(order.estado);
    if (activeFilter === 'completados') return COMPLETED_STATES.includes(order.estado);
    if (activeFilter === 'cancelados') return CANCELLED_STATES.includes(order.estado);
    return true;
  });

  const filterCounts = {
    todos: orders.length,
    activos: orders.filter(o => ACTIVE_STATES.includes(o.estado)).length,
    completados: orders.filter(o => COMPLETED_STATES.includes(o.estado)).length,
    cancelados: orders.filter(o => CANCELLED_STATES.includes(o.estado)).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-hero text-2xl sm:text-3xl mb-2" style={{ color: 'var(--color-text-dark)' }}>
          Mis Pedidos
        </h1>
        <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
          Revisa el historial y estado de tus compras.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-ui font-semibold transition-all duration-200 border cursor-pointer ${
              activeFilter === filter.id
                ? 'text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            style={activeFilter === filter.id ? {
              backgroundColor: 'var(--color-coral)',
              borderColor: 'var(--color-coral)',
            } : {
              borderColor: 'var(--color-border)',
            }}
          >
            {filter.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {filterCounts[filter.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-5xl mb-4 block">📦</span>
          <h3 className="font-ui font-bold text-lg mb-2" style={{ color: 'var(--color-text-dark)' }}>
            {activeFilter === 'todos' ? 'Aún no tienes pedidos' : 'No hay pedidos en esta categoría'}
          </h3>
          <p className="text-sm font-body mb-6" style={{ color: 'var(--color-text-gray)' }}>
            {activeFilter === 'todos'
              ? '¡Explora nuestra tienda y encuentra los mejores productos para tu mascota!'
              : 'Intenta con otro filtro o revisa tu historial completo.'}
          </p>
          <a
            href="/tienda"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
          >
            🛒 Ir a la Tienda
          </a>
        </div>
      )}
    </div>
  );
}
