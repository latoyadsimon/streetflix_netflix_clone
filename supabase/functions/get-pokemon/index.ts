// get-pokemon: GET /get-pokemon?name=pikachu -> { "name": "pikachu", "sprite": "https://..." }
// Missing `name` -> 400. PokéAPI says not found -> 404. PokéAPI down or erroring -> 502.
// Deployed with JWT verification off (public, like hello-world), so no key is needed to call it.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // Browser preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // PokéAPI names are lowercase (e.g. "mr-mime"); it also accepts Pokédex numbers.
  const name = new URL(req.url).searchParams.get('name')?.trim().toLowerCase()
  if (!name) {
    return json({ error: "Query parameter 'name' is missing. Try ?name=pikachu." }, 400)
  }

  let res: Response
  try {
    res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`)
  } catch {
    return json({ error: 'Could not reach the PokéAPI. Try again later.' }, 502)
  }

  if (res.status === 404) {
    await res.body?.cancel()
    return json({ error: `No Pokémon named '${name}' was found.` }, 404)
  }
  if (!res.ok) {
    await res.body?.cancel()
    return json({ error: `The PokéAPI returned an error (HTTP ${res.status}). Try again later.` }, 502)
  }

  const pokemon = await res.json()
  // Some Pokémon forms have no front sprite; that comes back as null.
  return json({ name: pokemon.name, sprite: pokemon.sprites?.front_default ?? null })
})
