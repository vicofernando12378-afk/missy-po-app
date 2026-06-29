import { z } from 'zod'

export const ShippingConfigSchema = z.object({
  arequipaFee: z.coerce.number().min(0, 'La tarifa de Arequipa debe ser mayor o igual a 0'),
  arequipaFreeLimit: z.coerce.number().min(0, 'El límite de envío gratuito de Arequipa debe ser mayor o igual a 0'),
  nationalFee: z.coerce.number().min(0, 'La tarifa nacional debe ser mayor o igual a 0'),
  nationalFreeLimit: z.coerce.number().min(0, 'El límite de envío gratuito nacional debe ser mayor o igual a 0')
})
