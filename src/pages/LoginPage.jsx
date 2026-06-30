import { useState, useEffect } from 'react'
import { loginWithEmail, registerWithEmail, listenAuth, logout, resetPassword } from '../services/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = listenAuth((currentUser) => {
      setUser(currentUser)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        // Registro de usuario nuevo
        await registerWithEmail(email, password)
        window.location.href = '/'
      } else {
        // Inicio de sesión normal
        await loginWithEmail(email, password)
        window.location.href = '/'
      }
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.')
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.')
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setResetEmailSent(false)

    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(email.trim())
      setResetEmailSent(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/user-not-found') {
        setError('El correo electrónico ingresado no está registrado en el Club.')
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico es incorrecto.')
      } else {
        setError('Ocurrió un error al enviar el correo. Inténtalo de nuevo más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      setError('')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-coral-50/20 via-white to-mint-50/20 font-body">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-coral to-yellow-450"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-50 text-coral text-3xl mb-4 animate-bounce">
            🐶
          </div>
          <h1 className="font-brand text-3xl text-gray-800">
            {checkingAuth
              ? 'Cargando...'
              : user
                ? 'Tu Cuenta'
                : isForgotPassword
                  ? 'Recuperar Contraseña'
                  : isRegister
                    ? 'Crear Cuenta'
                    : 'Inicia Sesión'}
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            {user
              ? 'Gestiona tu sesión y tus datos de socio'
              : isForgotPassword
                ? 'Ingresa tu correo para enviarte un enlace de restablecimiento'
                : isRegister
                  ? 'Regístrate en el Club Missy & Po para acumular puntos en todas tus compras'
                  : 'Ingresa para ver tus puntos acumulados y tus pedidos'}
          </p>
        </div>

        {checkingAuth ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm mt-4">Verificando estado de la cuenta...</p>
          </div>
        ) : user ? (
          <div className="space-y-5 text-center">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Sesión Iniciada como</p>
              <p className="font-semibold text-gray-800 text-base mt-1 truncate" title={user.email}>{user.email}</p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                ✓ Cliente / Socio Activo
              </span>
            </div>

            <a
              href="/"
              className="w-full block py-3.5 px-4 bg-coral hover:bg-coral-dark text-white rounded-2xl font-semibold shadow-md shadow-coral/10 hover:shadow-coral/25 transition-all text-center active:scale-[0.98]"
            >
              Ir a la Tienda
            </a>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-semibold transition-all active:scale-[0.98]"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-2">
                <span className="text-base mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {resetEmailSent && (
              <div className="p-4 bg-emerald-50 text-emerald-850 text-sm rounded-2xl border border-emerald-100 flex items-start gap-2">
                <span className="text-base mt-0.5">✓</span>
                <span>¡Listo! Te hemos enviado un correo con instrucciones para restablecer tu contraseña.</span>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-1.5" htmlFor="reset-email">
                Correo Electrónico
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-gray-850"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-coral hover:bg-coral-dark disabled:bg-gray-250 text-white rounded-2xl font-semibold shadow-md shadow-coral/10 hover:shadow-coral/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enviando correo...</span>
                </>
              ) : (
                <span>Enviar Correo</span>
              )}
            </button>

            <div className="text-center mt-6 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setError('')
                  setResetEmailSent(false)
                }}
                className="text-sm font-semibold text-coral hover:text-coral-dark transition-colors duration-200"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-2 animate-shake">
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
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-gray-850"
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
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all text-gray-850"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true)
                  setError('')
                  setResetEmailSent(false)
                }}
                className="text-xs font-semibold text-coral hover:text-coral-dark transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-coral hover:bg-coral-dark disabled:bg-gray-250 text-white rounded-2xl font-semibold shadow-md shadow-coral/10 hover:shadow-coral/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isRegister ? 'Creando cuenta...' : 'Iniciando sesión...'}</span>
                </>
              ) : (
                <span>{isRegister ? 'Registrarse' : 'Ingresar'}</span>
              )}
            </button>

            <div className="text-center mt-6 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                }}
                className="text-sm font-semibold text-coral hover:text-coral-dark transition-colors duration-200"
              >
                {isRegister 
                  ? '¿Ya tienes una cuenta? Inicia sesión' 
                  : '¿No tienes una cuenta? Regístrate aquí'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
