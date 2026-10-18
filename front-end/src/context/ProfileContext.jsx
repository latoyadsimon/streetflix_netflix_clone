import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// In-memory only: a page refresh clears the chosen profile and returns to the picker.
const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null)
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
