import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'

// Datos mock del slider — se reemplazarán con imágenes reales en Fase 2
// Los colores de fondo simulan las paletas de las fotos originales de Missy & Po
const SLIDES = [
  {
    id: 1,
    title: 'Para los más Engreídos',
    subtitle: 'Accesorios premium para tu mascota',
    cta: 'Ver Colección',
    href: '/tienda',
    bgFrom: '#E56A6A',
    bgTo: '#F4A0A0',
    emoji: '🐕',
    badge: '¡Nuevo!',
  },
  {
    id: 2,
    title: 'Collares & Correas',
    subtitle: 'Estilo y comodidad para tus paseos',
    cta: 'Ver Collares',
    href: '/tienda?cat=collares',
    bgFrom: '#9333EA',
    bgTo: '#DB2777',
    emoji: '🐾',
    badge: 'Tendencia',
  },
  {
    id: 3,
    title: 'Ropa para Mascotas',
    subtitle: 'Moda canina para todas las temporadas',
    cta: 'Ver Ropa',
    href: '/tienda?cat=ropa',
    bgFrom: '#F5A623',
    bgTo: '#FBBF24',
    emoji: '✨',
    badge: 'Oferta',
  },
  {
    id: 4,
    title: 'Juguetes & Diversión',
    subtitle: 'Horas de entretenimiento garantizadas',
    cta: 'Ver Juguetes',
    href: '/tienda?cat=juguetes',
    bgFrom: '#16A34A',
    bgTo: '#22C55E',
    emoji: '🎾',
    badge: 'Popular',
  },
]

const INTERVAL_MS = 4500

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goTo = useCallback((idx) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrent(idx)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isAnimating])

  // Auto-avance
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((prev) => (prev + 1) % SLIDES.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line

  const slide = SLIDES[current]

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: '420px' }}
      id="hero-slider"
      role="banner"
    >
      {/* SLIDE ACTIVO — Cross-fade transition */}
      {SLIDES.map((s, idx) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: `linear-gradient(135deg, ${s.bgFrom} 0%, ${s.bgTo} 100%)`,
            opacity: idx === current ? 1 : 0,
            pointerEvents: idx === current ? 'auto' : 'none',
          }}
          aria-hidden={idx !== current}
        >
          {/* CONTENIDO DEL SLIDE */}
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="flex-1 py-16">

              {/* Badge */}
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-ui font-bold
                           bg-white/20 text-white backdrop-blur-sm mb-4
                           animate-[fade-in-down_0.5s_ease-out]"
              >
                {s.badge}
              </span>

              {/* Título */}
              <h1
                className="font-hero text-4xl sm:text-5xl md:text-6xl text-white
                           leading-tight mb-3 animate-[fade-in-up_0.6s_ease-out]
                           drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
                style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}
              >
                {s.title}
                <br />
                <span className="text-5xl sm:text-6xl md:text-7xl">{s.emoji}</span>
              </h1>

              {/* Subtítulo */}
              <p
                className="text-white/90 text-base sm:text-lg font-body mb-6 max-w-xs
                           animate-[fade-in-up_0.7s_ease-out]"
              >
                {s.subtitle}
              </p>

              {/* CTA */}
              <Link
                to={s.href}
                className="inline-flex items-center gap-2 bg-white text-gray-800
                           font-ui font-bold px-8 py-3 rounded-full shadow-lg
                           hover:shadow-xl hover:scale-105 active:scale-95
                           transition-all duration-200
                           animate-[fade-in-up_0.8s_ease-out]"
                id={`hero-cta-${idx}`}
              >
                {s.cta}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* DECORACIÓN DERECHA — Círculo con emoji grande */}
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div
                className="w-64 h-64 rounded-full bg-white/15 backdrop-blur-sm
                           flex items-center justify-center shadow-2xl
                           border-4 border-white/30"
                style={{ fontSize: '120px', lineHeight: 1 }}
              >
                {s.emoji}
              </div>
            </div>
          </div>

          {/* PATTERN DECORATIVO */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/5
                          backdrop-blur-sm" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
        </div>
      ))}

      {/* DOTS DE NAVEGACIÓN */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10"
        role="tablist"
        aria-label="Slides del hero"
      >
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={idx === current}
            aria-label={`Slide ${idx + 1}`}
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? 'w-8 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
            }`}
            id={`hero-dot-${idx}`}
          />
        ))}
      </div>

      {/* FLECHAS DE NAVEGACIÓN */}
      <button
        onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                   bg-white/20 backdrop-blur-sm text-white hover:bg-white/40
                   transition-all duration-200 flex items-center justify-center z-10"
        id="hero-prev"
        aria-label="Slide anterior"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => goTo((current + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                   bg-white/20 backdrop-blur-sm text-white hover:bg-white/40
                   transition-all duration-200 flex items-center justify-center z-10"
        id="hero-next"
        aria-label="Siguiente slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
