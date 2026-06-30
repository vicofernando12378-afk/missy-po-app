import { useState } from 'react';

import { LIMA_REGIONS, AREQUIPA_DISTRICTS } from '../../data/locations';

export default function AddressForm({ initialData, onSave, onCancel }) {
  const [alias, setAlias] = useState(initialData?.alias || '');
  const [departamento, setDepartamento] = useState(initialData?.departamento || 'Arequipa');
  const [distrito, setDistrito] = useState(initialData?.distrito || '');
  const [direccion, setDireccion] = useState(initialData?.direccion || '');
  const [referencia, setReferencia] = useState(initialData?.referencia || '');
  const [esDefault, setEsDefault] = useState(initialData?.es_default || false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!alias.trim()) { setError('Ingresa un alias para la dirección'); return; }
    if (!distrito.trim()) { setError('Selecciona un distrito'); return; }
    if (!direccion.trim() || direccion.trim().length < 5) { setError('La dirección debe tener al menos 5 caracteres'); return; }

    onSave({
      alias: alias.trim(),
      departamento,
      distrito: distrito.trim(),
      direccion: direccion.trim(),
      referencia: referencia.trim(),
      es_default: esDefault,
    });
  };

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
      <h3 className="font-ui font-bold text-base mb-4" style={{ color: 'var(--color-text-dark)' }}>
        {initialData ? 'Editar Dirección' : 'Nueva Dirección'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Alias</label>
          <input type="text" value={alias} onChange={e => setAlias(e.target.value)}
                 placeholder="Casa, Oficina, etc."
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Departamento</label>
            <select value={departamento} onChange={e => { setDepartamento(e.target.value); setDistrito(''); }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm">
              {LIMA_REGIONS.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Distrito</label>
            {departamento === 'Arequipa' ? (
              <select value={distrito} onChange={e => setDistrito(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm">
                <option value="">Seleccionar</option>
                {AREQUIPA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input type="text" value={distrito} onChange={e => setDistrito(e.target.value)}
                     placeholder="Tu distrito"
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Dirección</label>
          <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)}
                 placeholder="Av. Principal 123, urbanización..."
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Referencia (opcional)</label>
          <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)}
                 placeholder="Frente al parque, al lado de..."
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={esDefault} onChange={e => setEsDefault(e.target.checked)}
                 className="w-4 h-4 rounded text-red-500 focus:ring-red-200" />
          <span className="text-sm font-ui font-medium" style={{ color: 'var(--color-text-dark)' }}>
            Usar como dirección predeterminada
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-ui font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}>
            {initialData ? 'Guardar Cambios' : 'Agregar Dirección'}
          </button>
          <button type="button" onClick={onCancel}
                  className="px-6 py-3 rounded-xl text-sm font-ui font-bold border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-gray)' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
