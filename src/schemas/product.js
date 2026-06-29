import { z } from 'zod'

export const VarianteSchema = z.object({
  id: z.coerce.number().int(),
  sku: z.string().min(1, 'El SKU de la variante es requerido').trim(),
  atributos: z.record(z.string(), z.string()),
  precio_unitario: z.coerce.number().min(0, 'El precio de variante no puede ser negativo').nullable().default(null),
  stock: z.coerce.number().int().min(0, 'El stock de variante no puede ser negativo')
})

export const ProductSchema = z.object({
  nombre: z.string().min(1, 'El nombre del producto es requerido').max(200, 'Nombre demasiado largo').trim(),
  slug: z.string().max(200, 'Slug demasiado largo').trim().optional(),
  sku: z.string().min(1, 'El SKU es requerido').max(50, 'SKU demasiado largo').trim().toUpperCase(),
  descripcion: z.string().max(2000, 'Descripción demasiado larga').default(''),
  precio_compra: z.coerce.number().min(0, 'El precio de compra debe ser mayor o igual a 0'),
  precio_regular: z.coerce.number().min(0, 'El precio regular debe ser mayor o igual a 0'),
  precio_oferta: z.coerce.number().min(0, 'El precio de oferta debe ser mayor o igual a 0').nullable().default(null),
  categorias: z.array(z.string()).min(1, 'Debe seleccionar al menos una categoría'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  activo: z.boolean().default(true),
  imagenes: z.array(z.string().url('URL de imagen inválida')).min(1, 'Debe incluir al menos una imagen'),
  variantes: z.array(VarianteSchema).default([]),
  tags_busqueda: z.array(z.string()).default([])
}).refine(data => {
  if (data.precio_oferta !== null && data.precio_oferta !== undefined) {
    return data.precio_oferta < data.precio_regular
  }
  return true
}, {
  message: 'El precio de oferta debe ser menor al precio regular',
  path: ['precio_oferta']
})
