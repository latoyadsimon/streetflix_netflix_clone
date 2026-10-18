import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Toast from './Toast.jsx'
import './Layout.css'
import ProfileSelect from '../pages/ProfileSelect.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useProfile } from '../context/ProfileContext.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const { profile } = useProfile()
  const { status, retry } = useCatalog()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  if (!profile) return <ProfileSelect />
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <NavBar />
      <main id="main">
        {status === 'ready' && <Outlet />}
        {status === 'loading' && (
          <div className="page" aria-busy="true" aria-label="Loading titles">
            <div className="catalog-skeleton" />
          </div>
        )}
        {status === 'error' && (
          <div className="page catalog-error" role="alert">
            <p>We couldn't load the catalog. Check your connection and try again.</p>
            <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>
          </div>
        )}
      </main>
      <Toast />
    </>
  )
}
