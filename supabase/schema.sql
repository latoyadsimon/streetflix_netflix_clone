-- Streetflix schema as applied to Supabase.
-- Based on streetflix_erd.png plus approved changes: genres, standalone profiles
-- (no auth link, no email, avatar_url), composite unique on watchlist_items.
-- Creation order: users, titles, genres, title_genres, watchlist_items

create extension if not exists pg_trgm with schema extensions;

-- users: standalone Netflix-style profiles (no login yet)
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  username    text not null check (char_length(username) <= 30),
  created_at  timestamptz not null default now(),
  avatar_url  text,
  constraint users_username_key unique (username)
);
alter table public.users enable row level security;
create policy "Users can read their own row"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can update their own row"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Profiles are readable by anyone"
  on public.users for select to anon
  using (true);

insert into public.users (username, avatar_url) values
  ('Queen B',   '/avatars/queen-b.png'),
  ('Spray',     '/avatars/spray.png'),
  ('Crown',     '/avatars/crown.png'),
  ('Stencil',   '/avatars/stencil.png'),
  ('Kid Neon',  '/avatars/kid-neon.png');

-- titles
create table public.titles (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  release_year     int,
  content_type     text not null check (content_type in ('movie', 'tv_show')),
  maturity_rating  text,
  runtime_minutes  int,
  poster_url       text,
  backdrop_url     text,
  created_at       timestamptz not null default now(),
  watch_url        text,   -- full title (YouTube or Internet Archive page URL)
  trailer_url      text,   -- YouTube trailer, optional
  episodes         jsonb check (episodes is null or jsonb_typeof(episodes) = 'array')  -- shows: [{title, provider, url}]
);
create index titles_content_type_idx on public.titles (content_type);
create index titles_name_trgm_idx    on public.titles using gin (name extensions.gin_trgm_ops);
alter table public.titles enable row level security;
create policy "Titles are public"
  on public.titles for select to anon, authenticated
  using (true);

-- genres
create table public.genres (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);
alter table public.genres enable row level security;
create policy "Genres are public"
  on public.genres for select to anon, authenticated
  using (true);

-- title_genres
create table public.title_genres (
  title_id  uuid not null references public.titles (id) on delete cascade,
  genre_id  uuid not null references public.genres (id) on delete cascade,
  primary key (title_id, genre_id)
);
create index title_genres_genre_id_idx on public.title_genres (genre_id);
alter table public.title_genres enable row level security;
create policy "Title genres are public"
  on public.title_genres for select to anon, authenticated
  using (true);

-- Catalog rows for titles, genres and title_genres are in seed.sql.

-- watchlist_items
-- The diagram's unique marks on user_id and title_id are one composite unique.
-- Owner-only policies need auth.uid(), so they are inert until login exists;
-- the app keeps the watchlist in memory for now.
create table public.watchlist_items (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users (id)  on delete cascade,
  title_id  uuid not null references public.titles (id) on delete cascade,
  added_at  timestamptz not null default now(),
  constraint watchlist_items_user_title_key unique (user_id, title_id)
);
create index watchlist_items_title_id_idx on public.watchlist_items (title_id);
alter table public.watchlist_items enable row level security;
create policy "Users can read their own watchlist"
  on public.watchlist_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can add to their own watchlist"
  on public.watchlist_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can remove from their own watchlist"
  on public.watchlist_items for delete to authenticated
  using ((select auth.uid()) = user_id);
