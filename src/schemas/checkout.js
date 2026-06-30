import { z } from 'zod';

export const CheckoutSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre demasiado largo').trim(),
  apellido: z.string().min(1, 'El apellido es requerido').max(100, 'Apellido demasiado largo').trim(),
  email: z.string().email('Ingresa un correo electrónico válido').max(150, 'Correo demasiado largo').trim(),
  celular: z.string().regex(/^\d{9}$/, 'El número de celular debe tener exactamente 9 dígitos'),
  tipoDocumento: z.enum(['DNI', 'RUC']),
  numeroDocumento: z.string().trim(),
  departamento: z.string().min(1, 'Debe seleccionar un departamento'),
  distritoArequipa: z.string().trim().optional(),
  distritoNacional: z.string().trim().optional(),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(300, 'Dirección demasiado larga').trim(),
  referencia: z.string().max(200, 'Referencia demasiado larga').default('').optional(),
  nombreMascota: z.string().min(1, 'El nombre de tu mascota es requerido').max(50, 'Nombre de mascota demasiado largo').trim(),
  metodoPago: z.enum(['yape', 'tarjeta', 'contraentrega']),
  notas: z.string().max(500, 'Las notas no pueden superar los 500 caracteres').default('').optional(),
}).refine(data => {
  if (data.tipoDocumento === 'DNI') {
    return /^\d{8}$/.test(data.numeroDocumento);
  }
  if (data.tipoDocumento === 'RUC') {
    return /^\d{11}$/.test(data.numeroDocumento);
  }
  return true;
}, {
  message: 'El DNI debe tener 8 dígitos y el RUC 11 dígitos',
  path: ['numeroDocumento'],
}).refine(data => {
  if (data.departamento === 'Arequipa') {
    return !!data.distritoArequipa && data.distritoArequipa.trim().length > 0;
  }
  return true;
}, {
  message: 'Debe seleccionar un distrito para Arequipa',
  path: ['distritoArequipa'],
}).refine(data => {
  if (data.departamento !== 'Arequipa') {
    return !!data.distritoNacional && data.distritoNacional.trim().length > 0;
  }
  return true;
}, {
  message: 'Debe ingresar un distrito nacional',
  path: ['distritoNacional'],
});
