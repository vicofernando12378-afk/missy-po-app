import { useState, useEffect } from 'react'
import { listenAuth } from '../services/auth'
import useUserStore from '../store/userStore'
import useOrdersByUser from '../hooks/useOrdersByUser'

import AccountLayout from '../components/account/AccountLayout'
import AccountDashboard from '../components/account/AccountDashboard'

// Imports de subpáginas
import OrdersPage from './mi-cuenta/pedidos/OrdersPage.jsx'
import OrderDetailPage from './mi-cuenta/pedidos/OrderDetailPage.jsx'
import ClubPage from './mi-cuenta/club/ClubPage.jsx'
import PetsPage from './mi-cuenta/mascotas/PetsPage.jsx'
import AddressesPage from './mi-cuenta/direcciones/AddressesPage.jsx'
import ProfilePage from './mi-cuenta/perfil/ProfilePage.jsx'

export default function AccountPage() {
  const [authUser, setAuthUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [currentHash, setCurrentHash] = useState('')

  const { profile, isLoading: profileLoading, fetchProfile } = useUserStore()
  const { orders, isLoading: ordersLoading } = useOrdersByUser(authUser?.uid)

  // Sincronizar hash de la URL
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#dashboard')
    }
    
    // Leer al montar
    handleHashChange()
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const unsubscribe = listenAuth((user) => {
      setAuthUser(user)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (authUser?.uid) {
      fetchProfile(authUser.uid, authUser.email)
    }
  }, [authUser?.uid])

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

  // Parsear hash para obtener la sección y parámetros (ej: #pedido-detalle?id=123)
  const tab = currentHash.split('?')[0] || '#dashboard'
  const params = new URLSearchParams(currentHash.split('?')[1] || '')
  
  const clubPoints = profile?.clubMember?.puntos || 0

  // Renderizar sección activa
  const renderSectionContent = () => {
    switch (tab) {
      case '#pedidos':
        return <OrdersPage authUser={authUser} profile={profile} orders={orders} ordersLoading={ordersLoading} />
      case '#pedido-detalle':
        const orderId = params.get('id')
        return <OrderDetailPage forceOrderId={orderId} authUser={authUser} profile={profile} />
      case '#club':
        return <ClubPage authUser={authUser} profile={profile} />
      case '#mascotas':
        return <PetsPage authUser={authUser} profile={profile} />
      case '#direcciones':
        return <AddressesPage authUser={authUser} profile={profile} />
      case '#perfil':
        return <ProfilePage authUser={authUser} profile={profile} />
      case '#dashboard':
      default:
        return (
          <AccountDashboard
            profile={profile}
            orders={orders}
            points={clubPoints}
            pointsHistory={profile?.clubMember?.puntos_logs || []}
          />
        )
    }
  }

  // Traducir hash a la sección activa del Sidebar
  const activeSectionMap = {
    '#dashboard': 'dashboard',
    '#pedidos': 'pedidos',
    '#pedido-detalle': 'pedidos',
    '#club': 'club',
    '#mascotas': 'mascotas',
    '#direcciones': 'direcciones',
    '#perfil': 'perfil',
  }
  const activeSection = activeSectionMap[tab] || 'dashboard'

  return (
    <AccountLayout activeSection={activeSection}>
      {renderSectionContent()}
    </AccountLayout>
  )
}
