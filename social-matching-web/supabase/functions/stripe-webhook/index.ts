import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyStripeWebhookSignature } from '../_shared/stripe_webhook_verify.ts'

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

type CheckoutSession = {
  id?: string
  metadata?: Record<string, string | undefined>
  payment_status?: string
  amount_total?: number | null
  currency?: string | null
  payment_intent?: string | null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
  const signature = req.headers.get('stripe-signature')
  const rawBody = await req.text()

  const ok = await verifyStripeWebhookSignature(rawBody, signature, webhookSecret)
  if (!ok) {
    return jsonResponse(400, { error: 'Invalid signature' })
  }

  let event: { type?: string; data?: { object?: CheckoutSession } }
  try {
    event = JSON.parse(rawBody) as typeof event
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' })
  }

  if (event.type !== 'checkout.session.completed') {
    return jsonResponse(200, { received: true, ignored: true })
  }

  const session = event.data?.object
  if (!session?.id) {
    return jsonResponse(200, { received: true, ignored: true })
  }

  if (session.payment_status !== 'paid') {
    return jsonResponse(200, { received: true, ignored: true, reason: 'not_paid' })
  }

  const registrationId = session.metadata?.registration_id
  const eventId = session.metadata?.event_id
  if (!registrationId || !eventId) {
    console.warn('[stripe-webhook] missing metadata', session.id)
    return jsonResponse(200, { received: true, ignored: true, reason: 'no_metadata' })
  }

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const { data: reg, error: regErr } = await admin
    .from('event_registrations')
    .select('id, event_id, status, user_id')
    .eq('id', registrationId)
    .maybeSingle()

  if (regErr || !reg) {
    console.error('[stripe-webhook] registration lookup', regErr)
    return jsonResponse(500, { error: 'Registration lookup failed' })
  }

  if (reg.event_id !== eventId) {
    console.warn('[stripe-webhook] event_id mismatch', registrationId)
    return jsonResponse(200, { received: true, ignored: true, reason: 'event_mismatch' })
  }

  const { data: ev, error: evErr } = await admin
    .from('events')
    .select('id, payment_required, price_cents, currency')
    .eq('id', eventId)
    .maybeSingle()

  if (evErr || !ev) {
    console.error('[stripe-webhook] event lookup', evErr)
    return jsonResponse(500, { error: 'Event lookup failed' })
  }

  if (!ev.payment_required) {
    return jsonResponse(200, { received: true, ignored: true, reason: 'payment_not_required' })
  }

  const expectedCents = ev.price_cents
  const amountTotal = session.amount_total
  if (amountTotal == null || amountTotal !== expectedCents) {
    console.warn('[stripe-webhook] amount mismatch', { amountTotal, expectedCents, session: session.id })
    return jsonResponse(200, { received: true, ignored: true, reason: 'amount_mismatch' })
  }

  const sessionCurrency = (session.currency ?? '').toLowerCase()
  const eventCurrency = (ev.currency as string).trim().toLowerCase()
  if (sessionCurrency !== eventCurrency) {
    console.warn('[stripe-webhook] currency mismatch', { sessionCurrency, eventCurrency })
    return jsonResponse(200, { received: true, ignored: true, reason: 'currency_mismatch' })
  }

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  const { data: existingPay } = await admin
    .from('registration_payments')
    .select('id, status')
    .eq('provider_checkout_session_id', session.id)
    .maybeSingle()

  if (existingPay) {
    await admin
      .from('registration_payments')
      .update({
        status: 'succeeded',
        provider_payment_intent_id: paymentIntentId,
        metadata: { stripe_session_id: session.id, webhook: 'checkout.session.completed' },
      })
      .eq('id', existingPay.id)
  } else {
    await admin.from('registration_payments').insert({
      registration_id: registrationId,
      event_id: eventId,
      user_id: reg.user_id,
      provider: 'stripe',
      provider_checkout_session_id: session.id,
      provider_payment_intent_id: paymentIntentId,
      status: 'succeeded',
      amount_cents: expectedCents,
      currency: eventCurrency,
      metadata: { stripe_session_id: session.id, webhook: 'checkout.session.completed', recovered: true },
    })
  }

  const { data: updated, error: updErr } = await admin
    .from('event_registrations')
    .update({ status: 'confirmed' })
    .eq('id', registrationId)
    .eq('status', 'awaiting_response')
    .select('id')
    .maybeSingle()

  if (updErr) {
    console.error('[stripe-webhook] confirm update', updErr)
    return jsonResponse(500, { error: 'Confirm update failed' })
  }

  return jsonResponse(200, {
    received: true,
    confirmed: Boolean(updated),
  })
})
