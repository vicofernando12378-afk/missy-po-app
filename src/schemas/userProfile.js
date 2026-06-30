import { z } from 'zod'

export const AddressSchema = z.object({
  alias: z.string().min(1, 'El alias es requerido').max(30, 'Alias demasiado largo').trim(),
  departamento: z.string().min(1, 'El departamento es requerido'),
  distrito: z.string().min(1, 'El distrito es requerido').trim(),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(300, 'Dirección demasiado larga').trim(),
  referencia: z.string().max(200, 'Referencia demasiado larga').default('').optional(),
  es_default: z.boolean().default(false)
})

export const PetSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la mascota es requerido').max(50, 'Nombre demasiado largo').trim(),
  especie: z.enum(['perro', 'gato', 'otro'], { required_error: 'Selecciona una especie' }),
  raza: z.string().max(50, 'Raza demasiado larga').default('').optional(),
  fecha_nacimiento: z.string().default('').optional(),
  foto_url: z.string().url('URL inválida').or(z.literal('')).default('').optional()
})

export const UserPreferencesSchema = z.object({
  notificaciones_email: z.boolean().default(true),
  notificaciones_whatsapp: z.boolean().default(false),
  idioma: z.enum(['es', 'en']).default('es')
})

export const UserProfileSchema = z.object({
  uid: z.string().min(1, 'El UID es requerido'),
  email: z.string().email('Correo electrónico inválido').max(150).trim(),
  nombre: z.string().min(1, 'El nombre es requerido').max(100).trim(),
  apellido: z.string().min(1, 'El apellido es requerido').max(100).trim(),
  telefono: z.string().regex(/^\d{9}$/, 'El celular debe tener 9 dígitos').optional().or(z.literal('')),
  documento_tipo: z.enum(['DNI', 'RUC']).optional(),
  documento_numero: z.string().max(15).trim().optional(),
  direcciones: z.array(AddressSchema).max(5, 'Máximo 5 direcciones').default([]),
  mascotas: z.array(PetSchema).max(5, 'Máximo 5 mascotas').default([]),
  preferencias: UserPreferencesSchema.default({})
})

export const AddressFormSchema = AddressSchema
export const PetFormSchema = PetSchema.omit({ foto_url: true })
