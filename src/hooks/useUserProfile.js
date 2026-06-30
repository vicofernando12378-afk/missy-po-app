import { useEffect, useCallback } from 'react'
import useUserStore from '../store/userStore'

export default function useUserProfile(uid) {
  const { profile, isLoading, error, fetchProfile, updateProfile, saveProfile } = useUserStore()

  useEffect(() => {
    if (uid && (!profile || profile.uid !== uid)) {
      fetchProfile(uid)
    }
  }, [uid])

  const updateField = useCallback(async (updates) => {
    if (!uid) return
    await updateProfile(uid, updates)
  }, [uid, updateProfile])

  const save = useCallback(async (data) => {
    if (!uid) return
    return await saveProfile(uid, data)
  }, [uid, saveProfile])

  return {
    profile,
    isLoading,
    error,
    updateField,
    save,
    isLoaded: !!profile && profile.uid === uid
  }
}
