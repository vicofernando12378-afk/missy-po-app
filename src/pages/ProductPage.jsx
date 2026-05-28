import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import useCatalogStore from '../store/catalogStore'
import useCartStore from '../store/cartStore'
import PriceDisplay from '../components/catalog/PriceDisplay'
import SaleBadge from '../components/catalog/SaleBadge'
import ProductCard from '../components/catalog/ProductCard'

// Icono estrella para rating
const StarIcon = ({ filled }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-amber-400' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { productos, fetchCatalog, getProductoBySlug, isLoading } = useCatalogStore()
  const addItem = useCartStore(s => s.addItem)
  const openDrawer = useCartStore(s => s.openDrawer)

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [cantidad, setCantidad] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedAttributes, setSelectedAttributes] = useState({})

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  const product = getProductoBySlug(slug)

  // Auto-seleccionar primer elemento del catálogo al cargar si el slug no coincide
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0)
      setCantidad(1)
      setIsAdding(false)
      
      // Inicializar atributos seleccionados
      const initialAttrs = {}
      if (product.atributos) {
        Object.keys(product.atributos).forEach(key => {
          const attr = product.atributos[key]
          if (attr.is_variation && attr.value) {
            // Dividir los valores (ej: "S|M|L") y tomar el primero
            const values = attr.value.split('|').map(v => v.trim())
            if (values.length > 0) {
              initialAttrs[key.toLowerCase()] = values[0]
            }
          }
        })
      }
      setSelectedAttributes(initialAttrs)
    }
  }, [product])

  if (isLoading) {
    return (
      <div className="py-32 text-center">
        <div className="inline-block w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-body text-sm mt-4">Cargando detalles de tu engreído...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="font-brand text-3xl text-coral mb-2">Producto no encontrado</h1>
        <p className="text-gray-500 font-body mb-6">El producto que buscas no existe o ha sido retirado.</p>
        <Link to="/tienda" className="bg-coral text-white font-ui font-semibold px-6 py-3 rounded-full hover:bg-coral-dark transition-colors">
          Volver a la Tienda
        </Link>
      </div>
    )
  }

  const {
    id,
    nombre,
    descripcion,
    descripcion_corta,
    sku,
    precio_regular,
    precio_oferta,
    precio,
    stock,
    stock_status,
    categorias = [],
    imagenes = [],
    atributos = {},
    variantes = []
  } = product

  // 1. Resolver variante seleccionada
  const hasVariations = variantes.length > 0
  let activeVariation = null
  if (hasVariations) {
    // Buscar la variante que coincida con los atributos seleccionados
    activeVariation = variantes.find(v => {
      return Object.keys(selectedAttributes).every(key => {
        // En variantes, los atributos tienen nombres como "pa_color-ropa" o similar.
        // Hacemos una comparación flexible (ej: ver si el valor coincide)
        const matchKey = Object.keys(v.atributos).find(vKey => vKey.toLowerCase().includes(key) || key.includes(vKey.toLowerCase()))
        if (matchKey) {
          return v.atributos[matchKey].toLowerCase().trim() === selectedAttributes[key].toLowerCase().trim()
        }
        return false
      })
    })
  }

  // Valores dinámicos según la variante seleccionada
  const displaySku = activeVariation ? activeVariation.sku : sku
  const displayPriceRegular = activeVariation ? activeVariation.precio : precio_regular
  const displayPriceOferta = activeVariation ? (precio_oferta ? activeVariation.precio * (precio_oferta / precio_regular) : null) : precio_oferta
  const displayPrice = activeVariation ? activeVariation.precio : precio
  const displayStock = activeVariation ? activeVariation.stock : stock
  const isOutOfStock = displayStock === 0

  const hasSale = displayPriceOferta && displayPriceOferta < displayPriceRegular
  const discountPct = hasSale ? Math.round(((displayPriceRegular - displayPriceOferta) / displayPriceRegular) * 100) : null

  // Manejador del carrito
  const handleAddToCart = () => {
    if (isAdding || isOutOfStock) return
    setIsAdding(true)

    // Formatear detalle de la variación para el carrito
    let variationName = 'default'
    if (hasVariations && activeVariation) {
      variationName = Object.entries(selectedAttributes)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(', ')
    }

    addItem({
      id,
      sku: displaySku,
      slug,
      nombre,
      precio_regular: displayPriceRegular,
      precio_oferta: displayPriceOferta,
      imagen: imagenes[activeImageIndex] || imagenes[0],
      ean: product.ean || '',
      variante: variationName,
      cantidad: cantidad
    })

    setTimeout(() => {
      setIsAdding(false)
    }, 800)
  }

  // Filtrar productos relacionados (misma categoría, excluyendo el actual)
  const relacionados = productos
    .filter(p => p.categorias?.some(c => categorias.includes(c)) && p.id !== id)
    .slice(0, 4)

  const handleAttributeChange = (attrName, val) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attrName.toLowerCase()]: val
    }))
  }

  return (
    <>
      <Helmet>
        <title>{nombre} | Missy & Po Pet Shop</title>
        <meta name="description" content={descripcion_corta || descripcion?.substring(0, 150)} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-xs font-body text-gray-400 mb-6 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-coral transition-colors">Inicio</Link>
          <span>/</span>
          <Link to="/tienda" className="hover:text-coral transition-colors">Tienda</Link>
          {categorias.length > 0 && (
            <>
              <span>/</span>
              <span className="text-gray-500 font-semibold">{categorias[0]}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-600 line-clamp-1">{nombre}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-16">
          {/* COLUMNA IZQUIERDA — GALERÍA */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
              {hasSale && <SaleBadge percentage={discountPct} />}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-10">
                  <span className="bg-white text-gray-800 font-ui font-bold px-4 py-2 rounded-full shadow-md text-sm">
                    Agotado
                  </span>
                </div>
              )}

              <img
                src={imagenes[activeImageIndex] || '/assets/placeholder-pet.jpg'}
                alt={nombre}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {imagenes.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border-2 transition-all flex-shrink-0
                                ${activeImageIndex === idx ? 'border-coral shadow-sm scale-95' : 'border-transparent hover:border-gray-200'}`}
                  >
                    <img src={img} alt={`${nombre} - miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA — INFORMACIÓN */}
          <div className="flex flex-col">
            <span className="text-xs font-ui font-bold uppercase tracking-wider text-coral mb-2">
              {categorias.join(' / ')}
            </span>

            <h1 className="font-ui font-bold text-2xl md:text-3xl text-gray-800 leading-tight mb-2">
              {nombre}
            </h1>

            {/* SKU y Rating */}
            <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
              <span className="text-xs font-body text-gray-400">SKU: <strong className="text-gray-600">{displaySku}</strong></span>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= 5} />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">(5.0)</span>
              </div>
            </div>

            {/* Precios */}
            <div className="mb-6">
              <PriceDisplay regular={displayPriceRegular} sale={displayPriceOferta} size="large" />
            </div>

            {/* Descripción corta */}
            {descripcion_corta && (
              <p className="text-sm font-body text-gray-600 mb-6 bg-gray-50 p-4 rounded-2xl border-l-4 border-amber-300">
                {descripcion_corta}
              </p>
            )}

            {/* SELECTOR DE VARIACIONES (Si aplica) */}
            {hasVariations && atributos && (
              <div className="mb-6 space-y-4">
                {Object.keys(atributos).map((key) => {
                  const attr = atributos[key]
                  if (!attr.is_variation) return null
                  const values = attr.value.split('|').map(v => v.trim())
                  const selectedVal = selectedAttributes[key.toLowerCase()]

                  return (
                    <div key={key} className="space-y-1.5">
                      <span className="text-xs font-ui font-semibold text-gray-500 block">
                        Selecciona {attr.name}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => (
                          <button
                            key={val}
                            onClick={() => handleAttributeChange(attr.name, val)}
                            className={`px-3 py-1.5 border rounded-lg text-xs font-ui font-semibold transition-all
                                        ${selectedVal === val
                                          ? 'border-coral bg-coral/5 text-coral font-bold ring-2 ring-coral/20'
                                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Cantidad y Compra */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto border-t border-gray-100 pt-6">
              {/* Selector de cantidad */}
              <div className="flex items-center border border-gray-200 rounded-full h-12 w-fit px-1 bg-white">
                <button
                  onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                  disabled={isOutOfStock}
                  className="w-10 h-10 flex items-center justify-center font-ui text-lg text-gray-500 hover:text-coral transition-colors rounded-full hover:bg-gray-50 disabled:opacity-50"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-ui font-semibold text-gray-700">
                  {cantidad}
                </span>
                <button
                  onClick={() => setCantidad(prev => Math.min(displayStock, prev + 1))}
                  disabled={isOutOfStock}
                  className="w-10 h-10 flex items-center justify-center font-ui text-lg text-gray-500 hover:text-coral transition-colors rounded-full hover:bg-gray-50 disabled:opacity-50"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              {/* Botón comprar */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={`flex-1 h-12 rounded-full font-ui font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
                            ${isOutOfStock
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isAdding
                                ? 'bg-green-500 text-white scale-95'
                                : 'bg-gray-900 text-white hover:bg-coral hover:shadow-lg hover:shadow-coral/20 active:scale-95'
                            }`}
              >
                {isAdding ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Agregado al Carrito!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
                    </svg>
                    Agregar al Carrito
                  </>
                )}
              </button>
            </div>

            {/* Sellpoints de la tienda */}
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 text-xs font-body text-gray-500">
                <span className="text-xl">🛵</span>
                <span>Envíos Rápidos en Lima</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-body text-gray-500">
                <span className="text-xl">💳</span>
                <span>Pago contra entrega, QR o Yape/Plin</span>
              </div>
            </div>
          </div>
        </div>

        {/* DETALLE COMPLETO / DESCRIPCIÓN */}
        {descripcion && (
          <div className="border-t border-gray-100 pt-10 mb-16">
            <h2 className="font-ui font-bold text-lg text-gray-800 mb-4">Descripción del Producto</h2>
            <div 
              className="prose prose-sm max-w-none font-body text-gray-600 space-y-4"
              dangerouslySetInnerHTML={{ __html: descripcion }}
            />
          </div>
        )}

        {/* PRODUCTOS RELACIONADOS */}
        {relacionados.length > 0 && (
          <div className="border-t border-gray-100 pt-10">
            <h2 className="font-ui font-bold text-xl text-gray-800 mb-6 text-center">También te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relacionados.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
