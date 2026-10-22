import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useProfile } from '../context/ProfileContext.jsx'
import { signOut } from '../lib/api.js'
import './NavBar.css'

const LINKS = [
  { to: '/', label: 'Home', end: true, icon: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z' },
  { to: '/movies', label: 'Movies', icon: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16' },
  { to: '/tv-shows', label: 'TV Shows', icon: 'M3 6h18v12H3zM8 21h8M12 18v3' },
  { to: '/search', label: 'Search', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5' },
  { to: '/watchlist', label: 'My List', icon: 'M3 18L2 7l5 4 5-7 5 7 5-4-1 11z' },
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

// Active profile button that opens a small panel: who is signed in, Switch profile, Log out.
function AccountMenu() {
  const { user } = useAuth()
  const { profile, clear } = useProfile()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const toggleBtn = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e) => { if (!root.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); toggleBtn.current.focus() } }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="account" ref={root}>
      <button type="button" ref={toggleBtn} className="profile-switch" aria-expanded={open}
        aria-controls="account-panel" onClick={() => setOpen((o) => !o)}
        aria-label={`Account: ${profile.username}`}>
        <img src={profile.avatar_url} alt="" width="32" height="32" />
        <span>{profile.username}</span>
      </button>
      {open && (
        <div className="account-panel" id="account-panel">
          <p className="account-who">Signed in as <strong>{user.email}</strong></p>
          <button type="button" onClick={clear}>Switch profile</button>
          <button type="button" onClick={() => signOut()}>Log out</button>
        </div>
      )}
    </div>
  )
}

export default function NavBar() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="logo" aria-label="Streetflix home">
          <svg viewBox="0 0 24 16" width="22" height="15" aria-hidden="true" className="logo-crown">
            <path d="M1 15L0 3l6 5 6-7 6 7 6-5-1 12z" fill="currentColor" />
          </svg>
          <span>Streetflix</span>
        </Link>
        <nav aria-label="Primary" className="nav-desktop">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <Link to="/donate" className="donate-link" aria-label="Donate — buy us a coffee">
          <img src="/coffee-cup.png" alt="" width="30" height="38" />
        </Link>
        <AccountMenu />
      </header>
      <nav aria-label="Primary mobile" className="tabbar">
        {LINKS.map(({ to, label, end, icon }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon d={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
