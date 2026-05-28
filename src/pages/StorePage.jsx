import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ProductGrid from '../components/catalog/ProductGrid'
import useCatalogStore from '../store/catalogStore'

export default function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { productos, fetchCatalog, isLoading } = useCatalogStore()
  
  // Estados de filtros
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState('creacion') // 'creacion', 'price-asc', 'price-desc', 'name-asc'

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Obtener query de búsqueda de la URL (si viene del buscador predictivo o de navegación)
  const searchQuery = searchParams.get('q') || ''

  // Categorías dinámicas a partir de los productos reales cargados en memoria
  const categorias = ['Todos', ...new Set(productos.flatMap(p => p.categorias || []))]

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

  // 2. Filtrar por categoría seleccionada
  if (selectedCategory !== 'Todos') {
    filtered = filtered.filter(p => p.categorias?.includes(selectedCategory))
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
    // Limpiar búsqueda si se cambia de categoría para una mejor experiencia de navegación
    if (searchQuery) {
      setSearchParams({})
    }
  }

  return (
    <>
      <Helmet>
        <title>Tienda | Missy & Po Pet Shop</title>
      </Helmet>

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
                  onClick={() => setSearchParams({})}
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
