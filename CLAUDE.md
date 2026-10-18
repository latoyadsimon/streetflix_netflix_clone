# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Streetflix" — a React 19 + Vite SPA (React Router `BrowserRouter`) that is a catalog + watchlist with free, fully playable titles, themed street-graffiti / queen energy rather than a Netflix copy. There is no login, no app backend and no tests. The only live backend call is reading profiles from Supabase. Specs live in `app_outline/` (`user_journey.md`, `style_guide.md`, `app.png`, per-page wireframes in `pages/`); the Postgres/backend/persistence lines in those docs are intentionally ignored (the style guide's Netflix-red palette is also superseded by `src/index.css`).

## Commands

- `npm run dev` — Vite dev server (SPA fallback works for deep links like `/titles/m1`). Port is not fixed: it takes 5173 or the next free port, and old dev servers may still be running.
  - **Restart the dev server after the catalog build rewrites `public/posters|backdrops`.** Vite lists `public/` files at startup; a long-running server answers new image URLs with `index.html`, so cards look blank even though the files exist.
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config, react-hooks + react-refresh rules)
- `node --env-file=.env.local scripts/build-catalog.mjs` — regenerate the catalog (see Catalog data). Slow on purpose (minutes); run it in the background.
- `python3 scripts/catalog-to-sql.py [--new-only | --shows-only] [--compact] > out.sql` — turn `catalog.json` into Supabase inserts.
- No test runner is configured. Verify UI changes with the Playwright MCP (screenshots at 1280 / 768 / 375 against `app_outline/pages/*`). The `chrome-devtools` MCP has failed to connect with "Target closed"; axe-core injected via Playwright worked as an a11y fallback. Posters are `loading="lazy"`, so full-page screenshots show blank cards; scroll to a row first.
- Shell has `noclobber` set: overwriting an existing file with `>` fails (and aborts the rest of a `&&`-less line); use `>|` or the Write/Edit tools. Do not `pkill -f <pattern>` from the Bash tool: the pattern matches the tool's own shell and kills it (exit 144); kill by PID instead.

## Hard requirements

- **All state is in-memory.** A refresh must reset everything, including the chosen profile and the watchlist. Do not add localStorage/sessionStorage.
- **The only runtime network call is the Supabase read of profiles** (`src/lib/supabase.js`). Catalog data, watchlist and toast stay local; the only other external requests are the video/trailer iframes. Do not add other API calls without asking.
- `.env.local` (gitignored via `*.local`) holds `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (client-safe, RLS does the gatekeeping) and `TMDB_API_KEY` (dev scripts only, never imported by app code).

## Architecture

- **Provider stack and routing**: `main.jsx` mounts `BrowserRouter` > `ProfileProvider` > `WatchlistProvider` > `App`. `App.jsx` has one layout route (`components/Layout.jsx`: skip link, `NavBar`, `<main>`, `Toast`, scroll-to-top on pathname change) wrapping `/`, `/movies`, `/tv-shows`, `/browse` (all titles A–Z), `/search?q=`, `/titles/:id`, `/watchlist`, `*` (404).
- **Profiles** (`context/ProfileContext.jsx`, `pages/ProfileSelect.jsx`): no login, Netflix-style profile picker. `Layout` renders "Who's watching?" instead of the app until a profile is chosen; the nav shows the active profile and clicking it switches. Profiles are read from the Supabase `users` table (`username`, `avatar_url`; 5 seeded rows); SVG avatars live in `public/avatars/`. The chosen profile is not yet used for anything else (watchlist is shared, not per-profile).
- **Watchlist + toast** (`context/WatchlistContext.jsx`): the single global state. Holds an array of title ids (adds are idempotent) and the toast message. `useWatchlist()` exposes `has/add/remove/toggle/notify`. Hero, Title Details, and My List share it; `Toast` renders from it. Only in-app (client-side) navigation preserves it — `page.goto`/typing a URL resets it, which is expected.
- **Catalog data** (the part that spans several files):
  - `src/data/catalog.json` is generated, never hand-edited. Input is `scripts/catalog-sources.json`, a hand-curated list of free, fully playable titles (public-domain films and serials on the Internet Archive, official free YouTube series and playlists). `scripts/build-catalog.mjs` adds TMDB metadata, posters/backdrops (`public/posters|backdrops`) and trailers, verifies every watch link (YouTube watch page must be playable in an embed — age-restricted videos are dropped — and archive.org items must exist, be unrestricted and long enough), prunes genres with fewer than 4 titles, and writes the JSON. `src/data/catalog.js` wraps it and exports `CATALOG/MOVIES/SHOWS/GENRES/getTitle/relatedTo` and derives a `hue` per id.
  - Source entries: movies use `ia` (archive.org id); shows use `seasons` (`{name, playlist, match?, strip?}` expands a YouTube playlist) and/or `episodes` (`{title, yt|ia}`); `setGenres`/`dropGenres`/`query`/`minMin` override TMDB genres, search text and the minimum length check.
  - ids are `m1..` (movies) and `s1..` (shows), assigned in source order, so inserting mid-list renumbers everything after it.
  - **Rules**: only full-length shows (a full season or more) are allowed; a show with a single episode is left out (a single video holding a whole season is allowed via `fullSeasonVideo`). Horror is capped at 4 titles. Only free, official or public-domain sources; no fan re-uploads.
  - YouTube answers 429 if checked quickly. The script is throttled, retries, caches results in `scripts/.verify-cache.json` (gitignored), and aborts instead of writing a bad catalog. Re-run it to resume.
  - `scripts/fetch-tmdb.mjs` is the original one-off loader for the first 40 mainstream titles; it is superseded and would overwrite `catalog.json`. Do not run it.
  - The same data is mirrored in Supabase (`titles`, `genres`, `title_genres`; DDL in `supabase/schema.sql`, rows in `supabase/seed.sql`) but the app reads the JSON. After changing the catalog, push it with `catalog-to-sql.py` and `apply_migration`. `watchlist_items` exists in the DB with owner-only RLS (inert without auth) and is unused by the app.
- **Playback** (`components/Player.jsx`): native `<dialog>` modal with an embedded YouTube (nocookie) or archive.org iframe, a Full screen button, an "open in new tab" fallback, and an episode picker for shows grouped by `episode.season`. Used by `Hero` (Play) and `TitleDetails` (Play/Watch and Trailer). Titles without a trailer hide the Trailer button.
- **Shared components**: `TitleCard` is the one card used on every page (whole card is a link; optional `onRemove` renders a sibling remove button on My List). `PosterArt` (exported from `TitleCard.jsx`) shows the real poster with a shimmer skeleton and falls back to generated gradient art on load error. `ContentRow` (horizontal scroll row), `Hero`, and `BrowsePage` (shared by Movies and TV Shows: genre filter in the `?genre=` query param, Load More in steps of 8, state reset via `key={genre}`).
- **Search** (`pages/Search.jsx`): title-substring match only, split into Movies/TV Shows sections; empty queries never change the URL.

## Supabase

- Project is connected through the Supabase MCP. Make schema changes with `apply_migration` (one table at a time, then verify with `list_tables`); keep `supabase/schema.sql` in sync with what is live.
- RLS is on for every table. `titles`, `genres`, `title_genres` are public-read with no write policies, so catalog data can only be loaded through migrations/SQL, not from the client. `users` is readable by `anon` (profile picker) and has no write policy.
- `users` is standalone (no link to `auth.users`, no email) until real login exists; adding login means re-linking it and adding per-user `watchlist_items` use.

## Styling conventions

- Plain CSS, one file per component/page next to it; no CSS framework. Global tokens in `src/index.css` `:root`: palette (asphalt `--bg`, pink `--accent`, gold `--crown`), fonts (Anton display, Permanent Marker tags, Inter body), `--spray-stroke` (the brush-stroke underline reused for headings/active nav), `--nav-h/--tabbar-h/--gutter`.
- Text on `--accent` pink uses dark `--on-accent`, not white (contrast).
- Mobile (<768px) swaps the top nav for a fixed bottom tab bar; pages reserve space via `.page` padding.
- Respect `prefers-reduced-motion` (global override in `index.css`); motion is transform/opacity only.
- `.browse-grid` styles live in `components/BrowsePage.css` but are reused by Browse, Search and Watchlist.

## Repo notes

- `skills/` and `.claude/skills|agents` hold the design skills (frontend-design, ui-ux-pro-max, taste-skill, design-motion-principles), the postgresql-table-design skill and course agents; `screenshots/` and `.playwright-mcp/` are test artifacts.
- `README.md` is the untouched Vite template.
