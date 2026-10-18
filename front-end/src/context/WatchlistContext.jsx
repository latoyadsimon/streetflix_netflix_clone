import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useProfile } from './ProfileContext.jsx'
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from '../lib/api.js'

// The list (title slugs) is stored per profile in Supabase `watchlist_items`; the state here is an
// optimistic copy of the active profile's list. The toast is in-memory only.
const WatchlistContext = createContext(null)
const EMPTY = []

export function WatchlistProvider({ children }) {
  const { profile } = useProfile()
  const profileId = profile?.id
  // The list is tagged with its owner, so a profile switch never shows the previous profile's list.
  const [list, setList] = useState({ owner: null, ids: [] })
  const ids = list.owner === profileId ? list.ids : EMPTY
  const loading = Boolean(profileId) && list.owner !== profileId
  const setIds = useCallback((update) => {
    setList((cur) => (cur.owner === profileId ? { owner: cur.owner, ids: update(cur.ids) } : cur))
  }, [profileId])
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const notify = useCallback((message) => {
    clearTimeout(timer.current)
    setToast({ message, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  // Load the active profile's list whenever the profile changes.
  useEffect(() => {
    if (!profileId) return undefined
    let cancelled = false
    fetchWatchlist(profileId)
      .catch(() => { notify("We couldn't load your list. Try again."); return [] })
      .then((slugs) => { if (!cancelled) setList({ owner: profileId, ids: slugs }) })
    return () => { cancelled = true }
  }, [profileId, notify])

  // Optimistic add; a failed write rolls back and shows an error toast.
  const add = useCallback((title) => {
    setIds((prev) => (prev.includes(title.id) ? prev : [...prev, title.id]))
    notify(`${title.title} added to My List`)
    addToWatchlist(profileId, title.uuid).catch(() => {
      setIds((prev) => prev.filter((id) => id !== title.id))
      notify(`Couldn't add ${title.title} to My List. Try again.`)
    })
  }, [notify, profileId, setIds])

  const remove = useCallback((title) => {
    setIds((prev) => prev.filter((id) => id !== title.id))
    notify(`${title.title} removed from My List`)
    removeFromWatchlist(profileId, title.uuid).catch(() => {
      setIds((prev) => (prev.includes(title.id) ? prev : [...prev, title.id]))
      notify(`Couldn't remove ${title.title} from My List. Try again.`)
    })
  }, [notify, profileId, setIds])

  const has = useCallback((id) => ids.includes(id), [ids])
  const toggle = useCallback((title) => (ids.includes(title.id) ? remove(title) : add(title)), [ids, add, remove])

  const value = useMemo(() => ({ ids, loading, has, add, remove, toggle, toast, notify }), [ids, loading, has, add, remove, toggle, toast, notify])
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider')
  return ctx
}
