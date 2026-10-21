import { useEffect, useState } from 'react'
import { createProfile, fetchProfiles, signOut } from '../lib/api.js'
import { useProfile } from '../context/ProfileContext.jsx'
import { AVATARS } from '../data/avatars.js'
import './ProfileSelect.css'

// "Who's watching?" for the signed-in login: its profiles, an add-profile form and sign out.
export default function ProfileSelect() {
  const { select } = useProfile()
  const [profiles, setProfiles] = useState(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchProfiles()
      .then((data) => { if (!cancelled) setProfiles(data) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [attempt])

  const retry = () => { setError(false); setProfiles(null); setAttempt((n) => n + 1) }
  const added = (profile) => { setProfiles((cur) => [...cur, profile]); setAdding(false) }

  return (
    <main className="profiles" id="main">
      <h1 className="profiles-title">{adding ? 'Add a profile' : "Who's watching?"}</h1>
      {error && (
        <div className="profiles-msg" role="alert">
          <p>We couldn't load the profiles. Check your connection and try again.</p>
          <button type="button" className="profiles-retry" onClick={retry}>Try again</button>
        </div>
      )}
      {!error && !profiles && (
        <ul className="profiles-grid" aria-label="Loading profiles">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}><span className="profile-avatar profile-skeleton" /></li>
          ))}
        </ul>
      )}
      {profiles && adding && (
        <AddProfile taken={profiles.map((p) => p.username)} onAdded={added} onCancel={() => setAdding(false)} />
      )}
      {profiles && !adding && (
        <ul className="profiles-grid">
          {profiles.map((p) => (
            <li key={p.id}>
              <button type="button" className="profile-btn" onClick={() => select(p)}>
                <img className="profile-avatar" src={p.avatar_url || AVATARS[0].url} alt="" width="160" height="160" />
                <span className="profile-name">{p.username}</span>
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="profile-btn" onClick={() => setAdding(true)}>
              <span className="profile-avatar profile-add" aria-hidden="true">+</span>
              <span className="profile-name">Add profile</span>
            </button>
          </li>
        </ul>
      )}
      {!adding && (
        <button type="button" className="btn btn-secondary" onClick={() => signOut()}>
          Log out
        </button>
      )}
    </main>
  )
}

function AddProfile({ taken, onAdded, onCancel }) {
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0].url)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const name = username.trim()
    if (taken.includes(name)) { setError('You already have a profile with that name.'); return }
    setBusy(true)
    setError('')
    try {
      onAdded(await createProfile(name, avatar))
    } catch (err) {
      setError(err?.code === '23505' ? 'You already have a profile with that name.' : "Couldn't add the profile. Try again.")
      setBusy(false)
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      {error && <p className="profile-form-error" role="alert">{error}</p>}
      <label className="field">
        <span>Profile name</span>
        <input type="text" required maxLength={30} autoFocus value={username}
          onChange={(e) => setUsername(e.target.value)} />
      </label>
      <fieldset className="avatar-picker">
        <legend>Avatar</legend>
        {AVATARS.map((a) => (
          <label key={a.url} className="avatar-option">
            <input type="radio" name="avatar" value={a.url} checked={avatar === a.url}
              onChange={() => setAvatar(a.url)} className="sr-only" />
            <img src={a.url} alt={a.label} width="64" height="64" />
          </label>
        ))}
      </fieldset>
      <div className="profile-form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
