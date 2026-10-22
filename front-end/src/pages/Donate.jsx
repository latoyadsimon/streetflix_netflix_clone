import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { createDonationIntent } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import './Donate.css'

// Created once at module level so Stripe.js is loaded a single time.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const PRESETS = [500, 1000, 2500, 5000]
const MIN_CENTS = 50
const MAX_CENTS = 1_000_000
const GENERIC_ERROR = "Your payment couldn't be completed. Please try again."
const NETWORK_ERROR = 'Something went wrong. Please check your connection and try again.'

const CARD_MESSAGES = {
  card_declined: 'Your card was declined. Please try a different card.',
  insufficient_funds: 'Your card has insufficient funds. Please try a different card.',
  expired_card: 'Your card has expired. Please try a different card.',
  incorrect_cvc: "The security code (CVC) isn't right. Check it and try again.",
  incorrect_number: "The card number isn't right. Check it and try again.",
  invalid_expiry_year: "The expiry date isn't right. Check it and try again.",
  invalid_expiry_month: "The expiry date isn't right. Check it and try again.",
  processing_error: 'We hit a problem processing your card. Please try again in a moment.',
}

const cardMessage = (err) =>
  CARD_MESSAGES[err.decline_code] || CARD_MESSAGES[err.code] ||
  (err.type === 'api_connection_error' ? NETWORK_ERROR : GENERIC_ERROR)

const money = (cents) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Turns the custom field's text into cents, or null when it isn't a valid 0.50-10,000.00 amount.
const parseCustom = (text) => {
  if (!/^\d+(\.\d{1,2})?$/.test(text.trim())) return null
  const cents = Math.round(parseFloat(text) * 100)
  return cents >= MIN_CENTS && cents <= MAX_CENTS ? cents : null
}

const CARD_STYLE = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#b9b1c0' },
      iconColor: '#ffc83d',
    },
    invalid: { color: '#ff6b6b', iconColor: '#ff6b6b' },
  },
}

function DonateForm() {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [preset, setPreset] = useState(1000) // cents, or 'custom'
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { type: 'success', cents } | { type: 'error', message, retry }

  const cents = preset === 'custom' ? parseCustom(custom) : preset
  const customInvalid = preset === 'custom' && custom.trim() !== '' && cents === null

  const reset = () => { setResult(null); setPreset(1000); setCustom('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements || !cents || busy) return
    setBusy(true)
    setResult(null)
    try {
      const secret = await createDonationIntent(cents, user.id)
      const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
        payment_method: { card: elements.getElement(CardElement) },
      })
      if (error) setResult({ type: 'error', message: cardMessage(error) })
      else if (paymentIntent?.status === 'succeeded') setResult({ type: 'success', cents })
      else setResult({ type: 'error', message: GENERIC_ERROR })
    } catch (err) {
      if (err?.kind === 'server' && err.status === 400) {
        setResult({ type: 'error', message: 'Please choose an amount between $0.50 and $10,000.' })
      } else if (err?.kind === 'server') {
        setResult({ type: 'error', message: GENERIC_ERROR })
      } else {
        setResult({ type: 'error', message: NETWORK_ERROR, retry: true })
      }
    } finally {
      setBusy(false)
    }
  }

  if (result?.type === 'success') {
    return (
      <div className="donate-done" role="status">
        <p className="donate-thanks">Thank you for your {money(result.cents)} donation!</p>
        <p className="donate-sub">You just helped keep Streetflix free for everyone.</p>
        <button type="button" className="btn btn-primary" onClick={reset} autoFocus>Donate again</button>
      </div>
    )
  }

  return (
    <form className="donate-form" onSubmit={submit} noValidate>
      <fieldset className="donate-amounts">
        <legend>Choose an amount</legend>
        <div className="donate-options">
          {PRESETS.map((c) => (
            <label key={c} className="donate-option">
              <input type="radio" name="amount" checked={preset === c} onChange={() => setPreset(c)} />
              <span>{money(c).replace('.00', '')}</span>
            </label>
          ))}
          <label className="donate-option">
            <input type="radio" name="amount" checked={preset === 'custom'} onChange={() => setPreset('custom')} />
            <span>Other</span>
          </label>
        </div>
        {preset === 'custom' && (
          <label className="field donate-custom">
            <span>Amount in dollars</span>
            <input type="text" inputMode="decimal" autoFocus value={custom} placeholder="0.50 to 10,000"
              onChange={(e) => setCustom(e.target.value.replace(/[$,\s]/g, ''))}
              aria-invalid={customInvalid} aria-describedby="donate-custom-hint" />
            <small id="donate-custom-hint" className={customInvalid ? 'donate-bad' : ''}>
              {customInvalid ? 'Enter an amount from $0.50 to $10,000, with up to 2 decimals.' : 'From $0.50 to $10,000.'}
            </small>
          </label>
        )}
      </fieldset>

      <div className="donate-card">
        <span className="donate-label" id="donate-card-label">Card details</span>
        <div className="donate-card-box"><CardElement options={CARD_STYLE} /></div>
      </div>

      <div role="status" aria-live="polite" className="donate-live">
        {result?.type === 'error' && <p className="donate-error">{result.message}</p>}
        {busy && <p className="donate-sub">Processing your donation…</p>}
      </div>

      <button type="submit" className="btn btn-primary donate-submit" disabled={busy || !stripe || !cents}>
        {busy ? 'Processing…' : result?.retry ? 'Try again' : cents ? `Donate ${money(cents)}` : 'Donate'}
      </button>
    </form>
  )
}

export default function Donate() {
  return (
    <div className="donate page">
      <h1 className="donate-title">Buy the queens a coffee</h1>
      <p className="donate-lede">
        Streetflix is free for everyone. Donations keep the lights on and the catalog growing.
        Every dollar counts, and your card goes straight to Stripe.
      </p>
      <Elements stripe={stripePromise}>
        <DonateForm />
      </Elements>
    </div>
  )
}
