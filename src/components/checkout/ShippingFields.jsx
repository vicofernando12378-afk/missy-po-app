import React from 'react';

import { LIMA_REGIONS, AREQUIPA_DISTRICTS } from '../../data/locations';

export default function ShippingFields({
  departamento, setDepartamento,
  distritoArequipa, setDistritoArequipa,
  distritoNacional, setDistritoNacional,
  direccion, setDireccion,
  referencia, setReferencia,
}) {
  const isArequipa = departamento === 'Arequipa';

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3 mb-2">
        <span className="text-coral">2.</span> Dirección de Envío
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Departamento *</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            value={departamento}
            onChange={(e) => {
              setDepartamento(e.target.value);
              if (e.target.value !== 'Arequipa') {
                setDistritoNacional('');
              }
            }}
          >
            {LIMA_REGIONS.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Distrito *</label>
          {isArequipa ? (
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
              value={distritoArequipa}
              onChange={(e) => setDistritoArequipa(e.target.value)}
            >
              {AREQUIPA_DISTRICTS.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
              placeholder="Nombre del distrito"
              value={distritoNacional}
              onChange={(e) => setDistritoNacional(e.target.value)}
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección Exacta *</label>
        <input
          type="text"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
          placeholder="Av. Aviación 123 - Int 4"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Referencia o Indicaciones</label>
        <input
          type="text"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
          placeholder="Frente al parque, portón verde"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
        />
      </div>
    </div>
  );
}
