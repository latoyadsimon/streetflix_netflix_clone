// Dev-only: builds src/data/catalog.json (+ posters/backdrops) from scripts/catalog-sources.json.
// TMDB supplies metadata and trailers; every watch link is checked before it is kept.
// Usage: node --env-file=.env.local scripts/build-catalog.mjs
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises'

const KEY = process.env.TMDB_API_KEY
if (!KEY) { console.error('Set TMDB_API_KEY in .env.local'); process.exit(1) }
const MIN_GENRE_TITLES = 4

const tmdb = async (p, params = {}) => {
  const u = new URL(`https://api.themoviedb.org/3${p}`)
  u.searchParams.set('api_key', KEY)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
  const r = await fetch(u)
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
// oEmbed only proves the video exists; the watch page says whether it can actually play in an embed
// (age-restricted videos report LOGIN_REQUIRED and show an error inside the iframe).
const UA = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' }
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
const ytInfoOnce = async (id) => {
  await sleep(900)
  const o = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
  if (o.status === 429) throw new Error('throttled')
  if (!o.ok) return { ok: false }
  const title = (await o.json()).title
  const w = await fetch(`https://www.youtube.com/watch?v=${id}`, { headers: UA })
  if (w.status === 429) throw new Error('throttled')
  const html = await w.text()
  const status = html.match(/"playabilityStatus":\{"status":"(\w+)"/)?.[1]
  return { ok: status === 'OK' && !html.includes('"playableInEmbed":false'), title }
}
// Transient throttling looks like "unplayable", so a failure is retried before it is believed.
const retry = async (fn, ok, tries = 5) => {
  let r, threw
  for (let i = 0; i < tries; i++) {
    try { r = await fn(); threw = false } catch { r = undefined; threw = true }
    if (r !== undefined && ok(r)) return r
    if (!threw) return r // a clean "not playable" answer: believe it
    await sleep(15000 * (i + 1))
  }
  throw new Error('YouTube keeps throttling requests; wait a while and re-run (verified results are cached)')
}
const CACHE_FILE = 'scripts/.verify-cache.json'
let cache = {}
try { cache = JSON.parse(await readFile(CACHE_FILE, 'utf8')) } catch { /* first run */ }
const ytInfo = async (id) => {
  if (cache[id]) return cache[id]
  const r = await retry(() => ytInfoOnce(id), () => true)
  cache[id] = r
  await writeFile(CACHE_FILE, JSON.stringify(cache))
  return r
}
const ytOk = async (id) => (await ytInfo(id)).ok
const playlistIds = async (pid) => {
  const html = await (await fetch(`https://www.youtube.com/playlist?list=${pid}`, { headers: UA })).text()
  const ids = []
  for (const m of html.matchAll(new RegExp(`"watchEndpoint":\\{"videoId":"([\\w-]{11})","playlistId":"${pid}"`, 'g'))) {
    if (!ids.includes(m[1])) ids.push(m[1])
  }
  return ids
}
// Run async work over a list a few at a time.
const mapLimit = async (items, n, fn) => {
  n = Math.min(n, 1) // YouTube answers 429 above this rate
  const out = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k) }
  }))
  return out
}
const cleanTitle = (t, strip = '') => {
  let x = t.startsWith(strip) ? t.slice(strip.length) : t
  x = x.replace(/\s*[(（](?:EN dub|w\/s[ub]*titles)[)）]/gi, '')
    .replace(/\s*\|\s*[^|]*\|\s*Full Episode$/i, '')
    .replace(/^[\s\-–—:|]+/, '')
    .replace(/Episode\s*(\d+)/gi, 'Episode $1')
    .replace(/^#(\d+)\s*$/, 'Episode $1')
    .replace(/^#(\d+)\s*:\s*(.+)$/, '#$1 \"$2\"')
    .replace(/^『PROLOGUE』/, 'Prologue')
    .replace(/^(Ep \d+)\s*\|\s*/, '$1: ')
    .trim()
  const m = x.match(/^(.*?)\s*\/\/\s*S\d+:\s*Episode\s*(\d+)/i)
  if (m) return `E${m[2]}: ${m[1].trim()}`
  return x === 'PILOT' ? 'Pilot' : x
}
// Playlists are not always in watching order: sort by the first number in the title (Pilot = 0).
const epOrder = (title) => (/^(pilot|prologue)/i.test(title) ? 0 : Number(title.match(/\d+/)?.[0] ?? 1e6))
const iaLength = async (id, minSeconds) => {
  const r = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`)
  if (!r.ok) return 0
  const d = await r.json()
  if (!d.files || d.metadata?.['access-restricted-item']) return 0
  const secs = d.files.filter((f) => /\.(mp4|ogv|mpeg|mpg|avi|mkv)$/i.test(f.name))
    .map((f) => Number(f.length) || 0)
  const best = Math.max(0, ...secs)
  return best >= minSeconds ? best : 0
}
const iaLengthRetry = (id, min) => retry(async () => ({ ok: (await iaLength(id, min)) > 0, v: await iaLength(id, min) }), (r) => r.ok).then((r) => r.v || 0)
const fmtRuntime = (m) => (m ? `${Math.floor(m / 60) ? `${Math.floor(m / 60)}h ` : ''}${m % 60}m` : '')
const GENRE_MAP = { 'Science Fiction': 'Sci-Fi', 'Action & Adventure': 'Action', 'Sci-Fi & Fantasy': 'Sci-Fi', 'War & Politics': 'War' }

const sources = JSON.parse(await readFile('scripts/catalog-sources.json', 'utf8'))
await mkdir('public/posters', { recursive: true })
await mkdir('public/backdrops', { recursive: true })

const out = []
const problems = []
let mi = 0, si = 0

for (const s of sources) {
  const type = s.type || (s.kind === 'tv' ? 'show' : 'movie')

  // 1. Playable sources: keep only what verifies.
  let watch = null
  let episodes = []
  let runtimeSecs = 0
  if (s.ia) {
    runtimeSecs = await iaLength(s.ia, (s.minMin ?? 40) * 60)
    if (!runtimeSecs) { problems.push(`${s.name}: archive.org item "${s.ia}" missing/too short/restricted`); continue }
    watch = { provider: 'archive', url: `https://archive.org/details/${s.ia}` }
  } else {
    // Candidates come from official playlists (seasons) and/or hand-listed episodes.
    const candidates = []
    for (const season of s.seasons || []) {
      for (const id of await playlistIds(season.playlist)) candidates.push({ yt: id, season, label: season.name })
    }
    for (const e of s.episodes || []) candidates.push({ ...e, label: e.season })
    const checked = await mapLimit(candidates, 6, async (c) => {
      if (c.yt) {
        const info = await ytInfo(c.yt)
        return { c, ok: info.ok, raw: info.title || '', title: c.title || cleanTitle(info.title || c.yt, c.season?.strip) }
      }
      return { c, ok: (await iaLengthRetry(c.ia, 5 * 60)) > 0, raw: '', title: c.title }
    })
    for (const { c, ok, title, raw } of checked) {
      if (c.season?.match && !raw.includes(c.season.match)) continue
      if (!ok) { problems.push(`${s.name} / ${title}: source not playable, dropped`); continue }
      episodes.push({
        title, ...(c.label ? { season: c.label } : {}),
        ...(c.yt ? { provider: 'youtube', url: `https://www.youtube.com/watch?v=${c.yt}` }
          : { provider: 'archive', url: `https://archive.org/details/${c.ia}` }),
      })
    }
    if (s.seasons) {
      const order = s.seasons.map((x) => x.name)
      episodes.sort((p, q) => order.indexOf(p.season) - order.indexOf(q.season) || epOrder(p.title) - epOrder(q.title))
    }
    if (type === 'show' && episodes.length < 2 && !s.fullSeasonVideo) { problems.push(`${s.name}: only ${episodes.length} episode(s), left out`); continue }
    if (!episodes.length) { problems.push(`${s.name}: no playable episodes`); continue }
    watch = { provider: episodes[0].provider, url: episodes[0].url }
  }

  // 2. Metadata from TMDB.
  const kind = s.kind
  const q = s.query || s.name
  const search = await tmdb(`/search/${kind}`, kind === 'movie' ? { query: q, year: s.year } : { query: q, first_air_date_year: s.year })
  let hit = search.results?.[0]
  if (!hit) {
    const loose = await tmdb(`/search/${kind}`, { query: q })
    hit = loose.results?.[0]
  }
  if (!hit) { problems.push(`${s.name}: no TMDB match`); continue }
  const d = await tmdb(`/${kind}/${hit.id}`, { append_to_response: `videos,${kind === 'movie' ? 'release_dates' : 'content_ratings'}` })

  let rating = 'NR'
  if (kind === 'movie') {
    const us = d.release_dates?.results?.find((r) => r.iso_3166_1 === 'US')
    rating = us?.release_dates?.find((r) => r.certification)?.certification || 'NR'
  } else {
    rating = d.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US')?.rating || 'NR'
  }

  let trailer = null
  const vids = (d.videos?.results || []).filter((v) => v.site === 'YouTube' && ['Trailer', 'Teaser'].includes(v.type))
    .sort((a, b) => (b.type === 'Trailer') - (a.type === 'Trailer') || (b.official === true) - (a.official === true))
  for (const v of vids) {
    if (await ytOk(v.key)) { trailer = { provider: 'youtube', url: `https://www.youtube.com/watch?v=${v.key}` }; break }
  }

  const id = type === 'movie' ? `m${++mi}` : `s${++si}`
  const okP = await img(d.poster_path, 'w780', `public/posters/${id}.jpg`)
  const okB = await img(d.backdrop_path, 'w1280', `public/backdrops/${id}.jpg`)
  const runtimeMin = type === 'movie' ? (d.runtime || Math.round(runtimeSecs / 60)) : 0

  out.push({
    id, type, title: d.title || d.name, year: Number((d.release_date || d.first_air_date || '').slice(0, 4)) || s.year,
    rating,
    runtime: type === 'show' ? (s.fullSeasonVideo ? 'Full season' : `${episodes.length} episodes`) : fmtRuntime(runtimeMin),
    runtimeMinutes: runtimeMin || null,
    genres: s.setGenres || [...new Set((d.genres || []).map((g) => GENRE_MAP[g.name] || g.name))].filter((g) => !(s.dropGenres || []).includes(g)),
    description: d.overview, tagline: d.tagline || '',
    poster: okP ? `/posters/${id}.jpg` : null, backdrop: okB ? `/backdrops/${id}.jpg` : null,
    watch, trailer, episodes,
  })
  console.log(`ok ${id} ${d.title || d.name}${trailer ? '' : '  (no trailer)'}`)
}

// 3. Every genre must have at least MIN_GENRE_TITLES titles; fold the rest away.
const counts = {}
out.forEach((t) => t.genres.forEach((g) => { counts[g] = (counts[g] || 0) + 1 }))
const keep = new Set(Object.keys(counts).filter((g) => counts[g] >= MIN_GENRE_TITLES))
out.forEach((t) => {
  t.genres = t.genres.filter((g) => keep.has(g))
  if (!t.genres.length) problems.push(`${t.title}: has no genre left after pruning`)
})

await writeFile('src/data/catalog.json', JSON.stringify(out, null, 2))
for (const [dir, key] of [['public/posters', 'poster'], ['public/backdrops', 'backdrop']]) {
  const used = new Set(out.map((t) => t[key]).filter(Boolean).map((p) => p.split('/').pop()))
  for (const f of await readdir(dir)) if (!used.has(f)) await rm(`${dir}/${f}`)
}
console.log(`\nWrote ${out.length} titles (${out.filter((t) => t.type === 'movie').length} movies, ${out.filter((t) => t.type === 'show').length} shows)`)
console.log('Genres:', [...keep].sort().map((g) => `${g} ${counts[g]}`).join(', '))
console.log('Dropped genres:', Object.keys(counts).filter((g) => !keep.has(g)).map((g) => `${g} ${counts[g]}`).join(', '))
console.log('No trailer:', out.filter((t) => !t.trailer).map((t) => t.title).join('; ') || 'none')
if (problems.length) console.log('\nPROBLEMS:\n' + problems.join('\n'))
