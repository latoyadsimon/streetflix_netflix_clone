# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Streetflix" — a front-end-only React 19 + Vite SPA (React Router `BrowserRouter`) that is a catalog + watchlist, themed street-graffiti / queen energy rather than a Netflix copy. There is no backend and no tests. Specs live in `app_outline/` (`user_journey.md`, `style_guide.md`, `app.png`, per-page wireframes in `pages/`); note the Postgres/backend/persistence lines in those docs are intentionally ignored.

## Commands

- `npm run dev` — Vite dev server (default http://localhost:5173; SPA fallback works for deep links like `/titles/m1`)
- `npm run build` / `npm run preview`
- `npm run lint` — ESLint (flat config, react-hooks + react-refresh rules)
- No test runner is configured. Verify UI changes with the Playwright MCP (screenshots at 1280 / 768 / 375 against `app_outline/pages/*`). The `chrome-devtools` MCP has failed to connect with "Target closed"; axe-core injected via Playwright worked as an a11y fallback.

## Hard requirements

- **All state is in-memory.** A refresh must reset everything, including the watchlist. Do not add localStorage/sessionStorage or any API calls at runtime.
- Dev-only tooling may use the network, but app code may not.

## Architecture

- **Routing** (`src/App.jsx`): one layout route (`components/Layout.jsx`: skip link, `NavBar`, `<main>`, `Toast`, scroll-to-top on pathname change) wrapping `/`, `/movies`, `/tv-shows`, `/browse` (all titles A–Z), `/search?q=`, `/titles/:id`, `/watchlist`, `*` (404). `main.jsx` mounts `BrowserRouter` and `WatchlistProvider`.
- **Watchlist + toast** (`src/context/WatchlistContext.jsx`): the single global state. Holds an array of title ids (adds are idempotent, so no duplicates) and the toast message. `useWatchlist()` exposes `has/add/remove/toggle/notify`. Hero, Title Details, and My List all share it; `Toast` renders from it. Only in-app (client-side) navigation preserves it — `page.goto`/typing a URL resets it, which is expected.
- **Catalog data**: `src/data/catalog.json` is generated, not hand-edited. `scripts/fetch-tmdb.mjs` (run once: `TMDB_API_KEY=... node scripts/fetch-tmdb.mjs`) fetches 40 real titles (20 movies `m1..m20`, 20 shows `s1..s20`) from TMDB and downloads posters/backdrops into `public/posters/` and `public/backdrops/`. `src/data/catalog.js` wraps the JSON and exports `CATALOG/MOVIES/SHOWS/GENRES/getTitle/relatedTo` and derives a `hue` per id (used for tilt and the fallback poster). Re-running the script rewrites the JSON and images.
- **Shared components**: `TitleCard` is the one card used on every page (whole card is a link; optional `onRemove` renders a sibling remove button on My List). `PosterArt` (exported from `TitleCard.jsx`) shows the real poster with a shimmer skeleton and falls back to generated gradient art on load error. `ContentRow` (horizontal scroll row), `Hero`, and `BrowsePage` (shared by Movies and TV Shows: genre filter in the `?genre=` query param, Load More in steps of 8, state reset via `key={genre}`).
- **Search** (`pages/Search.jsx`): title-substring match only, split into Movies/TV Shows sections; empty queries never change the URL.

## Styling conventions

- Plain CSS, one file per component/page next to it; no CSS framework. Global tokens in `src/index.css` `:root`: palette (asphalt `--bg`, pink `--accent`, gold `--crown`), fonts (Anton display, Permanent Marker tags, Inter body), `--spray-stroke` (the brush-stroke underline reused for headings/active nav), `--nav-h/--tabbar-h/--gutter`.
- Text on `--accent` pink uses dark `--on-accent`, not white (contrast).
- Mobile (<768px) swaps the top nav for a fixed bottom tab bar; pages reserve space via `.page` padding.
- Respect `prefers-reduced-motion` (global override in `index.css`); motion is transform/opacity only.
- `.browse-grid` styles live in `components/BrowsePage.css` but are reused by Browse, Search and Watchlist.

## Repo notes

- `skills/` and `.claude/skills|agents` hold the design skills (frontend-design, ui-ux-pro-max, taste-skill, design-motion-principles) and course agents; `screenshots/` and `.playwright-mcp/` are test artifacts.
- Shell has `noclobber` set: overwriting an existing file with `>` fails; use `>|` or the Write/Edit tools.
- Streaming/Play is out of scope: the Play buttons only show a toast.
