import { useEffect, useRef } from 'react'
import useSearchStore from '../../store/searchStore'
import useCatalogStore from '../../store/catalogStore'
import useDebounce from '../../hooks/useDebounce'

// ============================================================
// LIVE SEARCH — Buscador predictivo 2 columnas
// Especificación: MISSY-PO-CONTEXT.md §2
// ============================================================

const SearchSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

// Resalta el fragmento que coincide con la búsqueda
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <span>{text}</span>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-transparent text-coral font-bold not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export default function LiveSearch({ inputRef: externalInputRef }) {
  const panelRef = useRef(null)
  const internalRef = useRef(null)
  const inputRef = externalInputRef || internalRef

  const {
    query, results, isLoading, isOpen, selectedIndex,
    setQuery, setResults, setLoading, setError,
    openSearch, closeSearch, moveUp, moveDown, getSelectedResult,
  } = useSearchStore()

  const { fetchCatalog, buscarProductosLocal } = useCatalogStore()
  const debouncedQuery = useDebounce(query, 300)

  // ── Cargar catálogo al montar el buscador ──────────────────
  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // ── Ejecutar búsqueda local en memoria (0 lecturas a Firestore) ──
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const locales = buscarProductosLocal(debouncedQuery)
      setResults(locales)
    } catch (err) {
      setError('Error al buscar')
    }
  }, [debouncedQuery, buscarProductosLocal])

  // ── Cerrar al hacer clic fuera ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        closeSearch()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Navegación por teclado ─────────────────────────────────
  const handleKeyDown = (e) => {
    if (!isOpen) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); moveDown(); break
      case 'ArrowUp':
        e.preventDefault(); moveUp(); break
      case 'Enter': {
        e.preventDefault()
        const selected = getSelectedResult()
        if (selected) {
          window.location.href = `/producto/${selected.slug}`
          closeSearch()
        } else if (query.trim()) {
          window.location.href = `/tienda?q=${encodeURIComponent(query.trim())}`
          closeSearch()
        }
        break
      }
      case 'Escape':
        closeSearch(); break
    }
  }

  const showPanel = isOpen && query.length >= 2
  const previewItem = results[selectedIndex >= 0 ? selectedIndex : 0] || null

  return (
    <div className="relative flex-1 max-w-xl" id="live-search-container">
      {/* ── INPUT ──────────────────────────────────────────── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {isLoading
            ? <SearchSpinner />
            : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )
          }
        </span>

        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          placeholder="¡HOLA!!! ¿Qué Buscas?"
          autoComplete="off"
          className="w-full h-10 pl-9 pr-4 rounded-full border border-amber-300
                     bg-white text-sm font-body text-gray-700 placeholder:text-gray-400
                     focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200
                     transition-all duration-200"
          onChange={(e) => { setQuery(e.target.value); if (e.target.value.length >= 2) openSearch() }}
          onFocus={() => { if (query.length >= 2) openSearch() }}
          onKeyDown={handleKeyDown}
          aria-label="Buscar productos"
          aria-expanded={showPanel}
          aria-haspopup="listbox"
        />

        {query && (
          <button
            onClick={closeSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── PANEL DE RESULTADOS ────────────────────────────── */}
      {showPanel && (
        <div
          ref={panelRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-popup
                     border border-gray-100 overflow-hidden z-popup
                     animate-[fade-in-down_0.15s_ease-out]"
          style={{ minWidth: '520px', maxHeight: '480px' }}
          role="listbox"
          id="search-results-panel"
        >
          {results.length === 0 && !isLoading ? (
            // Sin resultados
            <div className="p-6 text-center">
              <span className="text-3xl mb-2 block">🐾</span>
              <p className="text-gray-500 font-body text-sm">
                No encontramos resultados para <strong>"{query}"</strong>
              </p>
              <p className="text-gray-400 text-xs mt-1">Intenta con otro término</p>
            </div>
          ) : (
            <div className="flex" style={{ height: '400px' }}>

              {/* ─ COLUMNA IZQUIERDA — Lista ─────────────── */}
              <div className="w-[42%] border-r border-gray-100 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-50">
                  <span className="text-[10px] font-ui font-semibold text-gray-400 uppercase tracking-wider">
                    {results.length} resultado{results.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {results.map((item, idx) => {
                  const precio = item.precio_oferta || item.precio_regular
                  const isSelected = idx === selectedIndex
                  return (
                    <a
                      key={item.id}
                      href={`/producto/${item.slug}`}
                      onClick={closeSearch}
                      className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors
                                  ${isSelected ? 'bg-salmon/30' : 'hover:bg-gray-50'}`}
                      role="option"
                      aria-selected={isSelected}
                      id={`search-result-${idx}`}
                      onMouseEnter={() => useSearchStore.setState({ selectedIndex: idx })}
                    >
                      {/* Miniatura */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {item.imagen
                          ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                          : <span className="w-full h-full flex items-center justify-center text-xl">🐾</span>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-ui font-semibold text-coral leading-tight line-clamp-2">
                          <Highlight text={item.nombre} query={query} />
                        </p>
                        <p className="text-[10px] text-gray-400 font-body mt-0.5">({item.sku})</p>
                        <p className="text-[10px] text-gray-500 font-body line-clamp-1 mt-0.5">
                          {item.descripcion}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {item.precio_oferta && (
                            <span className="text-[10px] text-gray-400 line-through">
                              S/ {(item.precio_regular / 100).toFixed(2)}
                            </span>
                          )}
                          <span className="text-xs font-bold text-green-600">
                            S/ {(precio / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </a>
                  )
                })}

                {/* Ver todos */}
                <a
                  href={`/tienda?q=${encodeURIComponent(query)}`}
                  onClick={closeSearch}
                  className="block px-3 py-3 text-center text-xs font-ui font-semibold
                             text-coral hover:bg-coral/5 border-t border-gray-100 transition-colors"
                  id="search-view-all"
                >
                  Ver todos los resultados →
                </a>
              </div>

              {/* ─ COLUMNA DERECHA — Preview ─────────────── */}
              <div className="flex-1 p-4 overflow-y-auto">
                {previewItem ? (
                  <div className="h-full flex flex-col">
                    {/* Imagen grande */}
                    <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 flex-shrink-0">
                      {previewItem.imagen
                        ? <img src={previewItem.imagen} alt={previewItem.nombre}
                            className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
                      }
                    </div>

                    <h3 className="font-ui font-bold text-sm text-gray-800 leading-tight mb-1">
                      {previewItem.nombre}
                    </h3>

                    {/* Precio */}
                    <div className="flex items-center gap-2 mb-2">
                      {previewItem.precio_oferta && (
                        <span className="text-xs text-gray-400 line-through">
                          S/ {(previewItem.precio_regular / 100).toFixed(2)}
                        </span>
                      )}
                      <span className="text-base font-bold text-green-600">
                        S/ {((previewItem.precio_oferta || previewItem.precio_regular) / 100).toFixed(2)}
                      </span>
                    </div>

                    {/* Descripción */}
                    <p className="text-xs font-body text-gray-500 mb-2 line-clamp-3">
                      {previewItem.descripcion}
                    </p>

                    {/* Stock */}
                    <p className="text-[10px] text-gray-400 font-body mb-3">
                      {previewItem.stock > 0
                        ? `${previewItem.stock} en stock`
                        : 'Agotado'}
                    </p>

                    {/* Botón */}
                    <a
                      href={`/producto/${previewItem.slug}`}
                      onClick={closeSearch}
                      className="mt-auto w-full py-2.5 rounded-full bg-coral text-white
                                 font-ui font-semibold text-sm text-center
                                 hover:bg-coral-dark transition-colors"
                      id="search-preview-cta"
                    >
                      Ver Producto
                    </a>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-300">
                    <div className="text-center">
                      <span className="text-4xl block mb-2">🔍</span>
                      <p className="text-xs font-body">Pasa el cursor sobre un resultado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
