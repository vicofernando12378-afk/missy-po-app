import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================
// CART STORE — Zustand con persistencia en localStorage
// Missy & Po Pet Shop
// ============================================================

const useCartStore = create(
  persist(
    (set, get) => ({
      // STATE
      items: [],          // [{ id, slug, nombre, precio_unitario, imagen, cantidad, variante }]
      couponCode: '',
      couponDiscount: 0,  // porcentaje (ej: 10 = 10%)
      isDrawerOpen: false,

      // ─── GETTERS ───────────────────────────────────────────

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.cantidad, 0)
      },

      get subtotal() {
        return get().items.reduce(
          (sum, item) => sum + item.precio_unitario * item.cantidad,
          0
        )
      },

      get total() {
        const { subtotal, couponDiscount } = get()
        return subtotal - (subtotal * couponDiscount) / 100
      },

      // ─── ACCIONES ──────────────────────────────────────────

      addItem: (product) => {
        const { items } = get()
        const key = `${product.id}-${product.variante || 'default'}`
        const existing = items.find(
          (i) => i.id === product.id && i.variante === (product.variante || 'default')
        )

        if (existing) {
          set({
            items: items.map((i) =>
              i._key === key
                ? { ...i, cantidad: i.cantidad + (product.cantidad || 1) }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                _key: key,
                id: product.id,
                sku: product.sku || '',
                slug: product.slug || '',
                nombre: product.nombre,
                precio_unitario: Math.round((product.precio_oferta || product.precio_regular || 0) * 100),
                imagen: product.imagen || '',
                ean: product.ean || '',
                variante: product.variante || 'default',
                cantidad: product.cantidad || 1,
              },
            ],
          })
        }
      },

      removeItem: (id, variante = 'default') => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.variante === variante)
          ),
        })
      },

      updateQuantity: (id, variante = 'default', cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(id, variante)
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id && i.variante === variante
              ? { ...i, cantidad }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0 }),

      // ─── CUPÓN ─────────────────────────────────────────────

      applyCoupon: async (code) => {
        const uppercaseCode = code.toUpperCase().trim()
        try {
          const { doc, getDoc } = await import('firebase/firestore')
          const { db } = await import('../services/firebase')
          
          const docRef = doc(db, 'myp_cupones', uppercaseCode)
          const snap = await getDoc(docRef)
          
          if (snap.exists()) {
            const data = snap.data()
            if (data.activo === false) {
              return { success: false, message: 'Este cupón está inactivo' }
            }
            if (data.expiracion && new Date(data.expiracion) < new Date()) {
              return { success: false, message: 'Este cupón ha expirado' }
            }
            set({ couponCode: uppercaseCode, couponDiscount: data.descuento || 0 })
            return { success: true, discount: data.descuento }
          }
        } catch (e) {
          console.warn('⚠️ Error al consultar cupón en Firestore. Usando fallback local:', e)
        }

        // Fallback local
        const mockCoupons = {
          'BIENVENIDO10': 10,
          'MISSY15': 15,
          'MASCOTA20': 20,
        }
        const discount = mockCoupons[uppercaseCode]
        if (discount) {
          set({ couponCode: uppercaseCode, couponDiscount: discount })
          return { success: true, discount }
        }
        return { success: false, message: 'Cupón no válido' }
      },

      removeCoupon: () => set({ couponCode: '', couponDiscount: 0 }),

      // ─── UI ────────────────────────────────────────────────

      openDrawer:  () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
    }),
    {
      name: 'myp-cart',           // localStorage key con prefijo myp_
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
)

export default useCartStore
