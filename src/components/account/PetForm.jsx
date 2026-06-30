import { useState } from 'react';

export default function PetForm({ initialData, onSave, onCancel }) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [especie, setEspecie] = useState(initialData?.especie || 'perro');
  const [raza, setRaza] = useState(initialData?.raza || '');
  const [fechaNacimiento, setFechaNacimiento] = useState(initialData?.fecha_nacimiento || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) { setError('Ingresa el nombre de tu mascota'); return; }

    onSave({
      nombre: nombre.trim(),
      especie,
      raza: raza.trim(),
      fecha_nacimiento: fechaNacimiento,
    });
  };

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
      <h3 className="font-ui font-bold text-base mb-4" style={{ color: 'var(--color-text-dark)' }}>
        {initialData ? 'Editar Mascota' : 'Nueva Mascota'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Nombre</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                 placeholder="Ej: Missy"
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Especie</label>
          <div className="flex gap-3">
            {[
              { value: 'perro', label: 'Perro', emoji: '🐕' },
              { value: 'gato', label: 'Gato', emoji: '🐈' },
              { value: 'otro', label: 'Otro', emoji: '🐾' },
            ].map(opt => (
              <button key={opt.value} type="button"
                      onClick={() => setEspecie(opt.value)}
                      className={`flex-1 py-3 rounded-xl text-sm font-ui font-bold border-2 transition-all ${
                        especie === opt.value
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      style={especie === opt.value ? { color: 'var(--color-coral)' } : { color: 'var(--color-text-gray)' }}>
                <span className="text-xl block mb-1">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Raza (opcional)</label>
          <input type="text" value={raza} onChange={e => setRaza(e.target.value)}
                 placeholder="Ej: French Poodle, Mestizo..."
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Fecha de Nacimiento (opcional)</label>
          <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-ui font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}>
            {initialData ? 'Guardar Cambios' : 'Agregar Mascota'}
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
