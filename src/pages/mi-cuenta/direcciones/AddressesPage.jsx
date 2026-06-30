import { useState } from 'react';

import AddressForm from '../../../components/account/AddressForm';
import useUserStore from '../../../store/userStore';

export default function AddressesPage({ authUser, profile }) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const { addAddress, removeAddress, updateProfile } = useUserStore();

  const direcciones = profile?.direcciones || [];

  const handleSave = async (address) => {
    if (editingIndex !== null) {
      const updated = [...direcciones];
      updated[editingIndex] = address;
      await updateProfile(authUser.uid, { direcciones: updated });
    } else {
      await addAddress(authUser.uid, address);
    }
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleDelete = async (index) => {
    if (confirm('¿Eliminar esta dirección?')) {
      await removeAddress(authUser.uid, index);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setShowForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-hero text-2xl sm:text-3xl mb-2" style={{ color: 'var(--color-text-dark)' }}>
            Mis Direcciones
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
            Guarda tus direcciones para un checkout más rápido.
          </p>
        </div>
        {direcciones.length < 5 && !showForm && (
          <button
            onClick={() => { setEditingIndex(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
          >
            + Agregar Dirección
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mb-6">
          <AddressForm
            initialData={editingIndex !== null ? direcciones[editingIndex] : null}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingIndex(null); }}
          />
        </div>
      )}

      {/* Lista de direcciones */}
      {direcciones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {direcciones.map((dir, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 relative" style={{ borderColor: 'var(--color-border)' }}>
              {dir.es_default && (
                <span className="absolute top-3 right-3 text-xs font-ui font-bold px-2 py-1 rounded-full"
                      style={{ color: 'var(--color-coral)', backgroundColor: '#fff5f5' }}>
                  Principal
                </span>
              )}
              <p className="font-ui font-bold text-sm mb-1" style={{ color: 'var(--color-text-dark)' }}>
                {dir.alias}
              </p>
              <p className="text-sm font-body mb-1" style={{ color: 'var(--color-text-gray)' }}>
                {dir.direccion}
              </p>
              <p className="text-xs font-body" style={{ color: 'var(--color-text-light)' }}>
                {dir.distrito}, {dir.departamento}
              </p>
              {dir.referencia && (
                <p className="text-xs font-body mt-1" style={{ color: 'var(--color-text-light)' }}>
                  Ref: {dir.referencia}
                </p>
              )}
              <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
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
            <span className="text-5xl mb-4 block">🏠</span>
            <h3 className="font-ui font-bold text-lg mb-2" style={{ color: 'var(--color-text-dark)' }}>
              No tienes direcciones guardadas
            </h3>
            <p className="text-sm font-body mb-6" style={{ color: 'var(--color-text-gray)' }}>
              Agrega una dirección para que tus compras lleguen más rápido.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
            >
              + Agregar Primera Dirección
            </button>
          </div>
        )
      )}
    </div>
  );
}
