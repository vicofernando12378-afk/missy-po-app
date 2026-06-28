
const PawIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-3.5 6c-.83 0-1.5-.67-1.5-1.5S7.67 5 8.5 5 10 5.67 10 6.5 9.33 8 8.5 8zm7 0c-.83 0-1.5-.67-1.5-1.5S14.67 5 15.5 5 17 5.67 17 6.5 16.33 8 15.5 8zm-3.5 7c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.43-.43-.63-.67-.07 2.62-.04 5.25-.05 7.87-.1 2.21-1.07 4.39-2.91 5.63-1.92 1.34-4.52 1.63-6.68.85-2.28-.75-4.14-2.71-4.78-5.02-.75-2.58-.2-5.46 1.49-7.53 1.63-2.06 4.31-3.03 6.89-2.52.02 1.37.01 2.74.02 4.12-1.28-.36-2.7-.09-3.71.74-.99.8-1.45 2.14-1.22 3.4.2 1.25 1.18 2.29 2.41 2.59 1.17.3 2.48-.1 3.16-1.09.43-.6.56-1.35.54-2.08-.01-4.63-.01-9.26-.01-13.89z"/>
  </svg>
)

const FOOTER_LINKS = {
  info: [
    { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { label: 'Blog Mascotas', href: '/blog' },
    { label: 'Trabaja con Nosotros', href: '/empleo' },
  ],
  shop: [
    { label: 'Tienda', href: '/tienda' },
    { label: 'Ofertas', href: '/tienda?cat=ofertas' },
    { label: 'Nuevos Productos', href: '/tienda?cat=nuevo' },
    { label: 'Más Vendidos', href: '/tienda?cat=top' },
  ],
  legal: [
    { label: 'Política de Privacidad', href: '/privacidad' },
    { label: 'Términos y Condiciones', href: '/terminos' },
    { label: 'Política de Envíos', href: '/envios' },
    { label: 'Libro de Reclamaciones', href: '/reclamaciones' },
  ],
}

export default function Footer({ logoUrl }) {
  return (
    <footer className="bg-white border-t border-gray-100" id="main-footer">

      {/* CUERPO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* COLUMNA BRAND */}
          <div className="lg:col-span-2">
            <a href="/" className="inline-block mb-4" id="footer-logo">
              <img
                src={logoUrl || "/assets/logoheader.png"}
                alt="Missy & Po Logo"
                className="w-28 h-28 object-contain rounded-xl border border-gray-200 shadow-sm bg-white"
              />
            </a>
            <p className="text-sm text-gray-600 font-body leading-relaxed mb-4">
              Tu tienda online de confianza para los engreídos de la familia. 
              Accesorios, ropa y juguetes de calidad para mascotas.
            </p>
            {/* Envíos e Info de Pago con Redes Sociales al lado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-6">
              <div className="space-y-1.5 text-xs text-gray-500 max-w-[280px]">
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Courier Shalom — Envíos a todo el Perú</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span>Olva Express — Delivery express Lima</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💳</span>
                  <span>Yape · Plin · Mercado Pago · Contra reembolso</span>
                </div>
              </div>

              {/* Botones de Redes Sociales */}
              <div className="flex items-center gap-4">
                <a
                  href="https://www.facebook.com/missynpopetshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-[#1877F2] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
                  aria-label="Facebook"
                  id="footer-social-facebook"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="https://www.instagram.com/missynpo.petshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-[#E1306C] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
                  aria-label="Instagram"
                  id="footer-social-instagram"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="https://www.tiktok.com/@missynpo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-[#000000] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
                  aria-label="TikTok"
                  id="footer-social-tiktok"
                >
                  <TikTokIcon />
                </a>
              </div>
            </div>
          </div>

          {/* COLUMNA INFORMACIÓN */}
          <div>
            <h3 className="font-ui font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Información
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.info.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-coral transition-colors font-body"
                    id={`footer-info-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMNA TIENDA */}
          <div>
            <h3 className="font-ui font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Tienda
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-coral transition-colors font-body"
                    id={`footer-shop-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMNA LEGAL */}
          <div>
            <h3 className="font-ui font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-coral transition-colors font-body"
                    id={`footer-legal-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* BARRA COPYRIGHT */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center 
                        justify-between gap-2 text-xs text-gray-500 font-body">
          <span>
            © {new Date().getFullYear()} Missy & Po Pet Shop. Todos los derechos reservados.
          </span>
          <span className="text-gray-400">
            Hecho con 🐾 para los mejores engreídos del Perú
          </span>
        </div>
      </div>
    </footer>
  )
}
