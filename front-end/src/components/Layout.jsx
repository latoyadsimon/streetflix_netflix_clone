import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Toast from './Toast.jsx'
import './Layout.css'
import ProfileSelect from '../pages/ProfileSelect.jsx'
import Donate from '../pages/Donate.jsx'
import SignIn from '../pages/SignIn.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { useProfile } from '../context/ProfileContext.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const { ready, user } = useAuth()
  const { profile } = useProfile()
  const { status, retry } = useCatalog()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  if (!ready) {
    return (
      <main id="main" className="profiles" aria-busy="true">
        <p className="profiles-msg" role="status">Checking your session…</p>
      </main>
    )
  }
  if (!user) return <SignIn />
  // Donations belong to the login, so /donate works before a profile is picked.
  if (!profile && pathname === '/donate') {
    return (
      <main id="main" className="donate-standalone">
        <Link to="/" className="donate-back">&larr; Back</Link>
        <Donate />
      </main>
    )
  }
  if (!profile) return <ProfileSelect key={user.id} />
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
