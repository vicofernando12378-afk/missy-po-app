import { useEffect, useState, useMemo } from 'react'
import ProductGrid from '../components/catalog/ProductGrid'
import useCatalogStore from '../store/catalogStore'

export default function StorePage() {
  const { productos, fetchCatalog, isLoading } = useCatalogStore()

  // Maps URL slugs from Navbar/Footer to the real Firestore category names
  const CAT_SLUG_MAP = {
    'collares':   'Collares y Articulos',
    'ropa':       'Ropitas Missy & Po',
    'ropitas':    'Ropitas Missy & Po',
    'juguetes':   'Juguetes',
    'accesorios': 'Accesorios',
    'ofertas':    'Ofertas',
  }

  // Helper: resolves a URL slug to its real category name
  const resolveSlug = (slug, cats = []) => {
    if (!slug) return 'Todos'
    const lower = slug.toLowerCase()
    if (CAT_SLUG_MAP[lower]) return CAT_SLUG_MAP[lower]
    const exact = cats.find(c => c.toLowerCase() === lower)
    if (exact) return exact
    const starts = cats.find(c => c.toLowerCase().startsWith(lower))
    return starts || (slug.charAt(0).toUpperCase() + slug.slice(1))
  }

  // Read URL params SYNCHRONOUSLY (runs before first render, avoids Astro hydration race)
  const getInitialParam = (key) => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get(key) || ''
  }

  const [catParam, setCatParam] = useState(() => getInitialParam('cat'))
  const [searchQuery, setSearchQuery] = useState(() => getInitialParam('q'))
  const [selectedCategory, setSelectedCategory] = useState(
    () => resolveSlug(getInitialParam('cat'))
  )
  const [sortBy, setSortBy] = useState('creacion')

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Categorías dinámicas a partir de los productos reales cargados en memoria
  const categorias = useMemo(() => ['Todos', ...new Set(productos.flatMap(p => p.categorias || []))], [productos])

  // Re-resolve selectedCategory when categorias loads (products may have loaded after mount)
  useEffect(() => {
    if (catParam) {
      setSelectedCategory(resolveSlug(catParam, categorias))
    }
  }, [catParam, categorias])

  // Listen for browser back/forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search)
      const cat = p.get('cat') || ''
      const q   = p.get('q')   || ''
      setSearchQuery(q)
      setCatParam(cat)
      setSelectedCategory(resolveSlug(cat, categorias))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [categorias])

  // Filtrar productos
  let filtered = [...productos]

  // 1. Filtrar por búsqueda de URL (q)
  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim()
    filtered = filtered.filter(p => 
      p.nombre?.toLowerCase().includes(q) || 
      p.sku?.toLowerCase().includes(q) ||
      p.categorias?.some(c => c.toLowerCase().includes(q))
    )
  }

  // 2. Filtrar por categoría seleccionada (usando coincidencia insensible a mayúsculas/minúsculas)
  if (selectedCategory !== 'Todos') {
    filtered = filtered.filter(p => 
      p.categorias?.some(c => c.toLowerCase() === selectedCategory.toLowerCase())
    )
  }

  // 3. Ordenar
  filtered.sort((a, b) => {
    const precioA = a.precio_oferta || a.precio_regular || 0
    const precioB = b.precio_oferta || b.precio_regular || 0

    if (sortBy === 'price-asc') {
      return precioA - precioB
    }
    if (sortBy === 'price-desc') {
      return precioB - precioA
    }
    if (sortBy === 'name-asc') {
      return a.nombre.localeCompare(b.nombre)
    }
    // Por defecto por fecha de creación (los más recientes primero)
    return new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0)
  })

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location)
      if (cat === 'Todos') {
        url.search = ''
      } else {
        url.search = `?cat=${encodeURIComponent(cat.toLowerCase())}`
      }
      window.history.pushState({}, '', url)
      setSearchQuery('')
      setCatParam(cat === 'Todos' ? '' : cat.toLowerCase())
    }
  }

  return (
    <>

      <div>
        {/* ENCABEZADO DE LA TIENDA */}
        <div className="bg-coral py-12 px-4 text-center animate-[fade-in_0.5s_ease-out]" style={{ backgroundColor: 'var(--color-coral)' }}>
          <h1 className="font-brand text-4xl text-white font-bold drop-shadow-sm">Nuestra Tienda</h1>
          <p className="text-white/95 font-body mt-2 text-sm max-w-md mx-auto">
            Explora nuestra colección curada de accesorios, ropa y juguetes premium para tus engreídos.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* BARRA DE FILTROS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
            {/* Categorías */}
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-ui font-semibold transition-all duration-200
                              ${selectedCategory === cat && !searchQuery
                                ? 'bg-coral text-white shadow-sm scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
              {searchQuery && (
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location)
                      url.search = ''
                      window.history.pushState({}, '', url)
                      setSearchQuery('')
                      setCatParam('')
                      setSelectedCategory('Todos')
                    }
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-ui font-semibold bg-amber-100 text-amber-800 flex items-center gap-1 hover:bg-amber-200 transition-colors"
                >
                  Búsqueda: "{searchQuery}" ✕
                </button>
              )}
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-body text-gray-500">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs font-ui text-gray-700 outline-none focus:border-coral transition-colors"
              >
                <option value="creacion">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre: A - Z</option>
              </select>
            </div>
          </div>

          {/* CATALOG GRID */}
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-body text-sm mt-3">Cargando productos de Missy & Po...</p>
            </div>
          ) : (
            <ProductGrid products={filtered} />
          )}
        </div>
      </div>
    </>
  )
}
