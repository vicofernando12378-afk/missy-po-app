import { Link } from 'react-router-dom'

const PawIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-3.5 6c-.83 0-1.5-.67-1.5-1.5S7.67 5 8.5 5 10 5.67 10 6.5 9.33 8 8.5 8zm7 0c-.83 0-1.5-.67-1.5-1.5S14.67 5 15.5 5 17 5.67 17 6.5 16.33 8 15.5 8zm-3.5 7c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
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

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100" id="main-footer">

      {/* CUERPO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* COLUMNA BRAND */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4" id="footer-logo">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                   style={{ backgroundColor: 'var(--color-coral)' }}>
                <PawIcon />
              </div>
              <div>
                <div className="font-brand text-xl" style={{ color: 'var(--color-coral)' }}>
                  Missy & Po
                </div>
                <div className="font-ui text-[10px] text-gray-400 uppercase tracking-widest">
                  Pet Shop
                </div>
              </div>
            </Link>
            <p className="text-sm text-gray-600 font-body leading-relaxed mb-4">
              Tu tienda online de confianza para los engreídos de la familia. 
              Accesorios, ropa y juguetes de calidad para mascotas.
            </p>
            {/* Envío info */}
            <div className="space-y-1 text-xs text-gray-500">
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
          </div>

          {/* COLUMNA INFORMACIÓN */}
          <div>
            <h3 className="font-ui font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              Información
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.info.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-coral transition-colors font-body"
                    id={`footer-info-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
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
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-coral transition-colors font-body"
                    id={`footer-shop-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
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
                  <Link
                    to={link.href}
                    className="text-sm text-gray-600 hover:text-coral transition-colors font-body"
                    id={`footer-legal-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
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
