import { useEffect, useRef } from 'react';

// Efecto Textillate letra a letra con gradiente púrpura/magenta (equivalente al plugin easy-textillate)
// El texto se anima al cargar y al hacer hover sobre cada letra

const TITLE_TEXT = 'NOVEDADES MISSY & PO!!!!';

export default function AnimatedTitle() {
  const lettersRef = useRef([]);

  useEffect(() => {
    // Anima cada letra con un delay escalonado al montar
    lettersRef.current.forEach((el, i) => {
      if (!el) return;
      setTimeout(() => {
        el.style.animation = 'bounce-letter 0.6s ease-out both';
        // Limpia la animación para poder re-triggearla en hover
        setTimeout(() => {
          el.style.animation = '';
        }, 700);
      }, i * 60);
    });
  }, []);

  const handleLetterHover = (el) => {
    if (!el) return;
    el.style.animation = 'none';
    // Fuerza reflow para reiniciar
    void el.offsetWidth;
    el.style.animation = 'bounce-letter 0.5s ease-out';
  };

  return (
    <div className="text-center py-8 px-4" id="animated-title-section">
      <h2
        className="font-brand text-3xl sm:text-4xl md:text-5xl font-bold leading-tight
                   select-none cursor-default"
        aria-label={TITLE_TEXT}
      >
        {TITLE_TEXT.split('').map((char, i) => (
          <span
            key={i}
            ref={(el) => (lettersRef.current[i] = el)}
            className="inline-block animated-letter"
            style={{
              background: 'linear-gradient(135deg, #9333EA 0%, #DB2777 50%, #E56A6A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              // Stroke effect via text-shadow trick
              filter: 'drop-shadow(0 2px 4px rgba(147,51,234,0.2))',
              animationFillMode: 'both',
            }}
            onMouseEnter={(e) => handleLetterHover(e.currentTarget)}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h2>
      <p className="mt-3 font-body text-gray-500 text-sm md:text-base max-w-md mx-auto">
        Descubre las últimas novedades para tu mascota favorita 🐾
      </p>
    </div>
  );
}
