import { useState } from 'react'
import { signIn, signUp } from '../lib/api.js'
import { AVATARS } from '../data/avatars.js'
import './SignIn.css'

// Shown instead of the app while nobody is signed in. A new account gets its first profile
// from the profile name entered here (created by the database's sign-up trigger).
export default function SignIn() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const isSignUp = mode === 'signup'

  const switchMode = () => {
    setMode(isSignUp ? 'signin' : 'signup')
    setError('')
    setNotice('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (isSignUp) {
        const { session } = await signUp(email.trim(), password, username.trim(), AVATARS[0].url)
        // No session means the project wants the email confirmed first.
        if (!session) {
          setNotice('Check your email to confirm your account, then log in.')
          setMode('signin')
        }
      } else {
        await signIn(email.trim(), password)
      }
      // On success the auth listener swaps this screen for the profile picker.
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="signin" id="main">
      <div className="signin-brand" aria-hidden="true">
        <svg viewBox="0 0 24 16" width="36" height="24" className="logo-crown">
          <path d="M1 15L0 3l6 5 6-7 6 7 6-5-1 12z" fill="currentColor" />
        </svg>
        <span>Streetflix</span>
      </div>
      <form className="signin-card" onSubmit={submit}>
        <h1>{isSignUp ? 'Create account' : 'Log in'}</h1>
        {notice && <p className="signin-notice" role="status">{notice}</p>}
        {error && <p className="signin-error" role="alert">{error}</p>}
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {isSignUp && (
          <label className="field">
            <span>Profile name</span>
            <input type="text" autoComplete="nickname" required maxLength={30} value={username}
              onChange={(e) => setUsername(e.target.value)} />
          </label>
        )}
        <button type="submit" className="btn btn-primary signin-submit" disabled={busy}>
          {busy ? 'One sec…' : isSignUp ? 'Create account' : 'Log in'}
        </button>
        <p className="signin-switch">
          {isSignUp ? 'Already have an account?' : 'New to Streetflix?'}{' '}
          <button type="button" onClick={switchMode}>{isSignUp ? 'Log in' : 'Create one'}</button>
        </p>
      </form>
    </main>
  )
}
