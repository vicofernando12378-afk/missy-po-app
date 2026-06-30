import { describe, it, expect } from 'vitest';

import {
  ProductSchema,
  CheckoutSchema,
  CartItemSchema,
  CartStateSchema,
  CouponSchema,
  ShippingConfigSchema,
  AperturaCajaSchema,
  MovimientoSchema,
  CierreCajaSchema,
  ReviewSchema,
  ReclamacionSchema,
  YapePlinSchema,
} from '../index';

describe('ProductSchema', () => {
  const validProduct = {
    nombre: 'Comida Premium Perro',
    sku: 'COM-PER-01',
    precio_compra: 20,
    precio_regular: 49.99,
    precio_oferta: 39.99,
    categorias: ['comida'],
    stock: 50,
    activo: true,
    imagenes: ['https://example.com/imagen.jpg'],
    variantes: [],
    tags_busqueda: ['premium'],
  };

  it('valida un producto correcto con decimales', () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('falla si el precio de oferta es mayor o igual al regular', () => {
    const invalid = { ...validProduct, precio_oferta: 50.00 };
    const result = ProductSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('falla si no tiene nombre o categorías vacías', () => {
    const invalid = { ...validProduct, nombre: '', categorias: [] };
    const result = ProductSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('CheckoutSchema', () => {
  const validCheckout = {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@correo.com',
    celular: '987654321',
    tipoDocumento: 'DNI',
    numeroDocumento: '12345678',
    departamento: 'Arequipa',
    distritoArequipa: 'Cayma',
    direccion: 'Av. Ejército 123',
    nombreMascota: 'Loki',
    metodoPago: 'yape',
  };

  it('valida un checkout correcto en Arequipa', () => {
    const result = CheckoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it('valida un checkout correcto nacional', () => {
    const result = CheckoutSchema.safeParse({
      ...validCheckout,
      departamento: 'Lima',
      distritoArequipa: '',
      distritoNacional: 'Miraflores',
    });
    expect(result.success).toBe(true);
  });

  it('falla si el celular no tiene 9 dígitos', () => {
    const invalid = { ...validCheckout, celular: '98765432' };
    const result = CheckoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('falla si el DNI no tiene 8 dígitos', () => {
    const invalid = { ...validCheckout, numeroDocumento: '1234567' };
    const result = CheckoutSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('CartItemSchema y CartStateSchema', () => {
  const validItem = {
    id: 123,
    sku: 'SKU-01',
    slug: 'slug-01',
    nombre: 'Juguete Cuerda',
    precio_unitario: 2550, // centavos
    imagen: 'https://example.com/cuerda.jpg',
    variante: 'rojo',
    cantidad: 2,
  };

  it('valida un item de carrito con precio entero', () => {
    const result = CartItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('falla si la cantidad es menor a 1', () => {
    const invalid = { ...validItem, cantidad: 0 };
    const result = CartItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('valida el estado completo del carrito', () => {
    const state = {
      items: [validItem],
      couponCode: 'MISSY10',
      couponDiscount: 10,
      subtotal: 5100,
      total: 4590,
      itemCount: 2,
    };
    const result = CartStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });
});

describe('ReclamacionSchema', () => {
  const validReclamacion = {
    nombre: 'María',
    apellido: 'Gómez',
    tipoDoc: 'PASAPORTE',
    numDoc: 'PAS12345',
    telefono: '987654321',
    email: 'maria@gmail.com',
    departamento: 'Arequipa',
    provincia: 'Arequipa',
    distrito: 'Yanahuara',
    tipoBien: 'Producto',
    montoReclamado: 120.50,
    descripcionBien: 'Comida vencida de perro de 15kg',
    tipoReclamo: 'Reclamo',
    detalleReclamo: 'El producto comprado tenía fecha de vencimiento pasada por un mes.',
    autorizoNotif: true,
  };

  it('valida una reclamación con Pasaporte alfanumérico', () => {
    const result = ReclamacionSchema.safeParse(validReclamacion);
    expect(result.success).toBe(true);
  });

  it('falla si no se autorizan las notificaciones', () => {
    const invalid = { ...validReclamacion, autorizoNotif: false };
    const result = ReclamacionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('YapePlinSchema', () => {
  it('valida una operación correcta con archivo válido', () => {
    const payload = {
      operacion: '1234567',
      comprobanteFile: { size: 1024 * 1024 }, // 1MB mock
    };
    const result = YapePlinSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('falla si el archivo es mayor a 2MB', () => {
    const payload = {
      operacion: '1234567',
      comprobanteFile: { size: 3 * 1024 * 1024 }, // 3MB mock
    };
    const result = YapePlinSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
