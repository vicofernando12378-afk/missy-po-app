/**
 * PointsTab.jsx
 * Extracted from CVRMDashboard.jsx — Points config, award points, member ranking.
 * All business logic (handlers, state) remains in CVRMDashboard and is passed as props.
 */

export default function PointsTab({
  // Config
  configClub,
  setConfigClub,
  loadingConfig,
  savingConfig,
  handleSaveConfig,
  // Award points
  miembros,
  selectedMemberId,
  setSelectedMemberId,
  pointsToAward,
  setPointsToAward,
  awardReason,
  setAwardReason,
  savingPoints,
  handleAwardPoints,
  memberSearchQuery,
  setMemberSearchQuery,
  dropdownOpen,
  setDropdownOpen,
  searchFilteredMiembros,
  // Ranking
  rankingMiembros,
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left column: Points & Club rules config */}
        <div className="lg:col-span-5 space-y-6">

          {/* Points accumulation rules */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">⚙️ Reglas de Puntos y Club</h3>
              <p className="text-xs text-gray-400 mb-6">Establece las tasas de acumulación de puntos del club de beneficios.</p>
              {loadingConfig ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Monto de Compra en Soles por cada 10 puntos ganados
                    </label>
                    <input type="number" min="1" step="0.5" required
                      value={configClub.solesPorDiezPuntos}
                      onChange={(e) => setConfigClub(prev => ({ ...prev, solesPorDiezPuntos: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      placeholder="Ej. 10"
                    />
                  </div>
                  <button type="submit" disabled={savingConfig}
                    className="w-full py-3.5 mt-2 bg-gray-850 hover:bg-gray-900 text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-gray-850/10 text-sm"
                  >
                    {savingConfig ? 'Guardando...' : 'Guardar Configuración 💾'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Redemption rules */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">🎟️ Reglas de Canje y Cupones</h3>
              <p className="text-xs text-gray-400 mb-6">Configura los valores de conversión y condiciones para que los clientes canjeen sus puntos.</p>
              {loadingConfig ? (
                <div className="py-8 text-center">
                  <div className="w-6 h-6 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tipo de Premio</label>
                    <select value={configClub.tipoPremio}
                      onChange={(e) => setConfigClub(prev => ({ ...prev, tipoPremio: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                    >
                      <option value="monto_fijo">Monto Fijo (S/.)</option>
                      <option value="porcentaje">Porcentaje (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Valor del Descuento</label>
                    <input type="number" min="0.1" step="0.1" required
                      value={configClub.valorDescuento}
                      onChange={(e) => setConfigClub(prev => ({ ...prev, valorDescuento: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      placeholder="Ej. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Puntos Requeridos</label>
                    <input type="number" min="1" step="1" required
                      value={configClub.puntosRequeridos}
                      onChange={(e) => setConfigClub(prev => ({ ...prev, puntosRequeridos: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      placeholder="Ej. 200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Monto Mínimo de Compra para aplicar canje (S/.)
                    </label>
                    <input type="number" min="0" step="0.5" required
                      value={configClub.minCompraAplicarCanje}
                      onChange={(e) => setConfigClub(prev => ({ ...prev, minCompraAplicarCanje: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                      placeholder="Ej. 50"
                    />
                  </div>
                  <button type="submit" disabled={savingConfig}
                    className="w-full py-3.5 mt-2 bg-gray-850 hover:bg-gray-900 text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-gray-850/10 text-sm"
                  >
                    {savingConfig ? 'Guardando...' : 'Guardar Configuración 💾'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Award points */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-brand text-lg text-gray-800 mb-2 flex items-center gap-2">✨ Otorgar Puntos de Regalo y Lealtad</h3>
            <p className="text-xs text-gray-400 mb-6">Premia a tus socios por interactuar en redes, ganar sorteos o campañas específicas.</p>

            <form onSubmit={handleAwardPoints} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Seleccionar Socio Miembro</label>
                <div className="relative">
                  <input type="text"
                    placeholder="Escribe para buscar por tutor, mascota o correo..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      setDropdownOpen(true);
                      if (selectedMemberId) setSelectedMemberId('');
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                  />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-gray-400">
                    {selectedMemberId ? (
                      <button type="button" onClick={() => { setSelectedMemberId(''); setMemberSearchQuery(''); }}
                        className="text-gray-400 hover:text-gray-600 font-bold bg-transparent border-none cursor-pointer text-xs p-1"
                      >✕</button>
                    ) : (
                      <span className="text-xs">🔍</span>
                    )}
                  </div>
                </div>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-gray-150 rounded-2xl shadow-xl z-20 divide-y divide-gray-50 animate-fade-in">
                      {searchFilteredMiembros.length === 0 ? (
                        <div className="px-4 py-3.5 text-xs text-gray-400 text-center font-medium">No se encontraron socios</div>
                      ) : (
                        searchFilteredMiembros.map(m => (
                          <button key={m.id} type="button"
                            onClick={() => { setSelectedMemberId(m.id); setMemberSearchQuery(`${m.nombre_tutor} (Mascota: ${m.nombre_mascota}) - ${m.email}`); setDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-xs hover:bg-coral/5 transition-colors cursor-pointer border-none block ${selectedMemberId === m.id ? 'bg-coral/10 font-semibold text-coral' : 'text-gray-700 bg-white'}`}
                          >
                            <span className="font-semibold text-gray-805 block">{m.nombre_tutor} <span className="text-gray-400 font-normal">({m.email})</span></span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">🐾 Mascota: <span className="font-semibold text-coral">{m.nombre_mascota}</span> | Saldo: <span className="font-bold text-gray-600">{m.puntos || 0} pts</span></span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Puntos a Asignar (pueden ser negativos para restar)</label>
                  <input type="number" required value={pointsToAward}
                    onChange={(e) => setPointsToAward(e.target.value)}
                    placeholder="Ej. 100 o -50"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Motivo / Campaña / Concurso</label>
                  <input type="text" required value={awardReason}
                    onChange={(e) => setAwardReason(e.target.value)}
                    placeholder="Ej. Sorteo Instagram Aniversario"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                  />
                </div>
              </div>

              <button type="submit" disabled={savingPoints}
                className="w-full py-3.5 mt-2 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md shadow-coral/15 text-sm font-ui"
              >
                {savingPoints ? 'Procesando...' : 'Otorgar Puntos al Socio ✨'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Member ranking */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-brand text-lg text-gray-800">🥇 Ranking de Socios Missy & Po</h3>
            <p className="text-xs text-gray-400">Tabla de clasificación ordenada por los puntos acumulados por lealtad.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-center w-20">Rango</th>
                <th className="px-6 py-4">Tutor</th>
                <th className="px-6 py-4">Mascota (Alias)</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Origen Club</th>
                <th className="px-6 py-4 text-center">Puntos Acumulados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {rankingMiembros.map((miembro, index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                return (
                  <tr key={miembro.id} className={`hover:bg-gray-50/50 transition-colors ${rank <= 3 ? 'bg-amber-50/10' : ''}`}>
                    <td className="px-6 py-4 text-center font-bold text-base">
                      {medal ? <span title={`Rango ${rank}`} className="text-xl">{medal}</span> : <span className="text-gray-400 text-sm">{rank}</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{miembro.nombre_tutor}</td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral/5 text-coral rounded-full text-xs font-bold font-ui">🐾 {miembro.nombre_mascota}</span></td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{miembro.email}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-400">{miembro.benefit_origen || 'General'}</td>
                    <td className="px-6 py-4 text-center font-black text-coral text-base">{miembro.puntos || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
