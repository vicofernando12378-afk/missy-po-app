import React from 'react'

export default function DocumentFields({
  tipoDocumento, setTipoDocumento,
  numeroDocumento, handleDocumentoChange,
  setNumeroDocumento
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3 mb-2">
        <span className="text-coral">3.</span> Tipo y Número de Documento
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Documento *</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            value={tipoDocumento}
            onChange={(e) => {
              setTipoDocumento(e.target.value)
              setNumeroDocumento('')
            }}
          >
            <option value="DNI">DNI (8 dígitos)</option>
            <option value="RUC">RUC (11 dígitos)</option>
            <option value="PASAPORTE">Pasaporte / CE (Alfanumérico)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Documento *</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition"
            placeholder={
              tipoDocumento === 'DNI' 
                ? 'Ingresa tus 8 dígitos' 
                : tipoDocumento === 'RUC' 
                  ? 'Ingresa tus 11 dígitos' 
                  : 'Ingresa tu pasaporte/CE'
            }
            value={numeroDocumento}
            onChange={handleDocumentoChange}
          />
        </div>
      </div>
    </div>
  )
}
