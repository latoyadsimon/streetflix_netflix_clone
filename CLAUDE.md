# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Full-stack monorepo:

- `front-end/` — the React/Vite app: `src/`, `public/`, `app_outline/` (specs), `scripts/` (catalog tooling), package/vite/eslint config, `.env.local`.
- `supabase/` — the database side: `schema.sql` (DDL), `seed.sql` (catalog rows), `user_stories.md`, `streetflix_erd.png`, `supabasePrompt.md`, `backups/` (CSV exports from 2026-10-19, before login existed; their profiles belong to logins that no longer exist, so don't re-import them).
- `.claude/`, `.mcp.json` — shared Claude Code skills, agents and MCP config at the root.

Paths below that don't start with `supabase/` or `.` are relative to `front-end/`.

## Project

"Streetflix" — a React 19 + Vite SPA (React Router `BrowserRouter`) that is a catalog + watchlist with free, fully playable titles, themed street-graffiti / queen energy rather than a Netflix copy. There are no tests. Supabase is the data layer (publishable key + RLS) for the catalog, profiles and per-profile watchlists, and Supabase Auth (email + password) handles sign-in. Specs live in `front-end/app_outline/` (`user_journey.md`, `style_guide.md`, `app.png`, per-page wireframes in `pages/`); the Postgres/backend/persistence lines in those docs are intentionally ignored (the style guide's Netflix-red palette is also superseded by `front-end/src/index.css`).

## Commands

Run all of these from `front-end/` (the repo root has no package.json).

- `npm run dev` — Vite dev server (SPA fallback works for deep links like `/titles/m1`). Port is not fixed: it takes 5173 or the next free port, and old dev servers may still be running.
  - **Restart the dev server after the catalog build rewrites `public/posters|backdrops`.** Vite lists `public/` files at startup; a long-running server answers new image URLs with `index.html`, so cards look blank even though the files exist.
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config, react-hooks + react-refresh rules)
- `node --env-file=.env.local scripts/build-catalog.mjs` — regenerate the catalog (see Catalog data). Slow on purpose (minutes); run it in the background.
- `python3 scripts/catalog-to-sql.py [--new-only | --shows-only] [--compact] > out.sql` — turn `catalog.json` into Supabase inserts.
- No test runner is configured. Verify UI changes with the Playwright MCP (screenshots at 1280 / 768 / 375 against `app_outline/pages/*`). The `chrome-devtools` MCP has failed to connect with "Target closed"; axe-core injected via Playwright worked as an a11y fallback. Posters are `loading="lazy"`, so full-page screenshots show blank cards; scroll to a row first.
  - Screenshots must be saved inside the repo (e.g. `.playwright-mcp/`); paths outside it are refused.
  - `browser_navigate` is a full page load, which acts as a refresh and lands back on "Who's watching?" (the profile is in-memory). To change routes inside the app, run `history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate'))` via `browser_evaluate`.
  - Profiles load after the picker appears: wait for the profile name before clicking it. The add-profile avatar radios are visually hidden; click the avatar `img`.
  - In dev, React StrictMode sends every Supabase request twice; that is not a bug. Editing a context file while the dev server runs can log "useAuth must be used inside AuthProvider" before Vite does a full reload; that is a hot-reload artifact, not an app error.
- Shell has `noclobber` set: overwriting an existing file with `>` fails (and aborts the rest of a `&&`-less line); use `>|` or the Write/Edit tools. Do not `pkill -f <pattern>` from the Bash tool: the pattern matches the tool's own shell and kills it (exit 144); kill by PID instead. The shell is zsh: a word starting with `=` is a command lookup (`echo =====` fails), so quote it.

## Hard requirements

- **The chosen profile is in-memory only.** A refresh keeps the user signed in (supabase-js persists the auth session itself) but returns to "Who's watching?". Do not add our own localStorage/sessionStorage. The catalog is re-fetched on every load; the watchlist is re-read from Supabase when a profile is picked.
- **All Supabase calls live in `front-end/src/lib/api.js`** (auth sign-in/up/out, session listener and server check of the user, profiles read/create, catalog, watchlist read/add/remove). The only other external requests are the video/trailer iframes. Do not add other API calls without asking. The contract is the `catalog_titles` view (public-read) plus the owner-only policies on `users`, `watchlist_items` and `watched_titles` (see Supabase).
- `front-end/.env.local` (gitignored via `*.local`) holds `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (client-safe, RLS does the gatekeeping) and `TMDB_API_KEY` (dev scripts only, never imported by app code).

## Architecture

- **Provider stack and routing**: `main.jsx` mounts `BrowserRouter` > `AuthProvider` > `ProfileProvider` > `CatalogProvider` > `WatchlistProvider` > `App`. `App.jsx` has one layout route (`components/Layout.jsx`: skip link, `NavBar`, `<main>`, `Toast`, scroll-to-top on pathname change) wrapping `/`, `/movies`, `/tv-shows`, `/browse` (all titles A–Z), `/search?q=`, `/titles/:id`, `/watchlist`, `*` (404).
- **Auth** (`context/AuthContext.jsx`, `pages/SignIn.jsx`): `useAuth()` exposes `ready/user`. The stored session is not trusted as is: once per login, `verifyUser()` (`auth.getUser()`) asks Supabase who it belongs to; a 401/403 or a different user id clears it locally (`signOutLocally`) and shows Log in, while a network failure falls back to the stored session. `Layout` gates the app: "Checking your session…" until that answers, then `SignIn` (Log in / Create account) when logged out, then `ProfileSelect` until a profile is chosen. Log out (`signOut`, global scope, local fallback) is in the nav account menu (shows the signed-in email, Switch profile, Log out) and on the picker; it removes the stored tokens, and `ProfileContext`/`WatchlistContext` drop the in-memory profile and list as soon as the user changes. Creating an account sends `username`/`avatar_url` as sign-up metadata; the database trigger turns them into the login's first profile. If the project requires email confirmation, sign-up returns no session and `SignIn` asks the user to confirm first.
- **Profiles** (`context/ProfileContext.jsx`, `pages/ProfileSelect.jsx`): Netflix-style picker; one login owns many profiles (`users.owner_id`). The picker lists only the signed-in login's profiles and has an add-profile form (name + avatar from `data/avatars.js`, SVGs in `public/avatars/`) and Sign out. The chosen profile only counts while its `owner_id` matches the signed-in user, so signing out or switching logins clears it. The nav shows the active profile; its account menu has Switch profile, which returns to the picker. The profile's `id` keys that profile's watchlist.
- **Watchlist + toast** (`context/WatchlistContext.jsx`): the active profile's list of title slugs, persisted in Supabase `watchlist_items` (reloaded whenever the profile changes, tagged with its owner so lists never leak across a switch). `add/remove/toggle` are optimistic; a failed write rolls back and toasts an error. Adds are idempotent (upsert with `ignoreDuplicates: true`, which is required: there is no update policy, so a plain upsert is refused). `useWatchlist()` exposes `ids/loading/has/add/remove/toggle/notify`; Hero, Title Details and My List share it; `Toast` renders from it (toast is in-memory).
- **Catalog data** (the part that spans several files):
  - `src/data/catalog.json` is generated, never hand-edited. Input is `scripts/catalog-sources.json`, a hand-curated list of free, fully playable titles (public-domain films and serials on the Internet Archive, official free YouTube series and playlists). `scripts/build-catalog.mjs` adds TMDB metadata, posters/backdrops (`public/posters|backdrops`) and trailers, verifies every watch link (YouTube watch page must be playable in an embed — age-restricted videos are dropped — and archive.org items must exist, be unrestricted and long enough), prunes genres with fewer than 4 titles, and writes the JSON. `src/data/catalog.js` wraps it and exports `CATALOG/MOVIES/SHOWS/GENRES/getTitle/relatedTo` and derives a `hue` per id.
  - Source entries: movies use `ia` (archive.org id); shows use `seasons` (`{name, playlist, match?, strip?}` expands a YouTube playlist) and/or `episodes` (`{title, yt|ia}`); `setGenres`/`dropGenres`/`query`/`minMin` override TMDB genres, search text and the minimum length check.
  - ids are `m1..` (movies) and `s1..` (shows), assigned in source order, so inserting mid-list renumbers everything after it.
  - **Rules**: only full-length shows (a full season or more) are allowed; a show with a single episode is left out (a single video holding a whole season is allowed via `fullSeasonVideo`). Horror is capped at 4 titles. Only free, official or public-domain sources; no fan re-uploads.
  - YouTube answers 429 if checked quickly. The script is throttled, retries, caches results in `scripts/.verify-cache.json` (gitignored), and aborts instead of writing a bad catalog. Re-run it to resume.
  - `scripts/fetch-tmdb.mjs` is the original one-off loader for the first 40 mainstream titles; it is superseded and would overwrite `catalog.json`. Do not run it.
  - The app reads the catalog from the Supabase view `catalog_titles` (same shape as catalog.json plus the title `uuid`, needed for watchlist writes), fetched once by `context/CatalogContext.jsx`, which exposes `CATALOG/MOVIES/SHOWS/GENRES/getTitle/relatedTo` plus `status` (`loading|ready|error`) and `retry`; `Layout` shows a skeleton/error state until it is ready, so deep links do not 404 while loading. `data/catalog.js` holds the pure helpers (incl. the `hue` derivation); app code never imports catalog.json. Tables: `titles`, `genres`, `title_genres` (DDL in `supabase/schema.sql`). After changing the catalog, push it with `catalog-to-sql.py` and `apply_migration`. `apply_migration` takes SQL text, not a file path, so `seed.sql` (~84 KB) has to be sent whole. The live catalog matches `seed.sql`, which has zero-width characters in s9's description; the backup CSV doesn't.
- **Playback** (`components/Player.jsx`): native `<dialog>` modal with an embedded YouTube (nocookie) or archive.org iframe, a Full screen button, an "open in new tab" fallback, and an episode picker for shows grouped by `episode.season`. Used by `Hero` (Play) and `TitleDetails` (Play/Watch and Trailer). Titles without a trailer hide the Trailer button.
- **Shared components**: `TitleCard` is the one card used on every page (whole card is a link; optional `onRemove` renders a sibling remove button on My List). `PosterArt` (exported from `TitleCard.jsx`) shows the real poster with a shimmer skeleton and falls back to generated gradient art on load error. `ContentRow` (horizontal scroll row), `Hero`, and `BrowsePage` (shared by Movies and TV Shows: genre filter in the `?genre=` query param, Load More in steps of 8, state reset via `key={genre}`).
- **Search** (`pages/Search.jsx`): title-substring match only, split into Movies/TV Shows sections; empty queries never change the URL.

## Supabase

- Project is connected through the Supabase MCP. Make schema changes with `apply_migration` (one table at a time, then verify with `list_tables`); keep `supabase/schema.sql` in sync with what is live.
- RLS is on for every table. `titles`, `genres`, `title_genres` (and the `catalog_titles` view) are readable by `anon` and `authenticated` with no write policies, so catalog data can only be loaded through migrations/SQL (`seed.sql`), not from the client.
- `users` holds profiles: `owner_id` → `auth.users` (defaults to `auth.uid()`, cascades on delete), username unique per owner, no email. `handle_new_user()` (security definer, trigger `on_auth_user_created` on `auth.users`) creates the first profile at sign-up. Authenticated users can select/insert/update/delete only their own profiles; `anon` has no access.
- `watchlist_items` and `watched_titles` (per-profile watched state; not used by the UI yet) key on a profile id. Authenticated users can select/insert/delete rows only for profiles they own (no update); `anon` has no access.
- Leave `public.rls_auto_enable()` alone: never drop it or ask about dropping it.
- **Testing RLS**: run it in one `execute_sql` `DO` block. Insert fake `auth.users` rows (the trigger makes their profiles), act as each with `set_config('request.jwt.claims', json_build_object('sub', <id>, 'role', 'authenticated')::text, true)` plus `execute 'set local role authenticated'` (or `anon`), collect results in a `text` variable (`text[] || 'literal'` fails), and end with `raise exception` so everything rolls back.
- **Testing auth in the browser**: email confirmation is off, so sign-up in the UI logs straight in. Use `streetflix.test.*@example.com` addresses and clean up with `delete from auth.users where email like 'streetflix.test.%@example.com'` (cascades to profiles and lists). Other accounts in the project are real; never delete wider than that. Simulate a revoked session with `delete from auth.sessions where user_id = …`; the next load should go to Log in without loading data.

## Styling conventions

- Plain CSS, one file per component/page next to it; no CSS framework. Global tokens in `src/index.css` `:root`: palette (asphalt `--bg`, pink `--accent`, gold `--crown`), fonts (Anton display, Permanent Marker tags, Inter body), `--spray-stroke` (the brush-stroke underline reused for headings/active nav), `--nav-h/--tabbar-h/--gutter`.
- Text on `--accent` pink uses dark `--on-accent`, not white (contrast).
- Mobile (<768px) swaps the top nav for a fixed bottom tab bar; pages reserve space via `.page` padding.
- Respect `prefers-reduced-motion` (global override in `index.css`); motion is transform/opacity only.
- `.browse-grid` styles live in `components/BrowsePage.css` but are reused by Browse, Search and Watchlist.

## Repo notes

- `.claude/skills|agents` (repo root, shared by both halves) hold the design skills (frontend-design, ui-ux-pro-max, taste-skill, design-motion-principles), the postgresql-table-design skill and course agents. `.agents/` + `skills-lock.json` hold the Supabase agent skills. `.mcp.json` (root) configures the Supabase MCP.
- `screenshots/`, `.playwright-mcp/` (root and `supabase/`) are test artifacts.
- `README.md` is a short top-level overview.
