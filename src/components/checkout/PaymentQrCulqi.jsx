import { useState } from 'react';

import { validate, YapePlinSchema } from '../../schemas';


// ============================================================
// PAYMENT QR CULQI — Modal de Pago interactivo Yape/Plin
// Missy & Po Pet Shop
// ============================================================

export default function PaymentQrCulqi({ total, onConfirm, onCancel }) {
  const [operacion, setOperacion] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('El archivo es demasiado grande (máx 2MB)');
        return;
      }
      setFile(selectedFile);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validate(YapePlinSchema, {
      operacion: operacion.trim(),
      comprobanteFile: file,
    });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      // Retornar los datos del pago al componente principal
      await onConfirm({
        metodo: 'Yape/Plin',
        operacion: operacion.trim(),
        comprobanteFile: file,
        comprobantePreview: preview,
      });
    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
      setIsProcessing(false);
    }
  };

  // Generamos un QR dinámico con la API de QR Server apuntando a un pago simulado
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=2e0854&data=${encodeURIComponent(
    `yape://pay?to=51913249330&amount=${(total / 100).toFixed(2)}&concept=MissyPoOrder`,
  )}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-[fade-in-up_0.3s_ease-out] border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-6 py-5 text-white flex-shrink-0">
          <h3 className="font-ui font-bold text-lg">Pagar con Yape o Plin</h3>
          <p className="text-purple-200 text-xs font-body mt-0.5">Rápido, seguro y sin contacto</p>
        </div>

        {/* Formulario scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Instrucciones y QR */}
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500 font-body">
              Escanea el código QR desde tu aplicación móvil de <strong>Yape</strong> o <strong>Plin</strong> para realizar el pago:
            </p>

            <div className="relative inline-block p-3 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
              <img src={qrCodeUrl} alt="Código QR Yape/Plin" className="w-44 h-44 mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-purple-950/80 transition-opacity rounded-2xl text-white text-xs font-ui p-4">
                Celular de contacto:<br /><strong>913 249 330</strong>
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[11px] font-ui text-purple-900 block font-semibold">Monto Exacto a Transferir:</span>
              <span className="text-xl font-bold text-purple-950">S/ {(total / 100).toFixed(2)}</span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Carga del recibo */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-ui font-bold text-gray-700 block mb-1.5">
                1. Sube la captura de pantalla del pago:
              </label>
              
              {!preview ? (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-purple-400 transition-colors relative cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    id="receipt-file-input"
                  />
                  <span className="text-3xl block mb-2">📸</span>
                  <span className="text-xs font-ui text-gray-600 block">Subir comprobante (PNG, JPG)</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Máximo 2MB</span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 max-h-36 bg-gray-50 flex items-center justify-center">
                  <img src={preview} alt="Vista previa del recibo" className="max-h-36 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="operacion-input" className="text-xs font-ui font-bold text-gray-700 block mb-1">
                2. Número de Operación:
              </label>
              <input
                id="operacion-input"
                type="text"
                maxLength={8}
                value={operacion}
                onChange={(e) => setOperacion(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 123456"
                className="w-full h-10 px-4 rounded-full border border-gray-200 text-sm font-body focus:outline-none focus:border-purple-600"
                required
              />
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
              className="flex-1 py-3 bg-purple-900 text-white rounded-full text-sm font-ui font-semibold hover:bg-purple-950 transition-colors shadow-md shadow-purple-900/10 flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
