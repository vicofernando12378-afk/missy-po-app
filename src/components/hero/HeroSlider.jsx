import { useState, useEffect, useCallback } from 'react';

const SLIDES = [
  {
    id: 1,
    title: 'Para los más Engreídos',
    subtitle: 'Accesorios premium para tu mascota',
    cta: 'Ver Colección',
    href: '/tienda',
    emoji: '🐕',
    badge: '¡Nuevo!',
  },
  {
    id: 2,
    title: 'Collares & Correas',
    subtitle: 'Estilo y comodidad para tus paseos',
    cta: 'Ver Collares',
    href: '/tienda?cat=collares',
    emoji: '🐾',
    badge: 'Tendencia',
  },
  {
    id: 3,
    title: 'Ropa para Mascotas',
    subtitle: 'Moda canina para todas las temporadas',
    cta: 'Ver Ropa',
    href: '/tienda?cat=ropa',
    emoji: '✨',
    badge: 'Oferta',
  },
  {
    id: 4,
    title: 'Juguetes & Diversión',
    subtitle: 'Horas de entretenimiento garantizadas',
    cta: 'Ver Juguetes',
    href: '/tienda?cat=juguetes',
    emoji: '🎾',
    badge: 'Popular',
  },
];

const INTERVAL_MS = 5000;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 800);
  }, [isAnimating]);

  useEffect(() => {
    const timer = setInterval(() => {
      goTo((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []) // eslint-disable-line

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: '420px' }}
      id="hero-slider"
      role="banner"
    >
      {/* VIDEO PERSISTENTE — siempre visible */}
      <video
        src="/assets/hero-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay sutil para legibilidad del texto */}
      <div className="absolute inset-0 bg-black/20" />

      {/* CONTENIDO DEL SLIDE — solo texto cambia */}
      <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center z-10">
        <div className="flex-1 py-16">
          {/* Badge */}
          <span
            key={`badge-${slide.id}`}
            className="inline-block px-3 py-1 rounded-full text-xs font-ui font-bold
                       bg-white/20 text-white backdrop-blur-sm mb-4
                       animate-[fade-in-down_0.5s_ease-out]"
          >
            {slide.badge}
          </span>

          {/* Título */}
          <h1
            key={`title-${slide.id}`}
            className="font-hero text-4xl sm:text-5xl md:text-6xl text-white
                       leading-tight mb-3 animate-[fade-in-up_0.6s_ease-out]
                       drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
          >
            {slide.title}
            <br />
            <span className="text-5xl sm:text-6xl md:text-7xl">{slide.emoji}</span>
          </h1>

          {/* Subtítulo */}
          <p
            key={`sub-${slide.id}`}
            className="text-white/95 text-base sm:text-lg font-body mb-6 max-w-xs
                       animate-[fade-in-up_0.7s_ease-out]
                       drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            {slide.subtitle}
          </p>

          {/* CTA */}
          <a
            key={`cta-${slide.id}`}
            href={slide.href}
            className="inline-flex items-center gap-2 bg-white text-gray-800
                       font-ui font-bold px-8 py-3 rounded-full shadow-lg
                       hover:shadow-xl hover:scale-105 active:scale-95
                       transition-all duration-200
                       animate-[fade-in-up_0.8s_ease-out]"
            id={`hero-cta-${current}`}
          >
            {slide.cta}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* DECORACIÓN DERECHA — sutil, no bloquea el video */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div
            key={`emoji-${slide.id}`}
            className="w-64 h-64 rounded-full bg-white/10 backdrop-blur-[2px]
                       flex items-center justify-center shadow-lg
                       border-2 border-white/20 animate-[fade-in-up_0.6s_ease-out]"
            style={{ fontSize: '120px', lineHeight: 1 }}
          >
            {slide.emoji}
          </div>
        </div>
      </div>

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
  );
}
