import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'

const ADMIN_EMAIL_BYPASS = 'victorchavezd@gmail.com'

export default function AdminLayout() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBypass, setIsBypass] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // ── BYPASS LOCAL PERSISTENTE ──
    const bypassActive = localStorage.getItem('myp_admin_bypass') === 'true'
    if (bypassActive) {
      setUser({ email: ADMIN_EMAIL_BYPASS })
      setIsAdmin(true)
      setIsBypass(true)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true)
          const hasAdminClaim = !!idTokenResult.claims.admin
          const isBypassEmail = currentUser.email?.toLowerCase() === ADMIN_EMAIL_BYPASS.toLowerCase()

          if (hasAdminClaim || isBypassEmail) {
            setIsAdmin(true)
            setIsBypass(!hasAdminClaim && isBypassEmail)
          } else {
            setIsAdmin(false)
            setIsBypass(false)
          }
        } catch (err) {
          console.error('Error al verificar roles:', err)
          setIsAdmin(false)
        } finally {
          setLoading(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        setIsBypass(false)
        setLoading(false)
        navigate('/login')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const handleLogout = async () => {
    try {
      localStorage.removeItem('myp_admin_bypass')
      await signOut(auth)
      navigate('/login')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-body">Verificando credenciales de acceso...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-red-100 p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="font-brand text-2xl text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-500 font-body mb-6">
            No tienes permisos de administrador para acceder a esta sección comercial.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-semibold transition-all"
            >
              Ir a la Tienda Pública
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  const menuItems = [
    { path: '/admin', label: 'Pedidos / Dashboard', icon: '📦', end: true },
    { path: '/admin/caja', label: 'Caja Diaria', icon: '💰' },
    { path: '/admin/inventario', label: 'Inventario de Stock', icon: '🗂️' },
    { path: '/admin/configuracion', label: 'Configuración de Envíos/Cupones', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen flex bg-gray-50 font-body text-gray-700">
      {/* Sidebar para pantallas grandes */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm shrink-0">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <span className="text-3xl">🐶</span>
          <div>
            <h2 className="font-brand text-xl text-gray-800 leading-tight">Missy & Po</h2>
            <span className="text-xs text-coral font-semibold uppercase tracking-wider">Control Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold transition-all duration-250 ${
                  isActive
                    ? 'bg-coral/10 text-coral shadow-sm shadow-coral/5'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-2">
          <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
            <p className="text-gray-400">Usuario:</p>
            <p className="font-semibold text-gray-800 truncate" title={user.email}>{user.email}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-850 text-sm font-semibold transition-all"
          >
            🏠 Ir a la Tienda
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 text-red-500 text-sm font-semibold transition-all"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Sidebar para pantallas móviles (Overlay) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-100 shadow-xl transition-transform duration-350 ease-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐶</span>
            <div>
              <h2 className="font-brand text-xl text-gray-800 leading-tight">Missy & Po</h2>
              <span className="text-xs text-coral font-semibold uppercase tracking-wider">Control Panel</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1.5 rounded-lg hover:bg-gray-150 text-gray-500"
          >
            ✕
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold transition-all duration-250 ${
                  isActive
                    ? 'bg-coral/10 text-coral shadow-sm shadow-coral/5'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50 space-y-2">
          <div className="p-3 bg-gray-50 rounded-2xl text-xs space-y-1">
            <p className="text-gray-400">Usuario:</p>
            <p className="font-semibold text-gray-800 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { setSidebarOpen(false); navigate('/') }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-850 text-sm font-semibold transition-all"
          >
            🏠 Ir a la Tienda
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 text-red-500 text-sm font-semibold transition-all"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenedor de contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-650"
            >
              ☰
            </button>
            <span className="font-brand text-lg text-gray-800">Missy & Po Admin</span>
          </div>
          <span className="text-xl">🐶</span>
        </header>

        {/* Banner de Bypass */}
        {isBypass && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 text-amber-800 text-xs md:text-sm font-medium flex items-center gap-2 animate-pulse shrink-0">
            <span>⚠️</span>
            <span>
              <strong>Modo Bypass Activo:</strong> Estás logueado con {user.email}. Has accedido localmente mediante el bypass de desarrollo. Las operaciones de base de datos que requieren roles de administrador (como crear cupones, editar envíos o ver caja) rebotarán en producción a menos que asignes los claims de Firebase Auth mediante el script.
            </span>
          </div>
        )}

        {/* Área de contenido del panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
