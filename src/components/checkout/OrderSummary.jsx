import React from 'react'

export default function OrderSummary({
  items,
  subtotal,
  couponCode,
  couponDiscount,
  pointsDiscountCents,
  costoEnvio,
  totalFinalSoles,
  incluirImpuesto,
  setIncluirImpuesto,
  baseImponibleSoles,
  igvCalculadoSoles
}) {
  const subtotalSoles = subtotal / 100
  const couponDiscountSoles = (subtotalSoles * couponDiscount) / 100
  const pointsDiscountSoles = pointsDiscountCents / 100

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-2">
        Resumen del Pedido
      </h3>
      
      <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {items.map((item, idx) => (
          <div key={`${item.id}-${item.variante || idx}`} className="flex gap-3 justify-between items-center text-sm">
            <div className="flex gap-2.5 items-center">
              {item.imagen && (
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="w-10 h-10 object-cover rounded-lg border bg-gray-50"
                />
              )}
              <div>
                <span className="font-semibold text-gray-800 line-clamp-1">{item.nombre}</span>
                {item.variante && item.variante !== 'default' && (
                  <span className="text-xs text-gray-400 block">{item.variante}</span>
                )}
                <span className="text-xs text-gray-400">Cant: {item.cantidad}</span>
              </div>
            </div>
            <span className="font-bold text-gray-800">S/ {(item.precio_unitario * item.cantidad / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2.5 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>S/ {subtotalSoles.toFixed(2)}</span>
        </div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Descuento Cupón ({couponDiscount}%)</span>
            <span>-S/ {couponDiscountSoles.toFixed(2)}</span>
          </div>
        )}

        {pointsDiscountCents > 0 && (
          <div className="flex justify-between text-coral font-medium">
            <span>Descuento Canje Club</span>
            <span>-S/ {pointsDiscountSoles.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Costo de Envío</span>
          <span>{costoEnvio === 0 ? 'Gratis' : `S/ ${costoEnvio.toFixed(2)}`}</span>
        </div>

        {incluirImpuesto && (
          <div className="bg-gray-50 p-2.5 rounded-xl border border-dashed border-gray-200 text-xs space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Base Imponible</span>
              <span>S/ {baseImponibleSoles.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>IGV (18%)</span>
              <span>S/ {igvCalculadoSoles.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 py-1">
        <input
          type="checkbox"
          id="incluirImpuesto"
          className="rounded text-coral focus:ring-coral w-4 h-4"
          checked={incluirImpuesto}
          onChange={(e) => setIncluirImpuesto(e.target.checked)}
        />
        <label htmlFor="incluirImpuesto" className="text-xs text-gray-600 cursor-pointer select-none">
          Necesito Boleta/Factura con IGV desglosado
        </label>
      </div>

      <div className="border-t pt-4 flex justify-between items-center">
        <span className="text-base font-bold text-gray-800">Total Final</span>
        <span className="text-xl font-extrabold text-coral">S/ {totalFinalSoles.toFixed(2)}</span>
      </div>
    </div>
  )
}
