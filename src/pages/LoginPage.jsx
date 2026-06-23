import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'

// Email administrador configurado por el usuario
const ADMIN_EMAIL_BYPASS = 'victorchavezd@gmail.com'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    // ── BYPASS LOCAL PERSISTENTE ──
    const bypassActive = typeof window !== 'undefined' ? localStorage.getItem('myp_admin_bypass') === 'true' : false
    if (bypassActive) {
      setUser({ email: ADMIN_EMAIL_BYPASS })
      setIsAdmin(true)
      setCheckingRole(false)
      if (typeof window !== 'undefined') {
        window.location.href = '/admin'
      }
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setCheckingRole(true)
        try {
          const idTokenResult = await currentUser.getIdTokenResult(true)
          
          // El usuario es admin si tiene el claim admin en Firebase o si cumple el bypass de email
          const hasAdminClaim = !!idTokenResult.claims.admin
          const isBypassEmail = currentUser.email?.toLowerCase() === ADMIN_EMAIL_BYPASS.toLowerCase()
          
          if (hasAdminClaim || isBypassEmail) {
            setIsAdmin(true)
            if (typeof window !== 'undefined') {
              window.location.href = '/admin'
            }
          } else {
            setIsAdmin(false)
          }
        } catch (err) {
          console.error('Error verificando roles de usuario:', err)
          setIsAdmin(false)
        } finally {
          setCheckingRole(false)
        }
      } else {
        setIsAdmin(false)
        setCheckingRole(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const isBypassEmail = email.toLowerCase() === ADMIN_EMAIL_BYPASS.toLowerCase()

    // ── CONTROL DE INGRESO POR BYPASS LOCAL (CON AUTENTICACIÓN REAL) ──
    if (isBypassEmail && password === 'admin123') {
      try {
        let loggedUser;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          loggedUser = userCredential.user
        } catch (signInErr) {
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
            console.log('Creando cuenta bypass de desarrollo automáticamente...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            loggedUser = userCredential.user
          } else {
            throw signInErr
          }
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('myp_admin_bypass', 'true')
          window.location.href = '/admin'
        }
      } catch (err) {
        console.error('Error en login de bypass real:', err)
        setError('Error al sincronizar sesión real de desarrollo.')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      // Intentar iniciar sesión real en Firebase Auth
      let loggedUser;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        loggedUser = userCredential.user
      } catch (signInErr) {
        // Si el usuario del bypass no existe (o falla credencial) y la contraseña es admin123,
        // intentamos auto-registrarlo en Firebase Auth de forma transparente para desarrollo.
        if (isBypassEmail && password === 'admin123' && 
            (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
          console.log('Creando cuenta bypass de desarrollo automáticamente...');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          loggedUser = userCredential.user
        } else {
          throw signInErr
        }
      }
      
      const idTokenResult = await loggedUser.getIdTokenResult(true)
      const hasAdminClaim = !!idTokenResult.claims.admin
      const isBypassMail = loggedUser.email?.toLowerCase() === ADMIN_EMAIL_BYPASS.toLowerCase()

      if (hasAdminClaim || isBypassMail) {
        if (typeof window !== 'undefined') {
          window.location.href = '/admin'
        }
      } else {
        setError('Acceso denegado. Esta cuenta no tiene permisos de administrador.')
      }
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('myp_admin_bypass')
      }
      await signOut(auth)
      setUser(null)
      setIsAdmin(false)
      setError('')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-coral-50/20 via-white to-mint-50/20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 transition-all duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-50 text-coral text-3xl mb-4 animate-bounce">
            🐶
          </div>
          <h1 className="font-brand text-3xl text-gray-800">Panel Administrativo</h1>
          <p className="text-gray-500 font-body mt-2">Ingresa tus credenciales para acceder a la gestión comercial</p>
        </div>

        {checkingRole ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-body mt-4">Verificando sesión comercial...</p>
          </div>
        ) : user ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 text-sm">Sesión activa como:</p>
              <p className="font-semibold text-gray-800 mt-1">{user.email}</p>
              {isAdmin ? (
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✓ Administrador Habilitado
                </span>
              ) : (
                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  ⚠️ Sin Permisos de Admin
                </span>
              )}
            </div>

            {isAdmin ? (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/admin'
                  }
                }}
                className="w-full py-3.5 px-4 bg-coral hover:bg-coral-dark text-white rounded-2xl font-semibold shadow-md shadow-coral/20 transition-all active:scale-[0.98]"
              >
                Ir al Panel de Control
              </button>
            ) : (
              <p className="text-red-500 text-sm font-body">
                Comunícate con el soporte técnico para que habiliten el claim admin en tu cuenta.
              </p>
            )}

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-2">
                <span className="text-base mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1.5" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@missypo.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-gray-800"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-coral hover:bg-coral-dark disabled:bg-gray-300 text-white rounded-2xl font-semibold shadow-md shadow-coral/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>

            {/* Botón de Bypass de Desarrollo */}
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  setLoading(true)
                  setError('')
                  try {
                    try {
                      await signInWithEmailAndPassword(auth, ADMIN_EMAIL_BYPASS, 'admin123')
                    } catch (signInErr) {
                      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
                        console.log('Creando cuenta bypass de desarrollo automáticamente...');
                        await createUserWithEmailAndPassword(auth, ADMIN_EMAIL_BYPASS, 'admin123')
                      } else {
                        throw signInErr
                      }
                    }
                    localStorage.setItem('myp_admin_bypass', 'true')
                    window.location.href = '/admin'
                  } catch (err) {
                    console.error('Error al iniciar bypass:', err)
                    setError('Error al sincronizar sesión de desarrollo.')
                  } finally {
                    setLoading(false)
                  }
                }
              }}
              className="w-full mt-3 py-3 px-4 border border-dashed border-amber-300 text-amber-700 bg-amber-50/20 hover:bg-amber-50 hover:text-amber-800 rounded-2xl font-semibold text-xs transition-all active:scale-[0.98] text-center disabled:bg-gray-100 disabled:text-gray-400"
            >
              🛠️ Entrar con Bypass de Desarrollo (Con Firebase Auth Real)
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
