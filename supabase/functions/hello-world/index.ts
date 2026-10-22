// hello-world: returns { "message": "Hello, World!" } with CORS headers so a browser can call it.
// Deployed with --no-verify-jwt: it is public, and publishable keys (sb_publishable_...) are not
// JWTs, so JWT verification would reject browser calls made with the app's key.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve((req) => {
  // Browser preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response(JSON.stringify({ message: 'Hello, World!' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
