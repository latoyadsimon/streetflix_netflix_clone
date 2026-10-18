import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useProfile } from '../context/ProfileContext.jsx'
import './ProfileSelect.css'

export default function ProfileSelect() {
  const { select } = useProfile()
  const [profiles, setProfiles] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('users')
      .select('id, username, avatar_url')
      .order('created_at')
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(true)
        else setProfiles(data)
      })
    return () => { cancelled = true }
  }, [attempt])

  const retry = () => { setError(false); setProfiles(null); setAttempt((n) => n + 1) }

  return (
    <main className="profiles" id="main">
      <h1 className="profiles-title">Who's watching?</h1>
      {error && (
        <div className="profiles-msg" role="alert">
          <p>We couldn't load the profiles. Check your connection and try again.</p>
          <button type="button" className="profiles-retry" onClick={retry}>Try again</button>
        </div>
      )}
      {!error && !profiles && (
        <ul className="profiles-grid" aria-label="Loading profiles">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i}><span className="profile-avatar profile-skeleton" /></li>
          ))}
        </ul>
      )}
      {profiles && profiles.length === 0 && <p className="profiles-msg">No profiles yet.</p>}
      {profiles && profiles.length > 0 && (
        <ul className="profiles-grid">
          {profiles.map((p) => (
            <li key={p.id}>
              <button type="button" className="profile-btn" onClick={() => select(p)}>
                <img className="profile-avatar" src={p.avatar_url} alt="" width="160" height="160" />
                <span className="profile-name">{p.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
