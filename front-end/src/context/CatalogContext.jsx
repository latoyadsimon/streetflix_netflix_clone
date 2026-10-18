import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCatalog } from '../lib/api.js'
import { buildCatalog } from '../data/catalog.js'

// Fetched once on app start and kept in memory; a page refresh fetches it again.
const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then((data) => { if (!cancelled) setRows(data) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [attempt])

  const retry = useCallback(() => { setError(false); setRows(null); setAttempt((n) => n + 1) }, [])

  const value = useMemo(() => {
    const status = rows ? 'ready' : error ? 'error' : 'loading'
    return { ...buildCatalog(rows ?? []), status, retry }
  }, [rows, error, retry])
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider')
  return ctx
}
