import React from 'react';

export default function ContactFields({
  nombre, setNombre,
  apellido, setApellido,
  email, setEmail,
  celular, setCelular,
  nombreMascota, setNombreMascota,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3 mb-2">
        <span className="text-coral">1.</span> Datos de Contacto
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido *</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            placeholder="Tu apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico *</label>
          <input
            type="email"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Celular *</label>
          <input
            type="tel"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            placeholder="987654321"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre de Mascota <span className="text-gray-400 text-xs font-normal">(Recomendado para acumular puntos)</span>
        </label>
        <input
          type="text"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
          placeholder="Nombre de tu perrito/gatito"
          value={nombreMascota}
          onChange={(e) => setNombreMascota(e.target.value)}
        />
      </div>
    </div>
  );
}
