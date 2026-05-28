import { useState } from 'react'
import { Link } from 'react-router-dom'
import LiveSearch from '../header/LiveSearch'
import CartHoverPopup from '../header/CartHoverPopup'
import useCartStore from '../../store/cartStore'
import MarqueeBanner from '../hero/MarqueeBanner'

// Íconos inline SVG para evitar dependencia extra
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Categorías de navegación extraídas del plan
const NAV_CATEGORIES = [
  { label: 'INICIO', href: '/' },
  { label: 'TIENDA', href: '/tienda' },
  { label: 'COLLARES', href: '/tienda?cat=collares' },
  { label: 'ROPA', href: '/tienda?cat=ropa' },
  { label: 'JUGUETES', href: '/tienda?cat=juguetes' },
  { label: 'ACCESORIOS', href: '/tienda?cat=accesorios' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartHoverOpen, setCartHoverOpen] = useState(false)

  const cartCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.cantidad, 0))
  const cartTotal = useCartStore(s => s.items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0))
  const openDrawer = useCartStore(s => s.openDrawer)


  return (
    <header className="sticky top-0 z-navbar print:hidden">

      {/* === NAVBAR PRINCIPAL === */}
      <nav
        className="bg-coral shadow-lg"
        style={{ backgroundColor: 'var(--color-coral)' }}
        id="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 min-h-[72px] py-1.5">

            {/* LOGO */}
            <Link
              to="/"
              className="flex-shrink-0 flex items-center"
              id="nav-logo"
            >
              <img
                src="/assets/logoheader.png"
                alt="Missy & Po Logo"
                className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-xl border border-white/20 shadow-md"
              />
            </Link>

            {/* BARRA DE BÚSQUEDA — LiveSearch predictivo */}
            <LiveSearch />

            {/* ACCIONES DERECHA */}
            <div className="flex items-center gap-3 ml-auto">

              {/* Selector de moneda */}
              <div className="hidden lg:flex items-center gap-1 text-white/90 text-xs font-ui cursor-pointer
                              hover:text-white transition-colors"
                   id="currency-toggle">
                <span className="font-semibold">PEN</span>
                <span className="text-white/50">|</span>
                <span>USD</span>
              </div>

              {/* Mi Cuenta */}
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 text-white/90 hover:text-white
                           transition-colors text-xs font-ui"
                id="nav-account"
              >
                <UserIcon />
                <span>Mi Cuenta</span>
              </Link>

              {/* Carrito — con hover popup */}
              <div
                className="relative flex items-center gap-2 text-white cursor-pointer
                           hover:text-white/80 transition-colors group"
                id="cart-indicator"
                onMouseEnter={() => setCartHoverOpen(true)}
                onMouseLeave={() => setCartHoverOpen(false)}
                onClick={openDrawer}
              >
                <div className="relative">
                  <CartIcon />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400
                                     text-gray-900 text-[10px] font-bold flex items-center justify-center
                                     animate-[pulse-badge_1s_ease-in-out_infinite]">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-xs font-ui leading-none">
                  <div className="text-white/70 text-[10px]">Carrito</div>
                  <div className="font-semibold text-sm">
                    S/. {(cartTotal / 100).toFixed(2)}
                  </div>
                </div>

                {/* Hover popup */}
                {cartHoverOpen && (
                  <CartHoverPopup onClose={() => setCartHoverOpen(false)} />
                )}
              </div>

              {/* Menú hamburguesa — Mobile */}
              <button
                className="md:hidden text-white p-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="mobile-menu-toggle"
                aria-label="Menú principal"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {/* CATEGORÍAS — Fila inferior (desktop) */}
          <div className="hidden md:flex items-center justify-center gap-6 pb-2 overflow-x-auto scrollbar-hide">
            {NAV_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={cat.href}
                className="navbar-link text-xs font-semibold whitespace-nowrap pb-1"
                id={`nav-cat-${cat.label.toLowerCase()}`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* MENÚ MOBILE */}
        {mobileMenuOpen && (
          <div
            className="md:hidden bg-coral-dark border-t border-white/20 animate-[fade-in-down_0.2s_ease-out]"
            style={{ backgroundColor: 'var(--color-coral-dark)' }}
            id="mobile-menu"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.href}
                  className="py-2.5 px-3 rounded-lg text-white font-ui text-sm font-medium
                             hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.label}
                </Link>
              ))}
              <div className="border-t border-white/20 mt-2 pt-2">
                <Link
                  to="/login"
                  className="py-2.5 px-3 rounded-lg text-white font-ui text-sm font-medium
                             hover:bg-white/10 transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon />
                  Mi Cuenta
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      <MarqueeBanner />
    </header>
  )
}
