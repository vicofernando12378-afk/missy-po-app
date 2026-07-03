/**
 * ClubMembersTab.jsx
 * Extracted from CVRMDashboard.jsx — Club members list + add member modal + detail/edit modals.
 * All business logic (handlers, state) remains in CVRMDashboard and is passed as props.
 */

export default function ClubMembersTab({
  miembros,
  loading,
  searchQuery,
  setSearchQuery,
  filteredMiembros,
  setDetailMember,
  setEditMember,
  handleDelete,
  registrosHoy,
  // Add member modal
  showAddModal,
  setShowAddModal,
  newMember,
  setNewMember,
  savingMember,
  handleAddMemberSubmit,
  handleExportCSV,
  // Detail modal
  detailMember,
  // Edit modal
  editMember,
  handleEditMemberSubmit,
}) {
  return (
    <div className="space-y-6">
      {/* Quick metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Miembros</p>
            <h3 className="text-3xl font-brand text-gray-800 mt-1">{miembros.length}</h3>
          </div>
          <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral text-2xl">👥</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrados Hoy</p>
            <h3 className="text-3xl font-brand text-green-600 mt-1">+{registrosHoy}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 text-2xl">📈</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origen de Conversión</p>
            <h3 className="text-lg font-semibold text-gray-800 mt-2 truncate max-w-[180px]">
              {miembros.length > 0
                ? [...new Set(miembros.map(m => m.benefit_origen).filter(Boolean))]
                    .map(b => ({ name: b, count: miembros.filter(m => m.benefit_origen === b).length }))
                    .sort((a, b) => b.count - a.count)[0]?.name || 'Web'
                : 'Ninguno'}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-2xl">📍</div>
        </div>
      </div>

      {/* Member list */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-6 border-b border-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por tutor, mascota, correo o beneficio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 text-sm font-medium">Cargando comunidad...</p>
          </div>
        ) : filteredMiembros.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="text-5xl">🐾</div>
            <h4 className="text-gray-800 font-semibold text-base">No se encontraron miembros</h4>
            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              Prueba cambiando los filtros de búsqueda o agrega un miembro manualmente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Tutor</th>
                  <th className="px-6 py-4">Mascota (Alias)</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Beneficio de Interés</th>
                  <th className="px-6 py-4 text-center">Puntos</th>
                  <th className="px-6 py-4">Registro</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredMiembros.map((miembro) => (
                  <tr key={miembro.id} className="hover:bg-gray-50/50 transition-colors">
                    <td
                      onClick={() => setDetailMember(miembro)}
                      className="px-6 py-4 font-semibold text-gray-800 cursor-pointer hover:text-coral hover:underline"
                      title="Click para ver ficha completa del socio"
                    >
                      {miembro.nombre_tutor}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral/5 text-coral rounded-full text-xs font-bold font-ui">
                        🐾 {miembro.nombre_mascota}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{miembro.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-lg">
                        {miembro.benefit_origen || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">{miembro.puntos || 0}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                      {miembro.creado_en
                        ? new Date(miembro.creado_en.seconds * 1000).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => setEditMember({
                          id: miembro.id,
                          nombre_tutor: miembro.nombre_tutor || '',
                          nombre_mascota: miembro.nombre_mascota || '',
                          email: miembro.email || '',
                          celular: miembro.celular || '',
                          direccion: miembro.direccion || '',
                          documento_tipo: miembro.documento_tipo || 'DNI',
                          documento_numero: miembro.documento_numero || '',
                          departamento: miembro.departamento || '',
                          distrito: miembro.distrito || '',
                          benefit_origen: miembro.benefit_origen || 'General',
                        })}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="Editar socio"
                      >✏️</button>
                      <button
                        onClick={() => handleDelete(miembro.id, miembro.nombre_tutor, miembro.nombre_mascota)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="Dar de baja miembro"
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-8 relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >✕</button>

            <div className="inline-flex items-center gap-1.5 bg-red-50 text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 text-coral border border-red-200/20">
              👥 CVRM Admin
            </div>
            <h3 className="font-brand text-2xl mb-1 text-gray-800">Registrar Miembro</h3>
            <p className="text-xs text-gray-400 mb-6">Añade un tutor y su mascota directamente al Club de Beneficios.</p>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre del tutor</label>
                <input type="text" required value={newMember.tutor}
                  onChange={(e) => setNewMember(prev => ({ ...prev, tutor: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre de la Mascota (Alias)</label>
                <input type="text" required value={newMember.mascota}
                  onChange={(e) => setNewMember(prev => ({ ...prev, mascota: e.target.value }))}
                  placeholder="Ej. Firulais"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Correo Electrónico</label>
                <input type="email" required value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej. juan@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Origen / Beneficio</label>
                <select value={newMember.benefit}
                  onChange={(e) => setNewMember(prev => ({ ...prev, benefit: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                >
                  <option value="Registro Manual Admin">Registro Manual Admin</option>
                  <option value="Missy & Po Puntos">Missy & Po Puntos</option>
                  <option value="Descuentos Exclusivos">Descuentos Exclusivos</option>
                  <option value="Regalo de Cumpleaños">Regalo de Cumpleaños</option>
                  <option value="Acceso Anticipado">Acceso Anticipado</option>
                  <option value="Contenido Missy & Po TV">Contenido Missy & Po TV</option>
                  <option value="Atención Prioritaria">Atención Prioritaria</option>
                </select>
              </div>
              <button type="submit" disabled={savingMember}
                className="w-full py-4.5 mt-2 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer border-none"
              >
                {savingMember ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Guardando...</>
                ) : 'Registrar Miembro ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg p-8 relative animate-scale-up">
            <button onClick={() => setDetailMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >✕</button>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl">🐾</span>
              <div>
                <h3 className="font-brand text-2xl text-gray-800 leading-tight">Ficha del Socio</h3>
                <p className="text-xs text-gray-400">Historial y datos consolidados del Club.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-body border-t border-b border-gray-150 py-4 my-4 leading-relaxed">
              <div><span className="text-gray-400 font-semibold uppercase block">Tutor</span><span className="text-gray-850 font-bold block">{detailMember.nombre_tutor || 'No registrado'}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Mascota</span><span className="text-coral font-bold block">🐾 {detailMember.nombre_mascota || 'No registrado'}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Correo Electrónico</span><span className="text-gray-800 font-medium block truncate" title={detailMember.email}>{detailMember.email || 'No registrado'}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Celular</span><span className="text-gray-800 font-medium block">{detailMember.celular || 'No registrado'}</span></div>
              <div className="col-span-2"><span className="text-gray-400 font-semibold uppercase block">Dirección de Entrega</span><span className="text-gray-800 font-medium block">{detailMember.direccion ? `${detailMember.direccion}${detailMember.distrito ? `, ${detailMember.distrito}` : ''}${detailMember.departamento ? `, ${detailMember.departamento}` : ''}` : 'No registrado'}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Documento de Identidad</span><span className="text-gray-800 font-medium block">{detailMember.documento_tipo && detailMember.documento_numero ? `${detailMember.documento_tipo}: ${detailMember.documento_numero}` : 'No registrado'}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Puntos Acumulados</span><span className="text-lg font-black text-coral block">{detailMember.puntos || 0} pts</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Origen del Registro</span><span className="text-gray-800 font-medium block bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-lg inline-block">{detailMember.benefit_origen || 'General'}</span></div>
              <div><span className="text-gray-400 font-semibold uppercase block">Fecha de Registro</span><span className="text-gray-800 font-medium block">{detailMember.creado_en ? new Date(detailMember.creado_en.seconds * 1000).toLocaleString('es-PE') : 'No disponible'}</span></div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setDetailMember(null)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-coral text-white rounded-xl font-bold text-xs shadow transition-all cursor-pointer border-none"
              >Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit member modal */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg p-8 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditMember(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >✕</button>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">✏️</span>
              <div>
                <h3 className="font-brand text-2xl text-gray-800 leading-tight">Editar Socio</h3>
                <p className="text-xs text-gray-400">Modifica los datos del tutor y de la mascota en el Club.</p>
              </div>
            </div>
            <form onSubmit={handleEditMemberSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Nombre del tutor *</label>
                  <input type="text" required value={editMember.nombre_tutor}
                    onChange={(e) => setEditMember(prev => ({ ...prev, nombre_tutor: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Nombre de la Mascota *</label>
                  <input type="text" required value={editMember.nombre_mascota}
                    onChange={(e) => setEditMember(prev => ({ ...prev, nombre_mascota: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Correo Electrónico *</label>
                  <input type="email" required value={editMember.email}
                    onChange={(e) => setEditMember(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Celular</label>
                  <input type="tel" value={editMember.celular}
                    onChange={(e) => setEditMember(prev => ({ ...prev, celular: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Dirección</label>
                  <input type="text" value={editMember.direccion}
                    onChange={(e) => setEditMember(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Departamento</label>
                  <input type="text" value={editMember.departamento}
                    onChange={(e) => setEditMember(prev => ({ ...prev, departamento: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Distrito / Ciudad</label>
                  <input type="text" value={editMember.distrito}
                    onChange={(e) => setEditMember(prev => ({ ...prev, distrito: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Tipo de Documento</label>
                  <select value={editMember.documento_tipo}
                    onChange={(e) => setEditMember(prev => ({ ...prev, documento_tipo: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral bg-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-500 uppercase mb-1">Número Documento</label>
                  <input type="text" value={editMember.documento_numero}
                    onChange={(e) => setEditMember(prev => ({ ...prev, documento_numero: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-500 uppercase mb-1">Origen / Beneficio</label>
                <select value={editMember.benefit_origen}
                  onChange={(e) => setEditMember(prev => ({ ...prev, benefit_origen: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-coral/20 focus:border-coral bg-white"
                >
                  <option value="Registro Manual Admin">Registro Manual Admin</option>
                  <option value="Registro Automático Compra">Registro Automático Compra</option>
                  <option value="Missy & Po Puntos">Missy & Po Puntos</option>
                  <option value="Descuentos Exclusivos">Descuentos Exclusivos</option>
                  <option value="Regalo de Cumpleaños">Regalo de Cumpleaños</option>
                  <option value="Acceso Anticipado">Acceso Anticipado</option>
                  <option value="Contenido Missy & Po TV">Contenido Missy & Po TV</option>
                  <option value="Atención Prioritaria">Atención Prioritaria</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setEditMember(null)}
                  className="px-5 py-2 border border-gray-200 text-gray-500 rounded-xl font-bold cursor-pointer bg-transparent"
                >Cancelar</button>
                <button type="submit" disabled={savingMember}
                  className="px-6 py-2 bg-coral text-white rounded-xl font-bold transition-all hover:bg-coral-dark shadow-md cursor-pointer border-none"
                >
                  {savingMember ? 'Guardando...' : 'Guardar Cambios 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
