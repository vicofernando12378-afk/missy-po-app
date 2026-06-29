/**
 * Valida data con un schema Zod. Si falla, retorna { ok: false, error: string }.
 * Si pasa, retorna { ok: true, data: parsed }.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data)
  if (result.success) {
    return { ok: true, data: result.data }
  }
  const firstIssue = result.error.issues[0]
  return { ok: false, error: firstIssue?.message || 'Datos inválidos' }
}
