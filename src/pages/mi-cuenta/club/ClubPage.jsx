import { useState, useEffect } from 'react'
import { listenAuth } from '../../../services/auth'
import { collection, doc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../../services/firebase'

import AccountLayout from '../../../components/account/AccountLayout'

export default function ClubPage() {
  const [authUser, setAuthUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [clubMember, setClubMember] = useState(null)
  const [pointsHistory, setPointsHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenAuth((user) => {
      setAuthUser(user)
      setCheckingAuth(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!authUser || checkingAuth) return

    const fetchClubData = async () => {
      try {
        const q = query(
          collection(db, 'myp_club_miembros'),
          where('email', '==', authUser.email?.toLowerCase())
        )
        const snap = await getDocs(q)

        if (!snap.empty) {
          const memberDoc = snap.docs[0]
          const memberData = { id: memberDoc.id, ...memberDoc.data() }
          setClubMember(memberData)

          const historyQ = query(
            collection(db, 'myp_club_miembros', memberDoc.id, 'puntos_logs'),
            orderBy('creado_en', 'desc'),
            limit(20)
          )
          const historySnap = await getDocs(historyQ)
          setPointsHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch (err) {
        console.error('Error fetching club data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClubData()
  }, [authUser, checkingAuth])

  if (checkingAuth || loading) {
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

  const points = clubMember?.puntos || 0

  const benefits = [
    { icon: '⭐', title: 'Acumula Puntos', desc: 'Gana 10 puntos por cada S/ 10 en compras.' },
    { icon: '🎁', title: 'Canjea Recompensas', desc: '100 puntos = S/ 10 de descuento.' },
    { icon: '🎂', title: 'Regalo de Cumpleaños', desc: 'Sorpresa especial para tu mascota.' },
    { icon: '🏷️', title: 'Descuentos Exclusivos', desc: 'Ofertas solo para miembros del Club.' }
  ]

  return (
    <AccountLayout activeSection="club">
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-hero text-2xl sm:text-3xl mb-2" style={{ color: 'var(--color-text-dark)' }}>
            Club de Beneficios
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
            Acumula puntos y canjéalos por descuentos exclusivos.
          </p>
        </div>

        {/* Points Card */}
        <div className="rounded-3xl overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #fffbeb, #fff5f5)' }}>
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                 style={{ backgroundColor: 'rgba(245,166,35,0.15)' }}>
              <span className="text-lg">⭐</span>
              <span className="text-xs font-ui font-bold" style={{ color: 'var(--color-gold)' }}>
                Club Missy & Po
              </span>
            </div>
            <div className="text-5xl font-hero font-black mb-2" style={{ color: 'var(--color-gold)' }}>
              {points}
            </div>
            <p className="text-lg font-ui font-bold" style={{ color: 'var(--color-text-dark)' }}>
              puntos acumulados
            </p>
            <p className="text-sm font-body mt-2" style={{ color: 'var(--color-text-gray)' }}>
              Equivalente a S/ {(points * 0.1).toFixed(2)} en descuentos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Benefits */}
          <div>
            <h2 className="font-ui font-bold text-lg mb-4" style={{ color: 'var(--color-text-dark)' }}>
              Tus Beneficios
            </h2>
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="bg-white rounded-2xl border p-4 flex items-start gap-4"
                     style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <h3 className="font-ui font-bold text-sm" style={{ color: 'var(--color-text-dark)' }}>
                      {b.title}
                    </h3>
                    <p className="text-xs font-body" style={{ color: 'var(--color-text-gray)' }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points History */}
          <div>
            <h2 className="font-ui font-bold text-lg mb-4" style={{ color: 'var(--color-text-dark)' }}>
              Historial de Puntos
            </h2>
            {pointsHistory.length > 0 ? (
              <div className="bg-white rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
                <div className="space-y-3">
                  {pointsHistory.map((entry) => {
                    const isPositive = entry.puntos > 0
                    const fecha = entry.creado_en?.toDate
                      ? entry.creado_en.toDate().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    return (
                      <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0"
                           style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body truncate" style={{ color: 'var(--color-text-dark)' }}>
                            {entry.motivo || 'Movimiento'}
                          </p>
                          <p className="text-xs font-body" style={{ color: 'var(--color-text-light)' }}>
                            {fecha}
                          </p>
                        </div>
                        <span className={`text-sm font-ui font-bold ml-3 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{entry.puntos}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-4xl mb-3 block">📊</span>
                <p className="text-sm font-body" style={{ color: 'var(--color-text-gray)' }}>
                  Aún no tienes movimientos de puntos.
                </p>
                <a href="/tienda" className="inline-block mt-3 text-sm font-ui font-bold" style={{ color: 'var(--color-coral)' }}>
                  Compra ahora para acumular →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}
