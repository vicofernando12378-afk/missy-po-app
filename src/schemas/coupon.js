import { z } from 'zod'

export const CouponSchema = z.object({
  codigo: z.string().min(1, 'El código de cupón es requerido').max(20, 'Código demasiado largo').trim().toUpperCase(),
  descuento: z.coerce.number().int().min(1, 'El descuento mínimo es 1%').max(100, 'El descuento máximo es 100%'),
  compraMinima: z.coerce.number().min(0, 'La compra mínima no puede ser negativa').default(0),
  activo: z.boolean().default(true),
  expiracion: z.string().trim().nullable().optional()
})
