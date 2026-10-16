import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

// In-memory only: a page refresh resets the watchlist and any toast.
const WatchlistContext = createContext(null)

export function WatchlistProvider({ children }) {
  const [ids, setIds] = useState([])
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const notify = useCallback((message) => {
    clearTimeout(timer.current)
    setToast({ message, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const add = useCallback((title) => {
    setIds((prev) => (prev.includes(title.id) ? prev : [...prev, title.id]))
    notify(`${title.title} added to My List`)
  }, [notify])

  const remove = useCallback((title) => {
    setIds((prev) => prev.filter((id) => id !== title.id))
    notify(`${title.title} removed from My List`)
  }, [notify])

  const has = useCallback((id) => ids.includes(id), [ids])
  const toggle = useCallback((title) => (ids.includes(title.id) ? remove(title) : add(title)), [ids, add, remove])

  const value = useMemo(() => ({ ids, has, add, remove, toggle, toast, notify }), [ids, has, add, remove, toggle, toast, notify])
  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider')
  return ctx
}
