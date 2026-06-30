
// Banner amarillo pre-footer extraído del brief
// Equivalente al CTA de Missy & Po con la imagen del Yorkie

export default function CTABanner() {
  return (
    <section
      className="py-12 px-4 overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-yellow-cta)' }}
      id="cta-banner"
      aria-label="Banner de llamada a la acción"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">

        {/* TEXTO */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block bg-white/30 rounded-full px-4 py-1 text-sm font-ui
                          font-semibold text-gray-700 mb-4">
            🐾 ¡Para los mejores engreídos!
          </div>

          <h2 className="font-hero text-4xl md:text-5xl text-gray-800 mb-3
                         leading-tight drop-shadow-sm">
            ¿Qué esperas para
            <br />
            mimar a tu mascota?
          </h2>

          <p className="font-body text-gray-700 text-base md:text-lg mb-6 max-w-md">
            Encuentra los mejores accesorios, ropa y juguetes para tus mascotas.
            Envíos a todo el Perú 🇵🇪
          </p>

          <a
            href="/tienda"
            className="inline-flex items-center gap-2 bg-gray-700 text-white
                       font-ui font-bold px-8 py-3.5 rounded-full shadow-md
                       hover:bg-gray-800 hover:shadow-lg hover:scale-105
                       active:scale-95 transition-all duration-200"
            id="cta-ir-tienda"
          >
            IR A LA TIENDA
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* IMAGEN YORKIE / MASCOTA */}
        <div className="flex-shrink-0 relative">
          {/* Círculo decorativo de fondo */}
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white/30
                          flex items-center justify-center relative overflow-hidden
                          border-4 border-white/50 shadow-xl">
            <span style={{ fontSize: '120px', lineHeight: 1 }}>🐕</span>
            {/* Decoraciones flotantes */}
            <span className="absolute top-3 right-3 text-2xl animate-[float-up_2s_ease-in-out_infinite_alternate]">
              ⭐
            </span>
            <span className="absolute bottom-3 left-3 text-xl animate-[float-up_2.5s_ease-in-out_infinite_alternate]">
              🐾
            </span>
          </div>

          {/* Bubble decorativo */}
          <div className="absolute -top-4 -right-4 bg-white rounded-full px-3 py-1
                          shadow-md text-xs font-ui font-bold text-coral whitespace-nowrap">
            ¡Envío express! 🚀
          </div>
        </div>
      </div>

      {/* DECORACIÓN DE FONDO */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
    </section>
  );
}
