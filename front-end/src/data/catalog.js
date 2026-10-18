// Pure helpers over the catalog rows fetched from Supabase (see lib/api.js and CatalogContext).
// catalog.json is only the build script's input; app code never imports it.

const hueOf = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

// Rows come back in catalog.json shape; add the derived per-title hue.
export const buildCatalog = (rows) => {
  const CATALOG = rows.map((t) => ({ ...t, genres: t.genres ?? [], episodes: t.episodes ?? [], hue: hueOf(t.id) }))
  const byId = new Map(CATALOG.map((t) => [t.id, t]))

  const relatedTo = (title, limit = 8) =>
    CATALOG.filter((t) => t.id !== title.id && t.genres.some((g) => title.genres.includes(g)))
      .sort((a, b) => b.genres.filter((g) => title.genres.includes(g)).length - a.genres.filter((g) => title.genres.includes(g)).length)
      .slice(0, limit)

  return {
    CATALOG,
    MOVIES: CATALOG.filter((t) => t.type === 'movie'),
    SHOWS: CATALOG.filter((t) => t.type === 'show'),
    GENRES: [...new Set(CATALOG.flatMap((t) => t.genres))].sort(),
    getTitle: (id) => byId.get(id),
    relatedTo,
  }
}
