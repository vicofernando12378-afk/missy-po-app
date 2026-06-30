import React from 'react'

export default function PaymentMethods({ metodoPago, setMetodoPago }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3 mb-2">
        <span className="text-coral">4.</span> Método de Pago
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition select-none ${
          metodoPago === 'contraentrega' 
            ? 'border-coral bg-coral/5 text-coral' 
            : 'border-gray-200 hover:border-gray-300 text-gray-600'
        }`}>
          <input
            type="radio"
            name="metodoPago"
            value="contraentrega"
            className="sr-only"
            checked={metodoPago === 'contraentrega'}
            onChange={() => setMetodoPago('contraentrega')}
          />
          <span className="text-2xl">🤝</span>
          <span className="font-bold text-sm">Contra Entrega</span>
          <span className="text-xs text-gray-400 text-center">Efectivo o POS al recibir</span>
        </label>

        <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition select-none ${
          metodoPago === 'yape' 
            ? 'border-coral bg-coral/5 text-coral' 
            : 'border-gray-200 hover:border-gray-300 text-gray-600'
        }`}>
          <input
            type="radio"
            name="metodoPago"
            value="yape"
            className="sr-only"
            checked={metodoPago === 'yape'}
            onChange={() => setMetodoPago('yape')}
          />
          <span className="text-2xl">📱</span>
          <span className="font-bold text-sm">Yape / Plin</span>
          <span className="text-xs text-gray-400 text-center">Pago con código QR inmediato</span>
        </label>

        <label className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition select-none ${
          metodoPago === 'tarjeta' 
            ? 'border-coral bg-coral/5 text-coral' 
            : 'border-gray-200 hover:border-gray-300 text-gray-600'
        }`}>
          <input
            type="radio"
            name="metodoPago"
            value="tarjeta"
            className="sr-only"
            checked={metodoPago === 'tarjeta'}
            onChange={() => setMetodoPago('tarjeta')}
          />
          <span className="text-2xl">💳</span>
          <span className="font-bold text-sm">Tarjeta</span>
          <span className="text-xs text-gray-400 text-center">Crédito o débito en línea</span>
        </label>
      </div>
    </div>
  )
}
