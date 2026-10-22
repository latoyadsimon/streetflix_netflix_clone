// process-donation: POST { amount (cents), user_id } -> 200 { client_secret } for a Stripe PaymentIntent.
// Deployed with JWT verification on; the function also checks the user and that user_id matches.
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MIN_AMOUNT = 50 // Stripe's USD minimum, in cents
const MAX_AMOUNT = 1_000_000 // $10,000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'You must be signed in to donate.' }, 401)

    let body: { amount?: unknown; user_id?: unknown }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Request body must be JSON.' }, 400)
    }

    if (body.user_id !== user.id) return json({ error: 'user_id does not match the signed-in user.' }, 403)

    const amount = body.amount
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return json({ error: 'Amount must be a whole number of cents between $0.50 and $10,000.' }, 400)
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      httpClient: Stripe.createFetchHttpClient(),
    })
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { user_id: user.id },
      description: 'Streetflix donation',
    })
    return json({ client_secret: paymentIntent.client_secret })
  } catch (err) {
    console.error('process-donation failed:', err)
    return json({ error: 'Could not start the donation. Please try again.' }, 500)
  }
})
