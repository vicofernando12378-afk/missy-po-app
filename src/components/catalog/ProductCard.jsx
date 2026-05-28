import { useState } from 'react'
import { Link } from 'react-router-dom'
import SaleBadge from './SaleBadge'
import PriceDisplay from './PriceDisplay'
import useCartStore from '../../store/cartStore'

// Estrella SVG para rating
const StarIcon = ({ filled }) => (
  <svg
    className={`w-3.5 h-3.5 ${filled ? 'star-filled' : 'star-empty'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462
             c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921
             -.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838
             -.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81
             .588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const CartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
         -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const {
    id,
    slug,
    nombre,
    precio_regular,
    precio_oferta,
    imagen,
    ean,
    categoria,
    rating = 4,
    reviews_count = 0,
    stock = 10,
  } = product

  const hasSale = precio_oferta && precio_oferta < precio_regular
  const discountPct = hasSale
    ? Math.round(((precio_regular - precio_oferta) / precio_regular) * 100)
    : null

  const addItem = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAdding || stock === 0) return
    setIsAdding(true)
    addItem({ id, sku, slug, nombre, precio_regular, precio_oferta, imagen, ean })
    setTimeout(() => {
      setIsAdding(false)
      openDrawer()
    }, 800)
  }

  return (
    <Link
      to={`/producto/${slug || id}`}
      className="product-card group block"
      id={`product-card-${id}`}
      aria-label={`Ver ${nombre}`}
    >
      {/* IMAGEN */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {hasSale && <SaleBadge percentage={discountPct} />}

        {/* Stock agotado overlay */}
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-white text-gray-700 text-xs font-ui font-bold px-3 py-1 rounded-full">
              Agotado
            </span>
          </div>
        )}

        <img
          src={imageError || !imagen ? '/assets/placeholder-pet.jpg' : imagen}
          alt={nombre}
          className="w-full h-full object-cover transition-transform duration-500
                     group-hover:scale-105"
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* HOVER OVERLAY — Ver detalles */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15
                        transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300
                           bg-white text-gray-700 text-xs font-ui font-semibold px-3 py-2
                           rounded-full flex items-center gap-1.5 shadow-md">
            <EyeIcon />
            Ver Detalles
          </span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="p-3">
        {/* Categoría */}
        {categoria && (
          <span className="text-[10px] font-ui font-medium uppercase tracking-wider
                          text-gray-400 mb-1 block">
            {categoria}
          </span>
        )}

        {/* Nombre */}
        <h3 className="font-ui font-semibold text-sm text-gray-800 leading-snug mb-1
                       line-clamp-2 group-hover:text-coral transition-colors">
          {nombre}
        </h3>

        {/* EAN */}
        {ean && (
          <p className="text-[10px] text-gray-400 font-body mb-1.5">
            EAN: {ean}
          </p>
        )}

        {/* RATING */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= rating} />
            ))}
          </div>
          {reviews_count > 0 && (
            <span className="text-[10px] text-gray-400">({reviews_count})</span>
          )}
        </div>

        {/* PRECIO */}
        <div className="mb-3">
          <PriceDisplay regular={precio_regular} sale={precio_oferta} />
        </div>

        {/* BOTÓN AGREGAR AL CARRITO */}
        <button
          onClick={handleAddToCart}
          disabled={stock === 0 || isAdding}
          className={`w-full py-2 rounded-full font-ui font-semibold text-xs
                      transition-all duration-200 flex items-center justify-center gap-1.5
                      ${stock === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isAdding
                          ? 'bg-green-500 text-white scale-95'
                          : 'bg-gray-900 text-white hover:bg-coral hover:shadow-coral active:scale-95'
                      }`}
          id={`add-to-cart-${id}`}
          aria-label={`Agregar ${nombre} al carrito`}
        >
          {isAdding ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M5 13l4 4L19 7" />
              </svg>
              ¡Agregado!
            </>
          ) : (
            <>
              <CartIcon />
              Agregar
            </>
          )}
        </button>
      </div>
    </Link>
  )
}
