import React from 'react';

export default function CouponSection({
  couponInput, setCouponInput,
  couponMsg, isApplyingCoupon,
  handleApplyCoupon, couponCode,
  removeCoupon, couponDiscount,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
        🎟️ ¿Tienes un cupón de descuento?
      </h3>

      {couponCode ? (
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 block font-medium">Cupón Activo</span>
            <span className="font-bold text-emerald-800">{couponCode} (-{couponDiscount}%)</span>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-red-600 hover:text-red-800 transition"
            onClick={removeCoupon}
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition placeholder:text-gray-400"
            placeholder="CÓDIGO10"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-black text-white font-bold transition text-sm disabled:opacity-50"
            disabled={isApplyingCoupon || !couponInput.trim()}
            onClick={handleApplyCoupon}
          >
            {isApplyingCoupon ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>
      )}

      {couponMsg && (
        <div className={`text-xs font-semibold p-2.5 rounded-xl ${
          couponMsg.success 
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
            : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          {couponMsg.success ? '¡Felicidades! Cupón aplicado correctamente.' : couponMsg.message}
        </div>
      )}
    </div>
  );
}
