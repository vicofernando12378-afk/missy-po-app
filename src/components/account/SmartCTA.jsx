import { useState, useEffect } from 'react';

function getSmartCTA({ profile, orders, points }) {
  const totalOrders = orders?.length || 0;
  const lastOrder = orders?.[0];
  const hasMascota = profile?.mascotas?.length > 0;

  // Sin pedidos → invitar a comprar
  if (totalOrders === 0) {
    return {
      title: '¿Listo para consentir a tu mascota?',
      description: 'Explora nuestra tienda y encuentra los mejores productos para tu peludo.',
      cta: 'Explorar Tienda',
      href: '/tienda',
      icon: '🛒',
      color: 'var(--color-coral)',
      bg: '#fff5f5',
    };
  }

  // Puntos acumulados → invitar a canjear
  if (points >= 100) {
    return {
      title: `Tienes ${points} puntos acumulados`,
      description: 'Canjea tus Missy & Po Puntos por descuentos exclusivos en tu próxima compra.',
      cta: 'Canjear Puntos',
      href: '/mi-cuenta/club',
      icon: '⭐',
      color: 'var(--color-gold)',
      bg: '#fffbeb',
    };
  }

  // Sin mascota registrada → invitar a registrar
  if (!hasMascota) {
    return {
      title: 'Registra a tu mascota',
      description: 'Agrega a tu peludo para recibir recomendaciones personalizadas y beneficios de cumpleaños.',
      cta: 'Agregar Mascota',
      href: '/mi-cuenta/mascotas',
      icon: '🐾',
      color: '#8b5cf6',
      bg: '#f5f3ff',
    };
  }

  // Último pedido hace tiempo → invitar a reordenar
  if (lastOrder?.creado_en) {
    const daysSince = Math.floor((Date.now() - new Date(lastOrder.creado_en).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) {
      return {
        title: '¿Necesitas algo más?',
        description: `Hace ${daysSince} días hiciste tu última compra. ¿Quieres repetir o explorar algo nuevo?`,
        cta: 'Comprar de Nuevo',
        href: '/tienda',
        icon: '🔄',
        color: '#14b8a6',
        bg: '#f0fdfa',
      };
    }
  }

  // Default: contenido relacionado
  return {
    title: 'Contenido para ti',
    description: 'Descubre consejos y tips en nuestro blog y canal de YouTube.',
    cta: 'Ver Blog',
    href: '/blog',
    icon: '📰',
    color: '#3b82f6',
    bg: '#eff6ff',
  };
}

export default function SmartCTA({ profile, orders, points }) {
  const [cta, setCta] = useState(null);

  useEffect(() => {
    setCta(getSmartCTA({ profile, orders, points }));
  }, [profile, orders, points]);

  if (!cta) return null;

  return (
    <div className="rounded-2xl border p-5 transition-all hover:shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: cta.bg }}>
      <div className="flex items-start gap-4">
        <span className="text-3xl">{cta.icon}</span>
        <div className="flex-1">
          <h3 className="font-ui font-bold text-base mb-1" style={{ color: 'var(--color-text-dark)' }}>
            {cta.title}
          </h3>
          <p className="text-sm font-body mb-3" style={{ color: 'var(--color-text-gray)' }}>
            {cta.description}
          </p>
          <a
            href={cta.href}
            className="inline-flex items-center gap-1.5 text-sm font-ui font-bold transition-all hover:translate-x-1"
            style={{ color: cta.color }}
          >
            {cta.cta}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
