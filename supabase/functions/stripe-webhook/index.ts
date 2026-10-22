// stripe-webhook: receives Stripe events and records donations (idempotent by PaymentIntent id).
// Deployed with JWT verification off (Stripe sends no Supabase JWT); the Stripe signature is the auth.
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return json({ error: 'Missing stripe-signature header.' }, 400)

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('Invalid Stripe signature:', err)
    return json({ error: 'Invalid signature.' }, 400)
  }

  const status =
    event.type === 'payment_intent.succeeded' ? 'succeeded'
    : event.type === 'payment_intent.payment_failed' ? 'failed'
    : null
  if (!status) return json({ received: true })

  const pi = event.data.object as Stripe.PaymentIntent
  const userId = pi.metadata?.user_id
  if (!userId) {
    console.error(`PaymentIntent ${pi.id} has no metadata.user_id; skipping.`)
    return json({ received: true })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // A failed intent can later succeed (retried card), and Stripe may deliver events out of order,
  // so 'succeeded' upgrades an existing 'failed' row but a row is never downgraded.
  const markSucceeded = async () => {
    const { error } = await supabase
      .from('donations')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', pi.id)
      .neq('status', 'succeeded')
    if (error) console.error('donations update failed:', error)
    return error
  }

  const { data: existing, error: selectError } = await supabase
    .from('donations')
    .select('id, status')
    .eq('stripe_payment_intent_id', pi.id)
    .maybeSingle()
  if (selectError) {
    console.error('donations select failed:', selectError)
    return json({ error: 'Database error.' }, 500)
  }
  if (existing) {
    if (status === 'succeeded' && existing.status !== 'succeeded' && (await markSucceeded())) {
      return json({ error: 'Database error.' }, 500)
    }
    return json({ received: true })
  }

  const { error: insertError } = await supabase.from('donations').insert({
    user_id: userId,
    amount: pi.amount,
    stripe_payment_intent_id: pi.id,
    status,
  })
  if (insertError?.code === '23505') {
    // Lost a race with a concurrent delivery for the same intent.
    if (status === 'succeeded' && (await markSucceeded())) return json({ error: 'Database error.' }, 500)
  } else if (insertError) {
    console.error('donations insert failed:', insertError)
    return json({ error: 'Database error.' }, 500)
  }
  return json({ received: true })
})
