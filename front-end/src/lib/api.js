import { supabase } from './supabase.js'

// Every Supabase call the app makes lives here (profiles are read in ProfileSelect).
// No auth: the publishable key plus RLS policies decide what is allowed.

const check = ({ data, error }) => {
  if (error) throw error
  return data
}

// The whole catalog, already in catalog.json shape, in default order.
export const fetchCatalog = () =>
  supabase.from('catalog_titles').select('*').order('position').then(check)

// Slugs (app ids) saved by one profile, oldest first.
export const fetchWatchlist = (profileId) =>
  supabase
    .from('watchlist_items')
    .select('added_at, titles(slug)')
    .eq('user_id', profileId)
    .order('added_at')
    .then(check)
    .then((rows) => rows.map((r) => r.titles?.slug).filter(Boolean))

// titleUuid is the catalog row's `uuid` column, not its slug.
export const addToWatchlist = (profileId, titleUuid) =>
  supabase
    .from('watchlist_items')
    .upsert({ user_id: profileId, title_id: titleUuid }, { onConflict: 'user_id,title_id', ignoreDuplicates: true })
    .then(check)

export const removeFromWatchlist = (profileId, titleUuid) =>
  supabase.from('watchlist_items').delete().eq('user_id', profileId).eq('title_id', titleUuid).then(check)
