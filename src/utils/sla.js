// ── SLA: DÍAS HÁBILES (Lun-Vie) ────────────────────────────
export const SLA_DIAS_HABILES = 15;

export function contarDiasHabiles(desde, hasta) {
  let count = 0;
  const fecha = new Date(desde);
  while (fecha < hasta) {
    const day = fecha.getDay();
    if (day !== 0 && day !== 6) count++;
    fecha.setDate(fecha.getDate() + 1);
  }
  return count;
}

export function calcularSLA(creadoEn, estado) {
  if (estado === 'cerrado' || estado === 'respondido') {
    return { tipo: 'cumplido', diasTranscurridos: 0, diasRestantes: 0, label: 'Cumplido' };
  }
  const ahora = new Date();
  const transcurridos = contarDiasHabiles(creadoEn, ahora);
  const restantes = SLA_DIAS_HABILES - transcurridos;
  let tipo;
  if (restantes <= 0) tipo = 'vencido';
  else if (restantes <= 3) tipo = 'critico';
  else if (restantes <= 5) tipo = 'por_vencer';
  else tipo = 'al_dia';
  return { tipo, diasTranscurridos: transcurridos, diasRestantes: restantes, label: tipo };
}

export const SLA_CFG = {
  al_dia:     { label: 'Al día',         bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✅' },
  por_vencer: { label: 'Por vencer',      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: '⚠️' },
  critico:    { label: 'Crítico',         bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: '🔶' },
  vencido:    { label: 'Vencido',         bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: '🚨' },
  cumplido:   { label: 'SLA Cumplido',    bg: 'bg-gray-100',   text: 'text-gray-500',    border: 'border-gray-200',    icon: '✓' },
};
