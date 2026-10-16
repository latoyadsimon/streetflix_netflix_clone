import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import Toast from './Toast.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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
