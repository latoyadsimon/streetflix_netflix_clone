import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

// In-memory only: a page refresh clears the chosen profile and returns to the picker.
// The choice is dropped as soon as its login is no longer the signed-in user (log out, or a
// different login), so no other login's profile is ever kept or shown.
const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  if (profile && profile.owner_id !== user?.id) setProfile(null)
  const select = useCallback((next) => setProfile(next), [])
  const clear = useCallback(() => setProfile(null), [])
  const value = useMemo(() => ({ profile, select, clear }), [profile, select, clear])
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
