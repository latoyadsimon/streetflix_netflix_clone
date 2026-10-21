import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthChange, signOutLocally, verifyUser } from '../lib/api.js'

// The signed-in user. supabase-js restores the stored session on load/refresh; before the app
// trusts it, Supabase Auth is asked to confirm who it belongs to. A session the server rejects
// (expired, revoked, deleted user) is cleared and the user is sent to Log in. If the server
// can't be reached, the stored session is used as is.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined until the first session check
  const [check, setCheck] = useState(null) // { id, user } once this login has been confirmed
  useEffect(() => onAuthChange(setSession), [])

  // Confirm once per login; token refreshes for the same user don't re-check.
  const sessionUserId = session?.user.id
  useEffect(() => {
    if (!sessionUserId) return undefined
    let cancelled = false
    verifyUser()
      .then((user) => {
        if (cancelled) return
        if (user?.id === sessionUserId) setCheck({ id: sessionUserId, user })
        else signOutLocally()
      })
      .catch(() => { if (!cancelled) setCheck({ id: sessionUserId, user: null }) })
    return () => { cancelled = true }
  }, [sessionUserId])

  const confirmed = Boolean(session) && check?.id === sessionUserId
  const value = useMemo(() => ({
    ready: session !== undefined && (!session || confirmed),
    user: confirmed ? check.user ?? session.user : null,
  }), [session, confirmed, check])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
