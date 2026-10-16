// One-time dev script: downloads real posters/backdrops + details from TMDB into the project.
// The running app makes NO API calls; it only reads src/data/catalog.json and /public images.
// Usage: TMDB_API_KEY=xxxx node scripts/fetch-tmdb.mjs
import { writeFile } from 'node:fs/promises'

const KEY = process.env.TMDB_API_KEY
if (!KEY) { console.error('Set TMDB_API_KEY (v3 key or v4 read token).'); process.exit(1) }
const headers = KEY.length > 40 ? { Authorization: `Bearer ${KEY}` } : {}
const q = (p, params = {}) => {
  const u = new URL(`https://api.themoviedb.org/3${p}`)
  if (!headers.Authorization) u.searchParams.set('api_key', KEY)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
  return u
}
const get = async (p, params) => {
  const r = await fetch(q(p, params), { headers })
  if (!r.ok) throw new Error(`${p} -> ${r.status}`)
  return r.json()
}
const img = async (path, size, out) => {
  if (!path) return false
  const r = await fetch(`https://image.tmdb.org/t/p/${size}${path}`)
  if (!r.ok) return false
  await writeFile(out, Buffer.from(await r.arrayBuffer()))
  return true
}

const MOVIES = [
  ['Shrek', 2001], ['Black Panther', 2018], ['Spider-Man: Into the Spider-Verse', 2018], ['Mad Max: Fury Road', 2015],
  ['Barbie', 2023], ['Everything Everywhere All at Once', 2022], ['Coco', 2017], ['Get Out', 2017],
  ['Hidden Figures', 2016], ['Wonder Woman', 2017], ['The Dark Knight', 2008], ['Parasite', 2019],
  ['Inception', 2010], ['Moana', 2016], ['Encanto', 2021], ['Lady Bird', 2017],
  ['Little Women', 2019], ['Crazy Rich Asians', 2018], ['Mean Girls', 2004], ['Spirited Away', 2001],
]
const SHOWS = [
  ['Stranger Things', 2016], ['The Bear', 2022], ['Euphoria', 2019], ['Wednesday', 2022],
  ['Squid Game', 2021], ['Arcane', 2021], ['Abbott Elementary', 2021], ['Insecure', 2016],
  ['Pose', 2018], ['Orange Is the New Black', 2013], ['Bridgerton', 2020], ["The Queen's Gambit", 2020],
  ['Atlanta', 2016], ['Succession', 2018], ['Fleabag', 2016], ['Black Mirror', 2011],
  ['Avatar: The Last Airbender', 2005], ['Hacks', 2021], ['Killing Eve', 2018], ['Ted Lasso', 2020],
]

const fmtRuntime = (m) => (m ? `${Math.floor(m / 60) ? `${Math.floor(m / 60)}h ` : ''}${m % 60}m` : '')
const out = []
let mi = 0, si = 0

for (const [type, list] of [['movie', MOVIES], ['show', SHOWS]]) {
  for (const [name, year] of list) {
    const id = type === 'movie' ? `m${++mi}` : `s${++si}`
    const kind = type === 'movie' ? 'movie' : 'tv'
    const search = await get(`/search/${kind}`, type === 'movie' ? { query: name, year } : { query: name, first_air_date_year: year })
    const hit = search.results?.[0]
    if (!hit) { console.warn(`MISS ${name}`); continue }
    const d = await get(`/${kind}/${hit.id}`, { append_to_response: type === 'movie' ? 'release_dates' : 'content_ratings' })
    let rating = 'NR'
    if (type === 'movie') {
      const us = d.release_dates?.results?.find((r) => r.iso_3166_1 === 'US')
      rating = us?.release_dates?.find((r) => r.certification)?.certification || 'NR'
    } else {
      rating = d.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US')?.rating || 'NR'
    }
    const okP = await img(d.poster_path, 'w780', `public/posters/${id}.jpg`)
    const okB = await img(d.backdrop_path, 'w1280', `public/backdrops/${id}.jpg`)
    out.push({
      id, type, title: d.title || d.name, year: Number((d.release_date || d.first_air_date || '').slice(0, 4)) || year,
      rating, runtime: type === 'movie' ? fmtRuntime(d.runtime) : `${d.number_of_seasons} season${d.number_of_seasons > 1 ? 's' : ''}`,
      genres: (d.genres || []).map((g) => g.name.replace('Science Fiction', 'Sci-Fi').replace('Action & Adventure', 'Action').replace('Sci-Fi & Fantasy', 'Sci-Fi')),
      description: d.overview, tagline: d.tagline || '',
      poster: okP ? `/posters/${id}.jpg` : null, backdrop: okB ? `/backdrops/${id}.jpg` : null,
    })
    console.log(`ok ${id} ${d.title || d.name}`)
  }
}
await writeFile('src/data/catalog.json', JSON.stringify(out, null, 2))
console.log(`Wrote ${out.length} titles`)
