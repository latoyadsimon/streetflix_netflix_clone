import { Outlet } from 'react-router-dom'
import NavBar from './NavBar.jsx'

export default function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <NavBar />
      <main id="main">
        <Outlet />
      </main>
    </>
  )
}
