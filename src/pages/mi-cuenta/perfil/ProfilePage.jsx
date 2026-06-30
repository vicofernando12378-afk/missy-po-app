import { useState, useEffect } from 'react'
import { listenAuth } from '../../../services/auth'
import useUserStore from '../../../store/userStore'

import AccountLayout from '../../../components/account/AccountLayout'

export default function ProfilePage() {
  const [authUser, setAuthUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const { profile, isLoading: profileLoading, fetchProfile, updateProfile } = useUserStore()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [documentoTipo, setDocumentoTipo] = useState('')
  const [documentoNumero, setDocumentoNumero] = useState('')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifWhatsapp, setNotifWhatsapp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = listenAuth((user) => {
      setAuthUser(user)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (authUser?.uid) fetchProfile(authUser.uid)
  }, [authUser?.uid])

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '')
      setApellido(profile.apellido || '')
      setTelefono(profile.telefono || '')
      setDocumentoTipo(profile.documento_tipo || '')
      setDocumentoNumero(profile.documento_numero || '')
      setNotifEmail(profile.preferencias?.notificaciones_email ?? true)
      setNotifWhatsapp(profile.preferencias?.notificaciones_whatsapp ?? false)
    }
  }, [profile])

  if (checkingAuth || profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--color-coral)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!authUser) {
    window.location.href = '/login'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await updateProfile(authUser.uid, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        documento_tipo: documentoTipo,
        documento_numero: documentoNumero.trim(),
        preferencias: {
          notificaciones_email: notifEmail,
          notificaciones_whatsapp: notifWhatsapp,
          idioma: 'es'
        }
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountLayout activeSection="perfil">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-hero text-2xl sm:text-3xl mb-2" style={{ color: 'var(--color-text-dark)' }}>
            Mi Perfil
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
            Actualiza tu información personal y preferencias.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  ⚠️ {error}
                </div>
              )}
              {saved && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100">
                  ✅ Perfil actualizado correctamente
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Nombre</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Apellido</label>
                  <input type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Correo Electrónico</label>
                <input type="email" value={authUser.email || ''} disabled
                       className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-500 cursor-not-allowed" />
                <p className="text-xs font-body mt-1" style={{ color: 'var(--color-text-light)' }}>
                  El correo no se puede cambiar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Celular</label>
                <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                       placeholder="987654321"
                       className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Tipo Documento</label>
                  <select value={documentoTipo} onChange={e => setDocumentoTipo(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm">
                    <option value="">Seleccionar</option>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-ui font-bold text-gray-600 uppercase mb-1.5">Número Documento</label>
                  <input type="text" value={documentoNumero} onChange={e => setDocumentoNumero(e.target.value)}
                         placeholder="12345678"
                         className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm" />
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
                  Preferencias de Notificación
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)}
                           className="w-4 h-4 rounded text-red-500 focus:ring-red-200" />
                    <span className="text-sm font-ui" style={{ color: 'var(--color-text-dark)' }}>
                      Recibir notificaciones por correo
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notifWhatsapp} onChange={e => setNotifWhatsapp(e.target.checked)}
                           className="w-4 h-4 rounded text-red-500 focus:ring-red-200" />
                    <span className="text-sm font-ui" style={{ color: 'var(--color-text-dark)' }}>
                      Recibir ofertas por WhatsApp
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" disabled={saving}
                      className="w-full py-3.5 rounded-xl text-sm font-ui font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>

          {/* Sidebar info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
                Cuenta
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-body" style={{ color: 'var(--color-text-gray)' }}>Miembro desde</span>
                  <span className="font-ui font-semibold" style={{ color: 'var(--color-text-dark)' }}>
                    {profile?.creado_en?.toDate
                      ? profile.creado_en.toDate().toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-body" style={{ color: 'var(--color-text-gray)' }}>Pedidos totales</span>
                  <span className="font-ui font-semibold" style={{ color: 'var(--color-text-dark)' }}>—</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
                Accesos Rápidos
              </h3>
              <div className="space-y-2">
                <a href="/mi-cuenta/pedidos" className="block py-2 px-3 rounded-xl text-sm font-ui font-medium hover:bg-gray-50 transition-colors"
                   style={{ color: 'var(--color-text-gray)' }}>
                  📦 Mis Pedidos
                </a>
                <a href="/mi-cuenta/direcciones" className="block py-2 px-3 rounded-xl text-sm font-ui font-medium hover:bg-gray-50 transition-colors"
                   style={{ color: 'var(--color-text-gray)' }}>
                  🏠 Mis Direcciones
                </a>
                <a href="/mi-cuenta/mascotas" className="block py-2 px-3 rounded-xl text-sm font-ui font-medium hover:bg-gray-50 transition-colors"
                   style={{ color: 'var(--color-text-gray)' }}>
                  🐾 Mis Mascotas
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
