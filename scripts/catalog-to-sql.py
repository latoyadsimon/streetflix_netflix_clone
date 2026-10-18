"""Dev-only: turns src/data/catalog.json into SQL inserts for Supabase.
Usage: python3 scripts/catalog-to-sql.py [--new-only] > out.sql
--new-only skips titles whose name already exists in supabase/seed.sql.
--shows-only emits only TV shows (used to replace them after the catalog changes)."""
import json, sys
d = json.load(open('src/data/catalog.json'))
if '--new-only' in sys.argv:
    seen = open('supabase/seed.sql').read()
    d = [t for t in d if '($q$' + t['title'] + '$q$,' not in seen]
if '--shows-only' in sys.argv:
    d = [t for t in d if t['type'] == 'show']
q = lambda s: 'null' if s is None else '$q$' + s + '$q$'
genres = sorted({g for t in d for g in t['genres']})
out = ['insert into public.genres (name) values ' + ', '.join("('%s')" % g for g in genres) + ' on conflict (name) do nothing;']
rows = []
for t in d:
    mins = 'null' if not t.get('runtimeMinutes') else str(t['runtimeMinutes'])
    if not t['episodes']:
        ep = 'null'
    elif '--compact' in sys.argv:
        # [season, title, 'yt:ID' | 'ia:ID'] triples, expanded into full episode objects by SQL (keeps the paste small)
        trip = [[e.get('season', ''), e['title'], ('yt:' if e['provider'] == 'youtube' else 'ia:') + e['url'].split('v=' if e['provider'] == 'youtube' else '/details/')[1]] for e in t['episodes']]
        ep = ("(select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('title',e->>1,'season',nullif(e->>0,''),"
              "'provider',case left(e->>2,2) when 'yt' then 'youtube' else 'archive' end,"
              "'url',case left(e->>2,2) when 'yt' then 'https://www.youtube.com/watch?v=' else 'https://archive.org/details/' end || substr(e->>2,4)))) "
              "from jsonb_array_elements($q$" + json.dumps(trip, separators=(',', ':'), ensure_ascii=False) + "$q$::jsonb) e)")
    else:
        ep = '$q$' + json.dumps(t['episodes'], separators=(',', ':')) + '$q$::jsonb'
    rows.append('(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)' % (
        q(t['title']), q(t['description']), t['year'], "'movie'" if t['type'] == 'movie' else "'tv_show'", q(t['rating']), mins,
        q(t['poster']), q(t['backdrop']), q(t['watch']['url']), q(t['trailer']['url'] if t['trailer'] else None), ep))
out.append('insert into public.titles (name,description,release_year,content_type,maturity_rating,runtime_minutes,poster_url,backdrop_url,watch_url,trailer_url,episodes) values\n' + ',\n'.join(rows) + ';')
tg = [(t['title'], g) for t in d for g in t['genres']]
out.append('insert into public.title_genres (title_id,genre_id)\nselect t.id,g.id from (values ' + ', '.join("(%s,'%s')" % (q(n), g) for n, g in tg) + ') as v(title,genre)\njoin public.titles t on t.name=v.title join public.genres g on g.name=v.genre;')
print('\n\n'.join(out))
