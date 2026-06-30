import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CartStateSchema } from '../schemas';
import { validarCupon } from '../services';



// ============================================================
// CART STORE — Zustand con persistencia en localStorage
// Missy & Po Pet Shop
// ============================================================

const recalculateTotals = (items, couponDiscount) => {
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotal = items.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);
  const total = subtotal - (subtotal * couponDiscount) / 100;
  return { itemCount, subtotal, total };
};

const useCartStore = create(
  persist(
    (set, get) => ({
      // STATE
      items: [],          // [{ id, slug, nombre, precio_unitario, imagen, cantidad, variante }]
      couponCode: '',
      couponDiscount: 0,  // porcentaje (ej: 10 = 10%)
      subtotal: 0,
      total: 0,
      itemCount: 0,
      isDrawerOpen: false,

      // ─── ACCIONES ──────────────────────────────────────────

      addItem: (product) => {
        const { items, couponDiscount } = get();
        const key = `${product.id}-${product.variante || 'default'}`;
        const existing = items.find(
          (i) => i.id === product.id && i.variante === (product.variante || 'default'),
        );

        let newItems;
        if (existing) {
          // FIX: Usar la misma lógica de búsqueda (id + variante) y NO _key,
          // para evitar duplicados cuando hay items persistidos sin _key
          newItems = items.map((i) =>
            i.id === product.id && i.variante === (product.variante || 'default')
              ? { ...i, cantidad: i.cantidad + (product.cantidad || 1) }
              : i,
          );
        } else {
          newItems = [
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
          ];
        }

        set({
          items: newItems,
          ...recalculateTotals(newItems, couponDiscount),
        });
      },

      removeItem: (id, variante = 'default') => {
        const { items, couponDiscount } = get();
        const newItems = items.filter(
          (i) => !(i.id === id && i.variante === variante),
        );
        set({
          items: newItems,
          ...recalculateTotals(newItems, couponDiscount),
        });
      },

      updateQuantity: (id, variante = 'default', cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(id, variante);
          return;
        }
        const { items, couponDiscount } = get();
        const newItems = items.map((i) =>
          i.id === id && i.variante === variante
            ? { ...i, cantidad }
            : i,
        );
        set({
          items: newItems,
          ...recalculateTotals(newItems, couponDiscount),
        });
      },

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0, subtotal: 0, total: 0, itemCount: 0 }),

      // ─── CUPÓN ─────────────────────────────────────────────
      applyCoupon: async (code) => {
        const uppercaseCode = code.toUpperCase().trim();
        const montoCompraSoles = get().subtotal / 100;
        const res = await validarCupon(uppercaseCode, montoCompraSoles);
        
        if (res.success) {
          const discount = res.discount;
          set({
            couponCode: uppercaseCode,
            couponDiscount: discount,
            ...recalculateTotals(get().items, discount),
          });
          return { success: true, discount };
        }
        
        return { success: false, message: res.message || 'Cupón no válido' };
      },

      removeCoupon: () => {
        set({
          couponCode: '',
          couponDiscount: 0,
          ...recalculateTotals(get().items, 0),
        });
      },

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
        subtotal: state.subtotal,
        total: state.total,
        itemCount: state.itemCount,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState;
        const result = CartStateSchema.safeParse(persistedState);
        if (result.success) {
          return { ...currentState, ...result.data };
        }
        console.warn('Los datos del carrito persistidos están corruptos, usando defaults:', result.error);
        return currentState;
      },
    },
  ),
);

export default useCartStore;
