import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sku: z.string().trim().default(''),
  slug: z.string().trim().default(''),
  nombre: z.string().min(1, 'El nombre del item es requerido').trim(),
  precio_unitario: z.coerce.number().int().nonnegative('El precio unitario no puede ser negativo'), // en centavos
  imagen: z.string().trim().default(''),
  ean: z.string().trim().default(''),
  variante: z.string().trim().default('default'),
  cantidad: z.coerce.number().int().min(1, 'La cantidad mínima es 1').max(999, 'Cantidad excedida'),
  _key: z.string().trim().optional(),
});

export const CartStateSchema = z.object({
  items: z.array(CartItemSchema).default([]),
  couponCode: z.string().trim().default(''),
  couponDiscount: z.coerce.number().min(0).max(100).default(0),
  subtotal: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  itemCount: z.coerce.number().int().min(0).default(0),
});
