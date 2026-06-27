import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'

// Configuración de pestañas
const TABS = [
  { id: 'miembros', label: 'Miembros del Club', icon: '👥', active: true },
  { id: 'leads', label: 'Seguimiento de Leads', icon: '🎯', active: false, tooltip: 'Carrito abandonado, consultas WhatsApp, registros del club' },
  { id: 'campanas', label: 'Campañas & Email', icon: '✉️', active: false },
  { id: 'puntos', label: 'Puntos & Lealtad', icon: '⭐', active: false },
  { id: 'segmentacion', label: 'Segmentación', icon: '🏷️', active: false },
]

export default function CVRMDashboard() {
  const [activeTab, setActiveTab] = useState('miembros')
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [savingMember, setSavingMember] = useState(false)
  const [newMember, setNewMember] = useState({
    tutor: '',
    mascota: '',
    email: '',
    benefit: 'Registro Manual Admin'
  })

  // 1. Cargar miembros del Club en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'myp_club_miembros'),
      orderBy('creado_en', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMiembros(docs)
      setLoading(false)
    }, (err) => {
      console.error("Error al obtener miembros del club:", err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 2. Filtrar miembros por búsqueda
  const filteredMiembros = miembros.filter(m => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      (m.nombre_tutor || '').toLowerCase().includes(query) ||
      (m.nombre_mascota || '').toLowerCase().includes(query) ||
      (m.email || '').toLowerCase().includes(query) ||
      (m.benefit_origen || '').toLowerCase().includes(query)
    )
  })

  // 3. Eliminar miembro
  const handleDelete = async (id, tutor, mascota) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${tutor} (mascota: ${mascota}) del Club?`)) return
    try {
      await deleteDoc(doc(db, 'myp_club_miembros', id))
    } catch (err) {
      console.error("Error al eliminar miembro:", err)
      alert("No se pudo eliminar al miembro. Por favor, intenta de nuevo.")
    }
  }

  // 4. Agregar miembro manualmente
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault()
    if (!newMember.tutor.trim() || !newMember.mascota.trim() || !newMember.email.trim()) {
      alert("Por favor rellena todos los campos obligatorios.")
      return
    }

    setSavingMember(true)
    try {
      await addDoc(collection(db, 'myp_club_miembros'), {
        nombre_tutor: newMember.tutor.trim(),
        nombre_mascota: newMember.mascota.trim(),
        email: newMember.email.trim(),
        benefit_origen: newMember.benefit || 'Registro Manual Admin',
        creado_en: serverTimestamp()
      })

      setShowAddModal(false)
      setNewMember({ tutor: '', mascota: '', email: '', benefit: 'Registro Manual Admin' })
    } catch (err) {
      console.error("Error al agregar miembro:", err)
      alert("Error al agregar miembro manualmente.")
    } finally {
      setSavingMember(false)
    }
  }

  // 5. Exportar a CSV
  const handleExportCSV = () => {
    if (miembros.length === 0) {
      alert("No hay miembros para exportar.")
      return
    }

    const headers = ['Nombre Tutor', 'Mascota (Alias)', 'Email', 'Beneficio Origen', 'Fecha Registro']
    const rows = miembros.map(m => [
      m.nombre_tutor || '',
      m.nombre_mascota || '',
      m.email || '',
      m.benefit_origen || '',
      m.creado_en ? new Date(m.creado_en.seconds * 1000).toLocaleString('es-PE') : 'Sin fecha'
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `miembros_club_missypo_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Contar registros de hoy
  const registrosHoy = miembros.filter(m => {
    if (!m.creado_en) return false
    const date = new Date(m.creado_en.seconds * 1000)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }).length

  return (
    <div className="space-y-8 font-body">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-coral uppercase tracking-wider">
            <span>👥</span> CVRM / Gestión del Club
          </div>
          <h1 className="font-brand text-3xl text-gray-800 leading-tight">
            Club Visitor Relationship Manager
          </h1>
          <p className="text-sm text-gray-400">
            Monitorea el crecimiento de tu comunidad, capta leads y fideliza a los tutores de mascotas.
          </p>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral text-white rounded-2xl hover:bg-coral-dark font-semibold text-sm transition-all shadow-md shadow-coral/10 cursor-pointer border-none"
          >
            ✨ Agregar Miembro
          </button>
        </div>
      </div>

      {/* Menú de Pestañas */}
      <div className="border-b border-gray-200 flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.active && setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition-all relative group cursor-pointer ${
              activeTab === tab.id
                ? 'border-coral text-coral bg-coral/5 rounded-t-2xl'
                : tab.active
                  ? 'border-transparent text-gray-500 hover:text-gray-800'
                  : 'border-transparent text-gray-300 cursor-not-allowed'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {!tab.active && (
              <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1">
                Próximamente
              </span>
            )}
            {tab.tooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-gray-900 text-white text-[10px] p-2 rounded-xl shadow-lg z-30 leading-snug">
                {tab.tooltip}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Contenido según Pestaña Activa */}
      {activeTab === 'miembros' ? (
        <div className="space-y-6">
          {/* Tarjetas de Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total de Miembros</p>
                <h3 className="text-3xl font-brand text-gray-800 mt-1">{miembros.length}</h3>
              </div>
              <div className="w-12 h-12 bg-coral/10 rounded-2xl flex items-center justify-center text-coral text-2xl">
                👥
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrados Hoy</p>
                <h3 className="text-3xl font-brand text-green-600 mt-1">+{registrosHoy}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 text-2xl">
                📈
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origen de Conversión</p>
                <h3 className="text-lg font-semibold text-gray-800 mt-2 truncate max-w-[180px]">
                  {miembros.length > 0 
                    ? [...new Set(miembros.map(m => m.benefit_origen).filter(Boolean))]
                        .map(b => ({ name: b, count: miembros.filter(m => m.benefit_origen === b).length }))
                        .sort((a,b) => b.count - a.count)[0]?.name || 'Web'
                    : 'Ninguno'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-2xl">
                📍
              </div>
            </div>
          </div>

          {/* Listado de Miembros */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Buscador */}
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
                      <th className="px-6 py-4">Registro</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredMiembros.map((miembro) => (
                      <tr key={miembro.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {miembro.nombre_tutor}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral/5 text-coral rounded-full text-xs font-bold font-ui">
                            🐾 {miembro.nombre_mascota}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">
                          {miembro.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-lg">
                            {miembro.benefit_origen || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                          {miembro.creado_en 
                            ? new Date(miembro.creado_en.seconds * 1000).toLocaleDateString('es-PE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(miembro.id, miembro.nombre_tutor, miembro.nombre_mascota)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                            title="Dar de baja miembro"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="text-6xl">🚀</div>
          <h3 className="text-xl font-brand text-gray-800">Sección en Construcción</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Estamos integrando funcionalidades CRM premium (embudos de carritos abandonados, estadísticas de campañas automatizadas e historial completo de interacciones) para optimizar la retención de clientes.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-coral/10 text-coral font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
              Módulo de Comercio Electrónico
            </span>
          </div>
        </div>
      )}

      {/* Modal de Registro Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-8 relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50 border-none cursor-pointer bg-transparent"
            >
              ✕
            </button>

            <div className="inline-flex items-center gap-1.5 bg-red-50 text-xs font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 text-coral border border-red-200/20">
              👥 CVRM Admin
            </div>

            <h3 className="font-brand text-2xl mb-1 text-gray-800">
              Registrar Miembro
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Añade un tutor y su mascota directamente al Club de Beneficios.
            </p>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre del tutor</label>
                <input
                  type="text"
                  required
                  value={newMember.tutor}
                  onChange={(e) => setNewMember(prev => ({ ...prev, tutor: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nombre de la Mascota (Alias)</label>
                <input
                  type="text"
                  required
                  value={newMember.mascota}
                  onChange={(e) => setNewMember(prev => ({ ...prev, mascota: e.target.value }))}
                  placeholder="Ej. Firulais"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej. juan@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Origen / Beneficio</label>
                <select
                  value={newMember.benefit}
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

              <button
                type="submit"
                disabled={savingMember}
                className="w-full py-4.5 mt-2 bg-coral hover:bg-coral-dark text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                {savingMember ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  'Registrar Miembro ✨'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
