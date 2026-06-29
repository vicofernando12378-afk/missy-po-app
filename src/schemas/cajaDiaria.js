import { z } from 'zod'

export const AperturaCajaSchema = z.object({
  monto: z.coerce.number().min(0, 'El monto inicial debe ser mayor o igual a 0')
})

export const MovimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']),
  monto: z.coerce.number().positive('El monto debe ser un número positivo mayor que 0'),
  concepto: z.string().min(1, 'El concepto es requerido').max(200, 'Concepto demasiado largo').trim()
})

export const CierreCajaSchema = z.object({
  monto: z.coerce.number().min(0, 'El monto final debe ser mayor o igual a 0')
})
