import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase.js'

// Every Supabase call the app makes lives here. Supabase Auth signs the viewer in; RLS
// limits profiles and watchlists to the signed-in login, while the catalog is public-read.

const check = ({ data, error }) => {
  if (error) throw error
  return data
}

// ----- Auth -----

// Calls back with the current session (or null) right away and on every sign-in/out.
// Returns an unsubscribe function.
export const onAuthChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

// Asks Supabase Auth who the stored session belongs to, instead of trusting the token saved in
// the browser. Resolves to the user, or null when the server says the session or user is no
// longer valid. Network failures reject, so callers can tell "offline" from "invalid".
export const verifyUser = () =>
  supabase.auth.getUser().then(({ data, error }) => {
    if (!error) return data.user
    if (error.status === 401 || error.status === 403 || error.name === 'AuthSessionMissingError') return null
    throw error
  })

// Removes this browser's stored session without calling the server (used when the server has
// already rejected it).
export const signOutLocally = () => supabase.auth.signOut({ scope: 'local' })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password }).then(check)

// The sign-up trigger turns `username`/`avatar_url` into the login's first profile.
// Resolves to { session } — session is null when the project requires email confirmation.
export const signUp = (email, password, username, avatarUrl) =>
  supabase.auth
    .signUp({ email, password, options: { data: { username, avatar_url: avatarUrl } } })
    .then(check)

// Ends the session on the server and removes the stored tokens from the browser. If the
// server can't be reached, the tokens are still removed locally so the user is logged out.
export const signOut = () =>
  supabase.auth.signOut().then(({ error }) => (error ? supabase.auth.signOut({ scope: 'local' }) : undefined))

// ----- Profiles -----

// The signed-in login's profiles (RLS returns no one else's), oldest first.
export const fetchProfiles = () =>
  supabase.from('users').select('id, owner_id, username, avatar_url').order('created_at').then(check)

// owner_id defaults to auth.uid() in the database, so the app never sends it.
export const createProfile = (username, avatarUrl) =>
  supabase
    .from('users')
    .insert({ username, avatar_url: avatarUrl })
    .select('id, owner_id, username, avatar_url')
    .single()
    .then(check)

// ----- Catalog -----

// The whole catalog, already in catalog.json shape, in default order.
export const fetchCatalog = () =>
  supabase.from('catalog_titles').select('*').order('position').then(check)

// ----- Watchlist -----

// Slugs (app ids) saved by one profile, oldest first.
export const fetchWatchlist = (profileId) =>
  supabase
    .from('watchlist_items')
    .select('added_at, titles(slug)')
    .eq('user_id', profileId)
    .order('added_at')
    .then(check)
    .then((rows) => rows.map((r) => r.titles?.slug).filter(Boolean))

// titleUuid is the catalog row's `uuid` column, not its slug. ignoreDuplicates is required:
// there is no update policy, so a plain upsert of an existing row is refused.
export const addToWatchlist = (profileId, titleUuid) =>
  supabase
    .from('watchlist_items')
    .upsert({ user_id: profileId, title_id: titleUuid }, { onConflict: 'user_id,title_id', ignoreDuplicates: true })
    .then(check)

export const removeFromWatchlist = (profileId, titleUuid) =>
  supabase.from('watchlist_items').delete().eq('user_id', profileId).eq('title_id', titleUuid).then(check)

// ----- Donations -----

// Asks the `process-donation` Edge Function for a Stripe PaymentIntent and returns its
// client_secret (the card itself goes to Stripe.js, never through here). Failures are thrown
// tagged: { kind: 'network' } when the function can't be reached, { kind: 'server', message,
// status } when it answered with an error (message is the function's own `{ error }` text).
export const createDonationIntent = async (amountCents, userId) => {
  const { data, error } = await supabase.functions.invoke('process-donation', {
    body: { amount: amountCents, user_id: userId },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw { kind: 'server', status: error.context.status, message: body?.error ?? '' }
    }
    throw { kind: 'network' }
  }
  if (!data?.client_secret) throw { kind: 'server', status: 500, message: '' }
  return data.client_secret
}
