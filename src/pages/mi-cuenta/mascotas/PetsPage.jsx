import { useState } from 'react';

import PetForm from '../../../components/account/PetForm';
import useUserStore from '../../../store/userStore';

const ESPECIE_EMOJI = { perro: '🐕', gato: '🐈', otro: '🐾' };

export default function PetsPage({ authUser, profile }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const { addPet, removePet, updateProfile } = useUserStore();

  const mascotas = profile?.mascotas || [];

  const handleSave = async (pet) => {
    if (editingIndex !== null) {
      const updated = [...mascotas];
      updated[editingIndex] = pet;
      await updateProfile(authUser.uid, { mascotas: updated });
    } else {
      await addPet(authUser.uid, pet);
    }
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleDelete = async (index) => {
    if (confirm('¿Eliminar esta mascota?')) {
      await removePet(authUser.uid, index);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setShowForm(true);
  };

  const getAge = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const birth = new Date(fechaNacimiento);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    return remaining > 0 ? `${years} años y ${remaining} meses` : `${years} años`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-hero text-2xl sm:text-3xl mb-2" style={{ color: 'var(--color-text-dark)' }}>
            Mis Mascotas
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
            Registra a tus mascotas para recibir recomendaciones personalizadas.
          </p>
        </div>
        {mascotas.length < 5 && !showForm && (
          <button
            onClick={() => { setEditingIndex(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
          >
            + Agregar Mascota
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mb-6">
          <PetForm
            initialData={editingIndex !== null ? mascotas[editingIndex] : null}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingIndex(null); }}
          />
        </div>
      )}

      {/* Lista de mascotas */}
      {mascotas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mascotas.map((pet, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-5xl mb-3">{ESPECIE_EMOJI[pet.especie] || '🐾'}</div>
              <h3 className="font-ui font-bold text-lg mb-1" style={{ color: 'var(--color-text-dark)' }}>
                {pet.nombre}
              </h3>
              <p className="text-sm font-body capitalize" style={{ color: 'var(--color-text-gray)' }}>
                {pet.especie}{pet.raza ? ` • ${pet.raza}` : ''}
              </p>
              {pet.fecha_nacimiento && (
                <p className="text-xs font-body mt-1" style={{ color: 'var(--color-text-light)' }}>
                  🎂 {getAge(pet.fecha_nacimiento)}
                </p>
              )}
              <div className="flex gap-2 mt-4 pt-3 border-t justify-center" style={{ borderColor: 'var(--color-border)' }}>
                <button onClick={() => handleEdit(i)}
                        className="text-xs font-ui font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        style={{ color: 'var(--color-coral)' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(i)}
                        className="text-xs font-ui font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500 cursor-pointer">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-5xl mb-4 block">🐾</span>
            <h3 className="font-ui font-bold text-lg mb-2" style={{ color: 'var(--color-text-dark)' }}>
              No tienes mascotas registradas
            </h3>
            <p className="text-sm font-body mb-6" style={{ color: 'var(--color-text-gray)' }}>
              Registra a tu mascota para obtener recomendaciones de productos y beneficios de cumpleaños.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
            >
              + Registrar Mi Mascota
            </button>
          </div>
        )
      )}
    </div>
  );
}
