import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  getUserProfile, upsertUserProfile, updateUserProfile,
  addAddress, removeAddress, addPet, removePet, initializeUserProfile
} from '../services/userProfile'

const useUserStore = create(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      fetchProfile: async (uid, email) => {
        if (!uid) return null
        const { isLoading } = get()
        if (isLoading) return get().profile

        set({ isLoading: true, error: null })
        try {
          let profile = await getUserProfile(uid)
          if (!profile && email) {
            // Inicializar/migrar perfil de forma persistida en Firestore
            profile = await initializeUserProfile(uid, email)
          } else if (!profile) {
            profile = { uid, direcciones: [], mascotas: [], preferencias: {} }
          }

          // Cargar datos de puntos del club por email
          const userEmail = email || profile.email
          if (userEmail) {
            try {
              const q = query(
                collection(db, 'myp_club_miembros'),
                where('email', '==', userEmail.trim().toLowerCase())
              )
              const snap = await getDocs(q)
              if (!snap.empty) {
                const memberDoc = snap.docs[0]
                const memberData = { id: memberDoc.id, ...memberDoc.data() }

                const historyQ = query(
                  collection(db, 'myp_club_miembros', memberDoc.id, 'puntos_logs'),
                  orderBy('creado_en', 'desc'),
                  firestoreLimit(20)
                )
                const historySnap = await getDocs(historyQ)
                const logs = historySnap.docs.map(d => ({ id: d.id, ...d.data() }))

                profile.clubMember = {
                  ...memberData,
                  puntos_logs: logs
                }
              }
            } catch (clubErr) {
              console.error('Error fetching club data in store:', clubErr)
            }
          }

          set({ profile, isLoading: false })
          return profile
        } catch (err) {
          console.error('Error fetching profile:', err)
          set({ error: err.message, isLoading: false })
          return null
        }
      },

      updateProfile: async (uid, updates) => {
        try {
          await updateUserProfile(uid, updates)
          set(state => ({
            profile: state.profile ? { ...state.profile, ...updates } : null
          }))
        } catch (err) {
          console.error('Error updating profile:', err)
          set({ error: err.message })
          throw err
        }
      },

      saveProfile: async (uid, data) => {
        try {
          const saved = await upsertUserProfile(uid, data)
          set({ profile: saved })
          return saved
        } catch (err) {
          console.error('Error saving profile:', err)
          set({ error: err.message })
          throw err
        }
      },

      addAddress: async (uid, address) => {
        try {
          const direcciones = await addAddress(uid, address)
          set(state => ({
            profile: state.profile ? { ...state.profile, direcciones } : null
          }))
          return direcciones
        } catch (err) {
          console.error('Error adding address:', err)
          set({ error: err.message })
          throw err
        }
      },

      removeAddress: async (uid, index) => {
        try {
          const direcciones = await removeAddress(uid, index)
          set(state => ({
            profile: state.profile ? { ...state.profile, direcciones } : null
          }))
          return direcciones
        } catch (err) {
          console.error('Error removing address:', err)
          set({ error: err.message })
          throw err
        }
      },

      addPet: async (uid, pet) => {
        try {
          const mascotas = await addPet(uid, pet)
          set(state => ({
            profile: state.profile ? { ...state.profile, mascotas } : null
          }))
          return mascotas
        } catch (err) {
          console.error('Error adding pet:', err)
          set({ error: err.message })
          throw err
        }
      },

      removePet: async (uid, index) => {
        try {
          const mascotas = await removePet(uid, index)
          set(state => ({
            profile: state.profile ? { ...state.profile, mascotas } : null
          }))
          return mascotas
        } catch (err) {
          console.error('Error removing pet:', err)
          set({ error: err.message })
          throw err
        }
      },

      getDefaultAddress: () => {
        const { profile } = get()
        if (!profile?.direcciones?.length) return null
        return profile.direcciones.find(d => d.es_default) || profile.direcciones[0]
      },

      clearProfile: () => set({ profile: null, error: null })
    }),
    {
      name: 'myp-user-profile',
      partialize: (state) => ({
        profile: state.profile
      })
    }
  )
)

export default useUserStore
