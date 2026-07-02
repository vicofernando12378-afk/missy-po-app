import { z } from 'zod';

export const ReclamacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Nombre demasiado largo').trim(),
  apellido: z.string().min(1, 'El apellido es requerido').max(100, 'Apellido demasiado largo').trim(),
  tipoDoc: z.enum(['DNI', 'CE', 'RUC', 'PASAPORTE']),
  numDoc: z.string().trim(),
  telefono: z.string().regex(/^\d{7,9}$/, 'El teléfono debe tener entre 7 y 9 dígitos'),
  email: z.string().email('Ingresa un correo electrónico válido').trim(),
  departamento: z.string().min(1, 'El departamento es requerido').trim(),
  provincia: z.string().min(1, 'La provincia es requerida').trim(),
  distrito: z.string().min(1, 'El distrito es requerido').trim(),
  tipoBien: z.enum(['Producto', 'Servicio']),
  montoReclamado: z.coerce.number().min(0, 'El monto reclamado debe ser mayor o igual a 0'),
  descripcionBien: z.string().min(10, 'La descripción del bien debe tener al menos 10 caracteres').max(500, 'La descripción del bien no puede superar los 500 caracteres').trim(),
  tipoReclamo: z.enum(['Reclamo', 'Queja']),
  detalleReclamo: z.string().min(10, 'El detalle del reclamo debe tener al menos 10 caracteres').max(1000, 'El detalle no puede superar los 1000 caracteres').trim(),
  pedidoConsumidor: z.string().max(200, 'El campo de pedido no puede superar los 200 caracteres').default('').optional(),
  autorizoNotif: z.literal(true, {
    errorMap: () => ({ message: 'Debes autorizar el envío de notificaciones para proceder' }),
  }),
  evidencias: z.array(z.object({
    url: z.string().url('URL de evidencia inválida'),
    nombre: z.string().max(200).optional(),
  })).max(5, 'Máximo 5 evidencias').optional().default([]),
  prueba_conformidad: z.object({
    tipo: z.enum(['whatsapp', 'foto_entrega', 'verbal']),
    url: z.string().url().optional().nullable(),
    observaciones: z.string().max(500).optional().nullable(),
    fecha: z.string().optional(),
  }).optional().nullable(),
}).refine(data => {
  if (data.tipoDoc === 'DNI') {
    return /^\d{8}$/.test(data.numDoc);
  }
  if (data.tipoDoc === 'RUC') {
    return /^\d{11}$/.test(data.numDoc);
  }
  if (data.tipoDoc === 'CE') {
    return /^[a-zA-Z0-9]{9,12}$/.test(data.numDoc);
  }
  if (data.tipoDoc === 'PASAPORTE') {
    return /^[a-zA-Z0-9]{5,12}$/.test(data.numDoc);
  }
  return true;
}, {
  message: 'El número de documento es inválido para el tipo seleccionado',
  path: ['numDoc'],
});
