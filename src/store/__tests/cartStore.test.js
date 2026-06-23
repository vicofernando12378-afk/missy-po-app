import { describe, it, expect, beforeEach, vi } from 'vitest';
import useCartStore from '../cartStore';

// Mock de firebase
vi.mock('../../services/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn()
}));

describe('Cart Store (myp-cart)', () => {
  beforeEach(() => {
    // Limpiar el store antes de cada test
    useCartStore.getState().clearCart();
    vi.clearAllMocks();
  });

  it('should initialize with an empty cart', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.itemCount).toBe(0);
    expect(state.subtotal).toBe(0);
    expect(state.total).toBe(0);
  });

  it('should add a new product to the cart and calculate totals', () => {
    const product = {
      id: 'prod-1',
      sku: 'SKU1',
      slug: 'arnes-lou',
      nombre: 'Arnés Lou',
      precio_regular: 30, // en soles
      precio_oferta: 25,
      imagen: 'img1.jpg',
      variante: 'Rosa talla S',
      cantidad: 1,
    };

    useCartStore.getState().addItem(product);
    
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('prod-1');
    expect(state.items[0].precio_unitario).toBe(2500); // 25 soles * 100 céntimos
    expect(state.itemCount).toBe(1);
    expect(state.subtotal).toBe(2500);
    expect(state.total).toBe(2500);
  });

  it('should increase quantity when adding the same product and variant', () => {
    const product = {
      id: 'prod-1',
      sku: 'SKU1',
      nombre: 'Arnés Lou',
      precio_regular: 30,
      precio_oferta: 25,
      variante: 'Rosa talla S',
      cantidad: 1,
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem({ ...product, cantidad: 2 });

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].cantidad).toBe(3);
    expect(state.itemCount).toBe(3);
    expect(state.subtotal).toBe(7500); // 3 * 2500
    expect(state.total).toBe(7500);
  });

  it('should separate items with same id but different variants', () => {
    const product1 = {
      id: 'prod-1',
      nombre: 'Arnés Lou',
      precio_oferta: 25,
      variante: 'Rosa talla S',
      cantidad: 1,
    };

    const product2 = {
      id: 'prod-1',
      nombre: 'Arnés Lou',
      precio_oferta: 25,
      variante: 'Azul talla M',
      cantidad: 1,
    };

    useCartStore.getState().addItem(product1);
    useCartStore.getState().addItem(product2);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.itemCount).toBe(2);
    expect(state.subtotal).toBe(5000);
  });

  it('should update quantity and recalculate totals', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Arnés Lou',
      precio_oferta: 25,
      variante: 'default',
      cantidad: 1,
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity('prod-1', 'default', 4);

    const state = useCartStore.getState();
    expect(state.items[0].cantidad).toBe(4);
    expect(state.subtotal).toBe(10000);
  });

  it('should remove item when quantity is set to 0 or less', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Arnés Lou',
      precio_oferta: 25,
      variante: 'default',
      cantidad: 2,
    };

    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity('prod-1', 'default', 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.subtotal).toBe(0);
  });

  it('should apply mock coupons correctly and recalculate total', async () => {
    const product = {
      id: 'prod-1',
      nombre: 'Arnés Lou',
      precio_oferta: 20, // 2000 céntimos
      variante: 'default',
      cantidad: 1,
    };

    useCartStore.getState().addItem(product);
    
    // BIENVENIDO10 da 10%
    const res = await useCartStore.getState().applyCoupon('BIENVENIDO10');
    
    expect(res.success).toBe(true);
    expect(res.discount).toBe(10);
    
    const state = useCartStore.getState();
    expect(state.couponCode).toBe('BIENVENIDO10');
    expect(state.couponDiscount).toBe(10);
    expect(state.subtotal).toBe(2000);
    expect(state.total).toBe(1800); // 2000 - 10%
  });

  it('should fail with invalid coupons', async () => {
    const res = await useCartStore.getState().applyCoupon('INVALID-CUPON');
    expect(res.success).toBe(false);
  });
});
