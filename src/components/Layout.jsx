import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Toast from './Toast.jsx'
import ProfileSelect from '../pages/ProfileSelect.jsx'
import { useProfile } from '../context/ProfileContext.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const { profile } = useProfile()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  if (!profile) return <ProfileSelect />
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <NavBar />
      <main id="main">
        <Outlet />
      </main>
      <Toast />
    </>
  )
}
