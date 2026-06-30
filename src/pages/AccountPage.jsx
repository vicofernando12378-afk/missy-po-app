import { useState, useEffect } from 'react'
import { listenAuth } from '../services/auth'
import useUserStore from '../store/userStore'
import useOrdersByUser from '../hooks/useOrdersByUser'

import AccountLayout from '../components/account/AccountLayout'
import AccountDashboard from '../components/account/AccountDashboard'

export default function AccountPage() {
  const [authUser, setAuthUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const { profile, isLoading: profileLoading, fetchProfile } = useUserStore()
  const { orders, isLoading: ordersLoading, refresh: refreshOrders } = useOrdersByUser(authUser?.uid)

  useEffect(() => {
    const unsubscribe = listenAuth((user) => {
      setAuthUser(user)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (authUser?.uid) {
      fetchProfile(authUser.uid)
    }
  }, [authUser?.uid])

  const isLoading = checkingAuth || profileLoading || ordersLoading

  // Loading state
  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
             style={{ borderColor: 'var(--color-coral)', borderTopColor: 'transparent' }} />
        <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
          Verificando tu sesión...
        </p>
      </div>
    )
  }

  // Not logged in
  if (!authUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">🔒</span>
        <h1 className="font-hero text-2xl text-center" style={{ color: 'var(--color-text-dark)' }}>
          Inicia sesión para ver tu cuenta
        </h1>
        <p className="text-sm font-body text-center max-w-md" style={{ color: 'var(--color-text-gray)' }}>
          Accede a tu historial de pedidos, puntos del Club y beneficios exclusivos.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-ui font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-dark))' }}
        >
          Iniciar Sesión
        </a>
      </div>
    )
  }

  // Calculate points from club membership
  const clubPoints = profile?.clubMember?.puntos || 0

  return (
    <AccountLayout activeSection="dashboard">
      <AccountDashboard
        profile={profile}
        orders={orders}
        points={clubPoints}
        pointsHistory={profile?.clubMember?.puntos_logs || []}
      />
    </AccountLayout>
  )
}
