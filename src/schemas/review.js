import { z } from 'zod'

export const ReviewSchema = z.object({
  productoId: z.coerce.number().int().positive('ID de producto inválido'),
  productoNombre: z.string().min(1, 'El nombre del producto es requerido').trim(),
  autorNombre: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre demasiado largo').trim(),
  calificacion: z.coerce.number().int().min(1, 'La calificación mínima es 1').max(5, 'La calificación máxima es 5'),
  comentario: z.string().min(3, 'El comentario debe tener al menos 3 caracteres').max(1000, 'El comentario es demasiado largo').trim()
})
