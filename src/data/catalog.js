// Catalog data is generated once by scripts/fetch-tmdb.mjs into catalog.json (+ /public images).
// The app itself never calls an API.
import raw from './catalog.json'

const hueOf = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

export const CATALOG = raw.map((t) => ({ ...t, hue: hueOf(t.id) }))

export const MOVIES = CATALOG.filter((t) => t.type === 'movie')
export const SHOWS = CATALOG.filter((t) => t.type === 'show')
export const GENRES = [...new Set(CATALOG.flatMap((t) => t.genres))].sort()

export const getTitle = (id) => CATALOG.find((t) => t.id === id)

export const relatedTo = (title, limit = 8) =>
  CATALOG.filter((t) => t.id !== title.id && t.genres.some((g) => title.genres.includes(g)))
    .sort((a, b) => b.genres.filter((g) => title.genres.includes(g)).length - a.genres.filter((g) => title.genres.includes(g)).length)
    .slice(0, limit)
