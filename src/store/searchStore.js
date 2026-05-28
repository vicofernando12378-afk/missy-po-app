import { create } from 'zustand'

// ============================================================
// SEARCH STORE — Zustand para LiveSearch
// Missy & Po Pet Shop
// ============================================================

const useSearchStore = create((set, get) => ({
  // STATE
  query: '',
  results: [],
  isLoading: false,
  isOpen: false,
  selectedIndex: -1,    // Para navegación con teclado
  error: null,

  // ─── ACCIONES ──────────────────────────────────────────────

  setQuery: (query) => set({ query, selectedIndex: -1 }),

  setResults: (results) => set({ results, isLoading: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  openSearch: () => set({ isOpen: true }),

  closeSearch: () => set({
    isOpen: false,
    query: '',
    results: [],
    selectedIndex: -1,
    error: null,
  }),

  // Navegación con teclado
  moveUp: () => {
    const { selectedIndex, results } = get()
    set({ selectedIndex: Math.max(-1, selectedIndex - 1) })
  },

  moveDown: () => {
    const { selectedIndex, results } = get()
    set({ selectedIndex: Math.min(results.length - 1, selectedIndex + 1) })
  },

  getSelectedResult: () => {
    const { results, selectedIndex } = get()
    return selectedIndex >= 0 ? results[selectedIndex] : null
  },
}))

export default useSearchStore
