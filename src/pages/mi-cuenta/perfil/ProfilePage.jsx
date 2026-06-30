import { useState, useEffect } from 'react';

import useUserStore from '../../../store/userStore';

export default function ProfilePage({ authUser, profile }) {
  const { updateProfile } = useUserStore();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documentoTipo, setDocumentoTipo] = useState('');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '');
      setApellido(profile.apellido || '');
      setTelefono(profile.telefono || '');
      setDocumentoTipo(profile.documento_tipo || '');
      setDocumentoNumero(profile.documento_numero || '');
      setNotifEmail(profile.preferencias?.notificaciones_email ?? true);
      setNotifWhatsapp(profile.preferencias?.notificaciones_whatsapp ?? false);
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

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
          idioma: 'es',
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
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
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                ⚠️ {error}
              </div>
            )}
            {saved && (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-100">
                ✓ ¡Cambios guardados con éxito!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-ui font-bold text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-coral transition-colors text-gray-800"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-ui font-bold text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-coral transition-colors text-gray-800"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-ui font-bold text-gray-700 mb-1">Correo Electrónico (No editable)</label>
              <input
                type="email"
                disabled
                value={profile?.email || authUser.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                style={{ borderColor: 'var(--color-border)' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-ui font-bold text-gray-700 mb-1">Celular</label>
                <input
                  type="tel"
                  placeholder="9 dígitos"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-coral transition-colors text-gray-800"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-ui font-bold text-gray-700 mb-1">Tipo Doc.</label>
                <select
                  value={documentoTipo}
                  onChange={(e) => setDocumentoTipo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-coral transition-colors text-gray-800 bg-white"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <option value="">Seleccionar</option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-ui font-bold text-gray-700 mb-1">Nro Documento</label>
                <input
                  type="text"
                  value={documentoNumero}
                  onChange={(e) => setDocumentoNumero(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-coral transition-colors text-gray-800"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-ui font-bold text-sm mb-3" style={{ color: 'var(--color-text-dark)' }}>
                Preferencias de Notificación
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="w-4 h-4 accent-coral"
                  />
                  Recibir ofertas y promociones por correo electrónico
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifWhatsapp}
                    onChange={(e) => setNotifWhatsapp(e.target.checked)}
                    className="w-4 h-4 accent-coral"
                  />
                  Recibir actualizaciones de mis pedidos por WhatsApp
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumen lateral */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="font-ui font-bold text-sm mb-4" style={{ color: 'var(--color-text-dark)' }}>
              Resumen de Cuenta
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
              <a href="/mi-cuenta#pedidos" className="block py-2 px-3 rounded-xl text-sm font-ui font-medium hover:bg-gray-50 transition-colors"
                 style={{ color: 'var(--color-text-gray)' }}>
                📦 Mis Pedidos
              </a>
              <a href="/mi-cuenta#direcciones" className="block py-2 px-3 rounded-xl text-sm font-ui font-medium hover:bg-gray-50 transition-colors"
                 style={{ color: 'var(--color-text-gray)' }}>
                🏠 Mis Direcciones
              </a>
              <a href="/mi-cuenta#mascotas" className="block py-2 px-3 rounded-xl text-sm font-ui font-medium hover:bg-gray-50 transition-colors"
                 style={{ color: 'var(--color-text-gray)' }}>
                🐾 Mis Mascotas
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
