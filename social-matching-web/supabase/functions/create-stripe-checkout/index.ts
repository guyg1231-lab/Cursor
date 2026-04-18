import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

function jsonHeaders(req: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    'Content-Type': 'application/json',
  }
}

function response(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders(req),
  })
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

type EventCols = {
  payment_required: boolean
  price_cents: number
  currency: string
  title: string
}

type RegistrationRow = {
  id: string
  user_id: string
  event_id: string
  status: string
  expires_at: string | null
  events: EventCols
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return response(req, 405, { error: 'Method not allowed' })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return response(req, 401, { error: 'Missing authorization' })
  }

  let body: { registration_id?: string }
  try {
    body = (await req.json()) as { registration_id?: string }
  } catch {
    return response(req, 400, { error: 'Invalid JSON body' })
  }

  const registrationId = body.registration_id
  if (!registrationId || typeof registrationId !== 'string') {
    return response(req, 400, { error: 'registration_id required' })
  }

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const anonKey = requireEnv('SUPABASE_ANON_KEY')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const stripeSecret = requireEnv('STRIPE_SECRET_KEY')
  const successUrl = requireEnv('PAYMENT_CHECKOUT_SUCCESS_URL')
  const cancelUrl = requireEnv('PAYMENT_CHECKOUT_CANCEL_URL')

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) {
    return response(req, 401, { error: 'Invalid session' })
  }
  const userId = userData.user.id

  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: row, error: fetchErr } = await admin
    .from('event_registrations')
    .select(
      'id, user_id, event_id, status, expires_at, events!inner ( payment_required, price_cents, currency, title )',
    )
    .eq('id', registrationId)
    .maybeSingle()

  if (fetchErr) {
    console.error('[create-stripe-checkout] fetch', fetchErr)
    return response(req, 500, { error: 'Failed to load registration' })
  }

  if (!row) {
    return response(req, 404, { error: 'Registration not found' })
  }

  const reg = row as unknown as RegistrationRow

  if (reg.user_id !== userId) {
    return response(req, 403, { error: 'Forbidden' })
  }

  if (reg.status !== 'awaiting_response') {
    return response(req, 400, { error: 'Registration is not awaiting response' })
  }

  if (!reg.expires_at || new Date(reg.expires_at) <= new Date()) {
    return response(req, 400, { error: 'Offer has expired' })
  }

  const ev = reg.events
  if (!ev.payment_required || ev.price_cents <= 0) {
    return response(req, 400, { error: 'Event does not require payment' })
  }

  const currency = ev.currency.trim().toLowerCase()
  if (!/^[a-z]{3}$/.test(currency)) {
    return response(req, 500, { error: 'Invalid event currency' })
  }

  const { error: expireErr } = await admin
    .from('registration_payments')
    .update({ status: 'expired' })
    .eq('registration_id', reg.id)
    .eq('status', 'open')

  if (expireErr) {
    console.error('[create-stripe-checkout] expire open payments', expireErr)
    return response(req, 500, { error: 'Failed to prepare payment' })
  }

  const offerExpiresSec = Math.floor(new Date(reg.expires_at).getTime() / 1000)
  const nowSec = Math.floor(Date.now() / 1000)
  const stripeMinSec = nowSec + 30 * 60
  const stripeMaxSec = nowSec + 24 * 60 * 60 - 60
  const sessionExpiresAt = Math.min(Math.max(stripeMinSec, offerExpiresSec), stripeMaxSec)

  const productName = `Event registration — ${ev.title}`.slice(0, 120)

  const params = new URLSearchParams()
  params.append('mode', 'payment')
  params.append('success_url', successUrl)
  params.append('cancel_url', cancelUrl)
  params.append('client_reference_id', reg.id)
  params.append('metadata[registration_id]', reg.id)
  params.append('metadata[event_id]', reg.event_id)
  params.append('line_items[0][price_data][currency]', currency)
  params.append('line_items[0][price_data][product_data][name]', productName)
  params.append('line_items[0][price_data][unit_amount]', String(ev.price_cents))
  params.append('line_items[0][quantity]', '1')
  params.append('expires_at', String(sessionExpiresAt))

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })

  const stripeText = await stripeRes.text()
  let stripeJson: Record<string, unknown> = {}
  try {
    stripeJson = stripeText ? JSON.parse(stripeText) as Record<string, unknown> : {}
  } catch {
    return response(req, 502, { error: 'Invalid Stripe response' })
  }

  if (!stripeRes.ok) {
    console.error('[create-stripe-checkout] Stripe error', stripeText)
    return response(req, 502, {
      error: 'Stripe session creation failed',
      detail: typeof stripeJson.error === 'object' && stripeJson.error !== null &&
          'message' in stripeJson.error
        ? String((stripeJson.error as { message?: string }).message)
        : undefined,
    })
  }

  const sessionId = String(stripeJson.id ?? '')
  const url = typeof stripeJson.url === 'string' ? stripeJson.url : ''
  if (!sessionId || !url) {
    return response(req, 502, { error: 'Invalid Stripe response' })
  }

  const { error: insErr } = await admin.from('registration_payments').insert({
    registration_id: reg.id,
    event_id: reg.event_id,
    user_id: reg.user_id,
    provider: 'stripe',
    provider_checkout_session_id: sessionId,
    status: 'open',
    amount_cents: ev.price_cents,
    currency,
    metadata: { stripe_session_id: sessionId },
  })

  if (insErr) {
    console.error('[create-stripe-checkout] insert payment', insErr)
    return response(req, 500, { error: 'Failed to record payment attempt' })
  }

  return response(req, 200, { url, checkout_session_id: sessionId })
})
