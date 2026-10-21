-- Streetflix schema as applied to Supabase.
-- Based on streetflix_erd.png plus approved changes: genres, composite unique on
-- watchlist_items, Netflix-style profiles owned by a Supabase Auth login, and per-profile
-- watched state (watched_titles) in place of the old shared titles.is_watched column.
-- Creation order: users, titles, genres, title_genres, watchlist_items, watched_titles,
-- catalog_titles (view), then the RLS policies and grants.
-- Migrations: create_users_profiles, create_catalog_and_watchlist_tables, seed_catalog
-- (supabase/seed.sql), rls_policies_profiles_watchlists.
-- Access: the catalog is public-read for anon and authenticated and has no write policies
-- (it changes only through migrations). Profiles, watchlists and watched titles are
-- reachable only by the signed-in login that owns the profile; anon has no access to them.
-- public.rls_auto_enable() is part of the project but not of this schema; leave it alone.

create extension if not exists pg_trgm with schema extensions;

-- users: profiles. One login (auth.users) can own many profiles; each profile has its own
-- watchlist and watched titles. No email here; Supabase Auth keeps it in auth.users.
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
              references auth.users (id) on delete cascade,   -- the login that owns this profile
  username    text not null check (char_length(username) between 1 and 30),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  constraint users_owner_username_key unique (owner_id, username)  -- also serves as the owner_id index
);
alter table public.users enable row level security;

-- First profile is created at sign-up from the sign-up metadata
-- (supabase.auth.signUp({ email, password, options: { data: { username, avatar_url } } })).
-- Falls back to the part of the email before the @, then 'Viewer'.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (owner_id, username, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
                  split_part(new.email, '@', 1),
                  'Viewer'), 30),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- genres
create table public.genres (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);
alter table public.genres enable row level security;

-- title_genres
create table public.title_genres (
  title_id  uuid not null references public.titles (id) on delete cascade,
  genre_id  uuid not null references public.genres (id) on delete cascade,
  position  smallint not null default 0,  -- index of the genre in the title's catalog.json genres
  primary key (title_id, genre_id)
);
create index title_genres_genre_id_idx on public.title_genres (genre_id);
alter table public.title_genres enable row level security;

-- Catalog rows for titles, genres and title_genres are in seed.sql.

-- watchlist_items: one row per (profile, title).
-- The diagram's unique marks on user_id and title_id are one composite unique.
-- user_id is a profile id (public.users.id), not a login id, so it has no default:
-- the app sends the active profile and the policies check that the login owns it.
-- No update policy: adds must use upsert with ignoreDuplicates (on conflict do nothing).
create table public.watchlist_items (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users (id)  on delete cascade,  -- the profile
  title_id  uuid not null references public.titles (id) on delete cascade,
  added_at  timestamptz not null default now(),
  constraint watchlist_items_user_title_key unique (user_id, title_id)
);
create index watchlist_items_title_id_idx on public.watchlist_items (title_id);
alter table public.watchlist_items enable row level security;

-- watched_titles: replaces titles.is_watched; a row means this profile has watched the title.
-- Independent of the watchlist, and other profiles are unaffected.
create table public.watched_titles (
  user_id     uuid not null references public.users (id)  on delete cascade,  -- the profile
  title_id    uuid not null references public.titles (id) on delete cascade,
  watched_at  timestamptz not null default now(),
  primary key (user_id, title_id)
);
create index watched_titles_title_id_idx on public.watched_titles (title_id);
alter table public.watched_titles enable row level security;

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

-- ===== RLS policies and grants =====
-- The revokes strip Supabase's default table grants; each role gets back only what its
-- policies use.

-- Catalog: readable by everyone, signed in or not; nobody can write it from the client.
create policy "Titles are public"
  on public.titles for select to anon, authenticated using (true);
create policy "Genres are public"
  on public.genres for select to anon, authenticated using (true);
create policy "Title genres are public"
  on public.title_genres for select to anon, authenticated using (true);

revoke all on public.titles, public.genres, public.title_genres from anon, authenticated;
grant select on public.titles, public.genres, public.title_genres to anon, authenticated;

revoke all on public.catalog_titles from anon, authenticated;
grant select on public.catalog_titles to anon, authenticated;

-- users (profiles): a signed-in user sees and manages only the profiles of their own login.
create policy "Owners can read their profiles"
  on public.users for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owners can add profiles"
  on public.users for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Owners can update their profiles"
  on public.users for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners can delete their profiles"
  on public.users for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on public.users from anon, authenticated;
grant select, insert, update, delete on public.users to authenticated;

-- watchlist_items: rows are reachable only through a profile the signed-in user owns.
create policy "Owners can read their profiles' watchlists"
  on public.watchlist_items for select to authenticated
  using (exists (select 1 from public.users u
                 where u.id = watchlist_items.user_id and u.owner_id = (select auth.uid())));
create policy "Owners can add to their profiles' watchlists"
  on public.watchlist_items for insert to authenticated
  with check (exists (select 1 from public.users u
                      where u.id = watchlist_items.user_id and u.owner_id = (select auth.uid())));
create policy "Owners can remove from their profiles' watchlists"
  on public.watchlist_items for delete to authenticated
  using (exists (select 1 from public.users u
                 where u.id = watchlist_items.user_id and u.owner_id = (select auth.uid())));

revoke all on public.watchlist_items from anon, authenticated;
grant select, insert, delete on public.watchlist_items to authenticated;

-- watched_titles: same rule as the watchlist.
create policy "Owners can read their profiles' watched titles"
  on public.watched_titles for select to authenticated
  using (exists (select 1 from public.users u
                 where u.id = watched_titles.user_id and u.owner_id = (select auth.uid())));
create policy "Owners can mark titles watched"
  on public.watched_titles for insert to authenticated
  with check (exists (select 1 from public.users u
                      where u.id = watched_titles.user_id and u.owner_id = (select auth.uid())));
create policy "Owners can unmark watched titles"
  on public.watched_titles for delete to authenticated
  using (exists (select 1 from public.users u
                 where u.id = watched_titles.user_id and u.owner_id = (select auth.uid())));

revoke all on public.watched_titles from anon, authenticated;
grant select, insert, delete on public.watched_titles to authenticated;
