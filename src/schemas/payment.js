import { z } from 'zod'

export const YapePlinSchema = z.object({
  operacion: z.string().regex(/^\d{6,8}$/, 'El número de operación debe tener entre 6 y 8 dígitos'),
  comprobanteFile: z.any()
    .refine(
      file => {
        if (!file) return false
        return typeof file.size === 'number'
      },
      { message: 'El archivo de comprobante es requerido' }
    )
    .refine(
      file => {
        if (!file || typeof file.size !== 'number') return false
        return file.size <= 2 * 1024 * 1024
      },
      { message: 'El comprobante no debe superar los 2MB' }
    )
})
