-- Streetflix schema as applied to Supabase.
-- Based on streetflix_erd.png plus approved changes: genres, standalone profiles
-- (no auth link, no email, avatar_url), composite unique on watchlist_items.
-- Creation order: users, titles, genres, title_genres, watchlist_items, catalog_titles (view)
-- Dev access: no login exists yet, so the "dev: open access until auth" policies give
-- anon full access to users/titles/genres/title_genres (migration dev_open_access_until_auth),
-- and watchlist_items is open to anon for select/insert/delete (no update).

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
create policy "dev: open access until auth"
  on public.users for all to anon
  using (true) with check (true);

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
  episodes         jsonb check (episodes is null or jsonb_typeof(episodes) = 'array'),  -- shows: [{title, provider, url}]
  slug             text not null,  -- app id from catalog.json: m1.., s1..
  tagline          text,           -- catalog.json tagline ('' when TMDB has none)
  runtime_label    text,           -- catalog.json runtime string, e.g. '1h 32m', '20 episodes', 'Full season'
  position         int not null,   -- index in catalog.json; default ordering
  constraint titles_slug_key unique (slug),
  constraint titles_position_key unique (position)
);
create index titles_content_type_idx on public.titles (content_type);
create index titles_name_trgm_idx    on public.titles using gin (name extensions.gin_trgm_ops);
alter table public.titles enable row level security;
create policy "Titles are public"
  on public.titles for select to anon, authenticated
  using (true);
create policy "dev: open access until auth"
  on public.titles for all to anon
  using (true) with check (true);

-- genres
create table public.genres (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);
alter table public.genres enable row level security;
create policy "Genres are public"
  on public.genres for select to anon, authenticated
  using (true);
create policy "dev: open access until auth"
  on public.genres for all to anon
  using (true) with check (true);

-- title_genres
create table public.title_genres (
  title_id  uuid not null references public.titles (id) on delete cascade,
  genre_id  uuid not null references public.genres (id) on delete cascade,
  position  smallint not null default 0,  -- index of the genre in the title's catalog.json genres
  primary key (title_id, genre_id)
);
create index title_genres_genre_id_idx on public.title_genres (genre_id);
alter table public.title_genres enable row level security;
create policy "Title genres are public"
  on public.title_genres for select to anon, authenticated
  using (true);
create policy "dev: open access until auth"
  on public.title_genres for all to anon
  using (true) with check (true);

-- Catalog rows for titles, genres and title_genres are in seed.sql.

-- watchlist_items
-- The diagram's unique marks on user_id and title_id are one composite unique.
-- No login yet: the app writes per-profile rows with the anon key, so the policies
-- are open (select/insert/delete; no update). Re-scope to auth.uid() when login exists.
create table public.watchlist_items (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users (id)  on delete cascade,
  title_id  uuid not null references public.titles (id) on delete cascade,
  added_at  timestamptz not null default now(),
  constraint watchlist_items_user_title_key unique (user_id, title_id)
);
create index watchlist_items_title_id_idx on public.watchlist_items (title_id);
alter table public.watchlist_items enable row level security;
create policy "Watchlist is readable by anyone"
  on public.watchlist_items for select to anon, authenticated
  using (true);
create policy "Anyone can add to a watchlist"
  on public.watchlist_items for insert to anon, authenticated
  with check (true);
create policy "Anyone can remove from a watchlist"
  on public.watchlist_items for delete to anon, authenticated
  using (true);
grant select, insert, delete on public.watchlist_items to anon, authenticated;

-- catalog_titles: one row per title in the exact catalog.json shape the app uses.
-- security_invoker so the caller's RLS on the base tables applies.
-- supabase-js: supabase.from('catalog_titles').select('*').order('position')
create view public.catalog_titles with (security_invoker = true) as
select
  t.slug                                   as id,
  t.id                                     as uuid,
  t.position                               as position,
  case when t.content_type = 'movie' then 'movie' else 'show' end as type,
  t.name                                   as title,
  t.release_year                           as year,
  t.maturity_rating                        as rating,
  t.runtime_label                          as runtime,
  t.runtime_minutes                        as "runtimeMinutes",
  coalesce((
    select array_agg(g.name order by tg.position, g.name)
    from public.title_genres tg
    join public.genres g on g.id = tg.genre_id
    where tg.title_id = t.id
  ), '{}'::text[])                         as genres,
  t.description                            as description,
  t.tagline                                as tagline,
  t.poster_url                             as poster,
  t.backdrop_url                           as backdrop,
  case when t.watch_url is null then null
       else jsonb_build_object('provider', case when t.watch_url ilike '%archive.org%' then 'archive' else 'youtube' end, 'url', t.watch_url)
  end                                      as watch,
  case when t.trailer_url is null then null
       else jsonb_build_object('provider', case when t.trailer_url ilike '%archive.org%' then 'archive' else 'youtube' end, 'url', t.trailer_url)
  end                                      as trailer,
  t.episodes                               as episodes   -- null for movies without episodes
from public.titles t;
revoke all on public.catalog_titles from anon, authenticated;
grant select on public.catalog_titles to anon, authenticated;
