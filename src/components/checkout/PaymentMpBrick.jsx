import { useState } from 'react';

// ============================================================
// PAYMENT MP BRICK — Formulario de Tarjeta Interactivo
// Missy & Po Pet Shop
// ============================================================

export default function PaymentMpBrick({ total, onConfirm, onCancel }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Detectar marca de tarjeta basado en los primeros dígitos
  const getCardType = () => {
    const cleanNumber = cardNumber.replace(/\s?/g, '');
    if (cleanNumber.startsWith('4')) return 'VISA';
    if (cleanNumber.startsWith('5')) return 'MASTERCARD';
    if (cleanNumber.startsWith('37') || cleanNumber.startsWith('34')) return 'AMEX';
    if (cleanNumber.startsWith('36')) return 'DINERS';
    return 'CREDIT';
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      setError('Número de tarjeta incompleto (requiere 16 dígitos)');
      return;
    }
    if (!cardName.trim()) {
      setError('Por favor, ingresa el nombre del titular');
      return;
    }
    if (cardExpiry.length < 5) {
      setError('Fecha de expiración incompleta (MM/AA)');
      return;
    }
    if (cardCvv.length < 3) {
      setError('Código CVV incompleto');
      return;
    }

    setIsProcessing(true);

    // Simular retraso de procesamiento del banco (sandbox Mercado Pago)
    setTimeout(() => {
      onConfirm({
        metodo: 'Mercado Pago',
        marca: getCardType(),
        ultimosDigitos: cleanNum.slice(-4),
        cuotas: installments,
      });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-[fade-in-up_0.3s_ease-out] border border-gray-100 flex flex-col max-h-[95vh]">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-700 px-6 py-5 text-white flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="font-ui font-bold text-lg">Tarjeta de Crédito / Débito</h3>
            <p className="text-blue-100 text-xs font-body mt-0.5">Pasarela segura vía Mercado Pago</p>
          </div>
          <span className="bg-white/10 text-white border border-white/20 text-[10px] font-ui px-2 py-0.5 rounded-full uppercase tracking-wider">
            Sandbox
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* TARJETA INTERACTIVA (FLIP CARD) */}
          <div className="perspective-1000 w-full aspect-[1.58/1] max-w-[320px] mx-auto relative mb-2">
            <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* CARA FRONTAL */}
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 p-6 text-white backface-hidden flex flex-col justify-between shadow-lg">
                <div className="flex justify-between items-start">
                  {/* Chip */}
                  <div className="w-10 h-7 rounded bg-amber-400/80 bg-gradient-to-tr from-amber-300 to-amber-500 overflow-hidden relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-black/15" />
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-black/15" />
                  </div>
                  {/* Marca */}
                  <span className="font-ui font-extrabold italic text-sm tracking-wider text-sky-400">
                    {getCardType()}
                  </span>
                </div>

                {/* Número */}
                <div className="font-mono text-lg sm:text-xl tracking-[0.15em] text-zinc-150 py-2">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex justify-between items-end">
                  {/* Titular */}
                  <div className="min-w-0 pr-4">
                    <span className="text-[9px] text-zinc-500 font-ui uppercase block tracking-wider">Titular</span>
                    <span className="text-xs font-ui font-semibold truncate block uppercase tracking-wide">
                      {cardName || 'Nombre del Titular'}
                    </span>
                  </div>
                  {/* Expiración */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-[9px] text-zinc-500 font-ui uppercase block tracking-wider">Expiración</span>
                    <span className="text-xs font-mono font-semibold block">
                      {cardExpiry || 'MM/AA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARA POSTERIOR */}
              <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-slate-950 to-zinc-900 backface-hidden rotate-y-180 flex flex-col justify-between py-6 shadow-lg">
                <div className="w-full h-10 bg-black mt-2" />
                
                <div className="px-6 flex items-center justify-between">
                  <div className="text-left w-3/4">
                    <span className="text-[8px] text-zinc-500 font-ui uppercase block tracking-wider mb-1">Firma del Titular</span>
                    <div className="w-full h-7 bg-white/10 rounded border border-white/5" />
                  </div>
                  
                  <div className="text-right w-1/5">
                    <span className="text-[8px] text-zinc-500 font-ui uppercase block tracking-wider mb-1">CVV</span>
                    <div className="bg-white text-gray-800 text-center font-mono font-bold text-xs py-1 rounded">
                      {cardCvv || '•••'}
                    </div>
                  </div>
                </div>

                <div className="px-6 text-[8px] text-zinc-500 font-body leading-tight text-center">
                  Esta es una simulación del entorno de pruebas de Mercado Pago. Ningún cargo real será efectuado.
                </div>
              </div>

            </div>
          </div>

          {/* CAMPOS DEL FORMULARIO */}
          <div className="space-y-4">
            <div>
              <label htmlFor="card-number" className="text-xs font-ui font-bold text-gray-700 block mb-1">
                Número de Tarjeta:
              </label>
              <input
                id="card-number"
                type="text"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4000 1234 5678 9010"
                className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm font-body focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="card-name" className="text-xs font-ui font-bold text-gray-700 block mb-1">
                Nombre del Titular:
              </label>
              <input
                id="card-name"
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Como aparece en la tarjeta"
                className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm font-body uppercase focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="card-expiry" className="text-xs font-ui font-bold text-gray-700 block mb-1">
                  Expiración (MM/AA):
                </label>
                <input
                  id="card-expiry"
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/AA"
                  className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm font-body text-center focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="card-cvv" className="text-xs font-ui font-bold text-gray-700 block mb-1">
                  Código CVV:
                </label>
                <input
                  id="card-cvv"
                  type="text"
                  maxLength={4}
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setIsFlipped(true)}
                  onBlur={() => setIsFlipped(false)}
                  placeholder="123"
                  className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm font-body text-center focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="installments-select" className="text-xs font-ui font-bold text-gray-700 block mb-1">
                Cuotas:
              </label>
              <select
                id="installments-select"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm font-ui bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="1">1 cuota de S/ {(total / 100).toFixed(2)} (Sin intereses)</option>
                <option value="2">2 cuotas de S/ {(total / 200).toFixed(2)}</option>
                <option value="3">3 cuotas de S/ {(total / 300).toFixed(2)}</option>
                <option value="6">6 cuotas de S/ {(total / 600).toFixed(2)}</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-body bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              ⚠️ {error}
            </p>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 flex-shrink-0 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-full text-sm font-ui font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3 bg-blue-600 text-white rounded-full text-sm font-ui font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                `Pagar S/ ${(total / 100).toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
