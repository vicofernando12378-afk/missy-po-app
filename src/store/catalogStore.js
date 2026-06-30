import { create } from 'zustand'
import { obtenerProductos } from '../services'


// ============================================================
// CATALOG STORE — Zustand para caché global del catálogo
// Evita consultas redundantes a Firestore y optimiza consumo
// ============================================================

const useCatalogStore = create((set, get) => ({
  productos: [],
  isLoading: false,
  loaded: false,
  error: null,

  // Carga todo el catálogo de productos (los ~41 productos activos) de una sola vez
  fetchCatalog: async (force = false) => {
    const { loaded, isLoading } = get()
    if (loaded && !force) {
      return get().productos
    }
    if (isLoading) return []

    set({ isLoading: true, error: null })
    try {
      // Como el catálogo completo de activos es pequeño, pedimos 100 para traerlos todos en un solo query
      const { productos } = await obtenerProductos({ paginaSize: 100 })
      set({ productos, loaded: true, isLoading: false })
      return productos
    } catch (err) {
      console.error('❌ Error cargando catálogo en Zustand:', err)
      set({ error: err.message, isLoading: false })
      return []
    }
  },

  // Obtiene un producto por su slug desde la caché local
  getProductoBySlug: (slug) => {
    return get().productos.find((p) => p.slug === slug) || null
  },

  // Obtiene un producto por su ID desde la caché local
  getProductoById: (id) => {
    const idNum = Number(id)
    return get().productos.find((p) => p.id === idNum || p.id === id) || null
  },

  // Búsqueda en memoria local (0 reads a Firestore por pulsación de tecla!)
  buscarProductosLocal: (termino) => {
    if (!termino.trim()) return []
    const t = termino.toLowerCase().trim()

    return get().productos.filter((p) => {
      const matchNombre = p.nombre?.toLowerCase().includes(t)
      const matchSku = p.sku?.toLowerCase().includes(t)
      const matchCats = p.categorias?.some((c) => c.toLowerCase().includes(t))
      const matchTags = p.tags?.some((tg) => tg.toLowerCase().includes(t))
      
      // Búsqueda aproximada en el array de tags_busqueda
      const matchTagsBusqueda = p.tags_busqueda?.some((tag) => tag.includes(t))

      return matchNombre || matchSku || matchCats || matchTags || matchTagsBusqueda
    })
  }
}))

export default useCatalogStore
