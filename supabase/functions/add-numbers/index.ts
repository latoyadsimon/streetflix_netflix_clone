// add-numbers: GET /add-numbers?a=2&b=3 -> { "result": 5 }
// Missing or non-numeric `a`/`b` -> 400 { "error": "..." } naming every problem found.
// Deployed with JWT verification off (public, like hello-world), so no key is needed to call it.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Plain decimal numbers only: 3, -2.5, .5, 1e3. Rejects hex, empty strings, "Infinity", etc.,
// which Number() would otherwise accept or turn into 0.
const NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Returns the number, or an explanation of why the parameter can't be used.
function readNumber(params: URLSearchParams, name: string): number | string {
  const raw = params.get(name)
  if (raw === null || raw.trim() === '') return `Query parameter '${name}' is missing.`
  const value = raw.trim()
  if (!NUMBER.test(value)) return `Query parameter '${name}' must be a number, got '${raw}'.`
  return Number(value)
}

Deno.serve((req) => {
  // Browser preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const params = new URL(req.url).searchParams
  const a = readNumber(params, 'a')
  const b = readNumber(params, 'b')
  const problems = [a, b].filter((v): v is string => typeof v === 'string')
  if (problems.length > 0) return json({ error: problems.join(' ') }, 400)

  const result = (a as number) + (b as number)
  if (!Number.isFinite(result)) return json({ error: 'The numbers are too large to add.' }, 400)
  return json({ result })
})
