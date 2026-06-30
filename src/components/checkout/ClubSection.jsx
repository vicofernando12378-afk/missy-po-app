import React from 'react';

export default function ClubSection({
  clubConfig,
  clubMember,
  setClubMember,
  verifyingMember,
  pointsApplied,
  verifyEmailInput,
  setVerifyEmailInput,
  verifyAliasInput,
  setVerifyAliasInput,
  verifyError,
  handleManualVerify,
  applyPoints,
  removePoints,
  total,
  onAutocompleteCallback,
}) {
  const totalSoles = total / 100;
  const canApplyPoints = totalSoles >= clubConfig.minCompraAplicarCanje;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
        👥 Club de Beneficios Missy & Po
      </h3>

      {clubMember ? (
        <div className="bg-coral/5 border border-coral/10 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-coral font-medium block">Socio Activo</span>
              <span className="font-bold text-gray-800">{clubMember.nombre_tutor || 'Socio'}</span>
              <span className="text-xs text-gray-400 block">Mascota: {clubMember.nombre_mascota}</span>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
              onClick={() => {
                setClubMember(null);
                removePoints();
              }}
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <span className="text-xs text-gray-500 block">Puntos Acumulados</span>
              <span className="text-lg font-bold text-gray-800">{clubMember.puntos || 0} pts</span>
            </div>

            {clubMember.puntos >= clubConfig.puntosRequeridos ? (
              pointsApplied ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl border border-coral text-coral hover:bg-coral/5 font-bold text-xs transition"
                  onClick={removePoints}
                >
                  Quitar Descuento
                </button>
              ) : (
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-xl text-white font-bold text-xs transition ${
                    canApplyPoints 
                      ? 'bg-coral hover:bg-coral-dark' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!canApplyPoints}
                  onClick={applyPoints}
                >
                  Canjear Desc. (S/ {clubConfig.valorDescuento})
                </button>
              )
            ) : (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 font-medium">
                Faltan {clubConfig.puntosRequeridos - (clubMember.puntos || 0)} pts para canjear
              </span>
            )}
          </div>
          
          {!canApplyPoints && clubMember.puntos >= clubConfig.puntosRequeridos && (
            <p className="text-xs text-gray-400 italic">
              * Compra mínima de S/ {clubConfig.minCompraAplicarCanje} requerida para canjear.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3.5 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            Ingresa tus datos del Club para autocompletar tu dirección y canjear puntos de descuento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Correo de Socio</label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-coral focus:border-coral text-sm transition placeholder:text-gray-300"
                placeholder="socio@correo.com"
                value={verifyEmailInput}
                onChange={(e) => setVerifyEmailInput(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-0.5">Alias de Mascota</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-coral focus:border-coral text-sm transition placeholder:text-gray-300"
                placeholder="Nombre de mascota"
                value={verifyAliasInput}
                onChange={(e) => setVerifyAliasInput(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="w-full py-2 rounded-lg bg-coral hover:bg-coral-dark text-white font-bold transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            disabled={verifyingMember}
            onClick={() => handleManualVerify(onAutocompleteCallback)}
          >
            {verifyingMember ? 'Verificando...' : 'Verificar Socio'}
          </button>

          {verifyError && (
            <p className="text-xs text-red-600 font-medium text-center">{verifyError}</p>
          )}
        </div>
      )}
    </div>
  );
}
