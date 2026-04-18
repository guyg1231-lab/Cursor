import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { getDefaultFromAddress, sendHtmlEmail } from '../_shared/email_sender.ts'
import { sanitizeEmailHtml } from '../_shared/html_sanitize.ts'

type TemplateKey =
  | 'temporary_offer'
  | 'approved'

type RegistrationRow = {
  id: string
  user_id: string
  event_id: string
  status: string
  offered_at: string | null
  expires_at: string | null
  msg_temporary_offer_sent_at: string | null
  msg_temporary_offer_claiming_at: string | null
  msg_approved_sent_at: string | null
}

type EventRow = {
  id: string
  title: string
  city: string
  starts_at: string
}

type ProfileRow = {
  id: string
  full_name: string
  email: string
}

type TemplateRow = {
  key: string
  subject: string
  html_body: string
}

interface SendEmailRequest {
  user_id: string
  registration_id: string
  event_id: string
  template_key: TemplateKey
}

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

function authorize(req: Request) {
  const serviceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const processKey = Deno.env.get('PROCESS_EMAIL_QUEUE_SERVICE_KEY') ?? Deno.env.get('process_email_queue_service_key')
  const apiKey = req.headers.get('apikey')
  const authHeader = req.headers.get('authorization')
  const internalSecret = req.headers.get('x-circles-internal-secret')

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const accepted = [serviceRole, processKey].filter((value): value is string => Boolean(value))

  return accepted.includes(apiKey ?? '') || accepted.includes(bearerToken ?? '') || (processKey ? internalSecret === processKey : false)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jerusalem',
  }).format(date)
}

function replaceTemplateTokens(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{{${key}}}`, value),
    template,
  )
}

function renderFallbackTemplate(
  templateKey: TemplateKey,
  data: {
    name: string
    eventTitle: string
    city: string
    startsAt: string
    responseDeadline: string
    offerResponseUrl: string
  },
) {
  if (templateKey === 'temporary_offer') {
    return {
      subject: 'Circles - נשמר עבורך מקום זמני ⏳',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">היי ${data.name}, נשמר עבורך מקום זמני</h2>
          <p>התפנה עבורך מקום זמני לערב <strong>${data.eventTitle}</strong>.</p>
          <p><strong>מתי:</strong> ${data.startsAt}</p>
          <p><strong>איפה:</strong> ${data.city}</p>
          <p><strong>להגיב עד:</strong> ${data.responseDeadline}</p>
          <p>כדי לשמור את המקום הזה צריך לאשר אותו לפני שהחלון הזמני יפוג.</p>
          <p><a href="${data.offerResponseUrl}">לצפייה ואישור המקום</a></p>
        </div>
      `,
    }
  }

  return {
    subject: 'Circles - מקומך אושר ✅',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">היי ${data.name}, מקומך אושר</h2>
        <p>מקומך לערב <strong>${data.eventTitle}</strong> אושר.</p>
        <p><strong>מתי:</strong> ${data.startsAt}</p>
        <p><strong>איפה:</strong> ${data.city}</p>
      </div>
    `,
  }
}

async function loadSendContext(
  supabase: ReturnType<typeof createClient>,
  payload: SendEmailRequest,
) {
  const [{ data: registrationData, error: registrationError }, { data: eventData, error: eventError }, { data: profileData, error: profileError }, { data: templateData }] =
    await Promise.all([
      supabase
        .from('event_registrations')
        .select('id, user_id, event_id, status, offered_at, expires_at, msg_temporary_offer_sent_at, msg_temporary_offer_claiming_at, msg_approved_sent_at')
        .eq('id', payload.registration_id)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id, title, city, starts_at')
        .eq('id', payload.event_id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', payload.user_id)
        .maybeSingle(),
      supabase
        .from('email_templates')
        .select('key, subject, html_body')
        .eq('key', payload.template_key)
        .maybeSingle(),
    ])

  if (registrationError) throw new Error(`[SERVER] ${registrationError.message}`)
  if (eventError) throw new Error(`[SERVER] ${eventError.message}`)
  if (profileError) throw new Error(`[SERVER] ${profileError.message}`)

  const registration = registrationData as RegistrationRow | null
  const event = eventData as EventRow | null
  const profile = profileData as ProfileRow | null
  const template = templateData as TemplateRow | null

  if (!registration) throw new Error('[NOT_FOUND] registration not found')
  if (!event) throw new Error('[NOT_FOUND] event not found')
  if (!profile) throw new Error('[NOT_FOUND] profile not found')
  if (registration.user_id !== payload.user_id || registration.event_id !== payload.event_id) {
    throw new Error('[BAD_REQUEST] payload mismatch')
  }

  return { registration, event, profile, template: template ?? null }
}

async function claimTemporaryOffer(
  supabase: ReturnType<typeof createClient>,
  registration: RegistrationRow,
) {
  if (registration.status !== 'awaiting_response') {
    throw new Error('[CONFLICT] template/status mismatch')
  }

  if (!registration.expires_at || Date.parse(registration.expires_at) <= Date.now()) {
    throw new Error('[CONFLICT] offer has expired')
  }

  if (registration.msg_temporary_offer_sent_at) {
    throw new Error('[CONFLICT] temporary offer already sent')
  }

  const claimAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('event_registrations')
    .update({ msg_temporary_offer_claiming_at: claimAt })
    .eq('id', registration.id)
    .is('msg_temporary_offer_sent_at', null)
    .is('msg_temporary_offer_claiming_at', null)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(`[SERVER] ${error.message}`)
  if (!data) throw new Error('[CONFLICT] temporary offer already being processed')

  return claimAt
}

async function clearTemporaryOfferClaim(
  supabase: ReturnType<typeof createClient>,
  registrationId: string,
) {
  await supabase
    .from('event_registrations')
    .update({ msg_temporary_offer_claiming_at: null })
    .eq('id', registrationId)
}

function classifyErrorMessage(message: string) {
  const code = message.match(/\[([A-Z_]+)\]/)?.[1] ?? 'UNKNOWN'
  return {
    code,
    message: message.replace(/^\[[A-Z_]+\]\s*/, ''),
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return response(req, 405, { error: 'Method not allowed' })
  }

  if (!authorize(req)) {
    return response(req, 403, { error: 'Forbidden', code: 'FORBIDDEN' })
  }

  let payload: SendEmailRequest
  try {
    payload = await req.json()
  } catch {
    return response(req, 400, { error: 'Invalid JSON', code: 'BAD_REQUEST' })
  }

  if (!payload?.user_id || !payload?.registration_id || !payload?.event_id || !payload?.template_key) {
    return response(req, 400, { error: 'Missing required fields', code: 'BAD_REQUEST' })
  }

  if (payload.template_key !== 'temporary_offer' && payload.template_key !== 'approved') {
    return response(req, 400, { error: 'Unsupported template_key', code: 'BAD_REQUEST' })
  }

  const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

  try {
    const { registration, event, profile, template } = await loadSendContext(supabase, payload)

    if (payload.template_key === 'temporary_offer') {
      await claimTemporaryOffer(supabase, registration)
    } else {
      if (registration.status !== 'approved') {
        throw new Error('[CONFLICT] template/status mismatch')
      }
      if (registration.msg_approved_sent_at) {
        throw new Error('[CONFLICT] approved email already sent')
      }
    }

    const publicAppOrigin = Deno.env.get('PUBLIC_APP_ORIGIN') ?? Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173'
    const templateValues = {
      name: profile.full_name || 'חבר/ה',
      event_title: event.title,
      event_date: formatDateTime(event.starts_at),
      event_time: formatDateTime(event.starts_at),
      city: event.city,
      response_deadline: registration.expires_at ? formatDateTime(registration.expires_at) : '',
      offer_response_url: `${publicAppOrigin}/events/${event.id}/apply`,
      dashboard_url: `${publicAppOrigin}/dashboard`,
    }

    const fallback = renderFallbackTemplate(payload.template_key, {
      name: templateValues.name,
      eventTitle: event.title,
      city: event.city,
      startsAt: templateValues.event_date,
      responseDeadline: templateValues.response_deadline,
      offerResponseUrl: templateValues.offer_response_url,
    })

    const subject = template
      ? replaceTemplateTokens(template.subject, templateValues)
      : fallback.subject
    const rawHtml = template
      ? replaceTemplateTokens(template.html_body, templateValues)
      : fallback.html
    const html = sanitizeEmailHtml(rawHtml)

    const sendResult = await sendHtmlEmail({
      to: profile.email,
      subject,
      html,
      from: getDefaultFromAddress(),
    })

    const nowIso = new Date().toISOString()
    if (payload.template_key === 'temporary_offer') {
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({
          msg_temporary_offer_sent_at: nowIso,
          msg_temporary_offer_claiming_at: null,
        })
        .eq('id', registration.id)

      if (updateError) throw new Error(`[SERVER] ${updateError.message}`)
    } else {
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({ msg_approved_sent_at: nowIso })
        .eq('id', registration.id)

      if (updateError) throw new Error(`[SERVER] ${updateError.message}`)
    }

    const { error: logError } = await supabase
      .from('message_logs')
      .insert({
        event_id: event.id,
        registration_id: registration.id,
        user_id: profile.id,
        template_key: payload.template_key,
        status: 'sent',
        provider_message_id: sendResult.providerMessageId,
        error_code: null,
        error: null,
      })

    if (logError) throw new Error(`[SERVER] ${logError.message}`)

    return response(req, 200, {
      ok: true,
      provider: sendResult.provider,
      provider_message_id: sendResult.providerMessageId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const classified = classifyErrorMessage(message)

    try {
      const { registration_id, event_id, user_id, template_key } = payload
      if (template_key === 'temporary_offer' && registration_id) {
        await clearTemporaryOfferClaim(supabase, registration_id)
      }

      if (registration_id && template_key) {
        await supabase
          .from('message_logs')
          .insert({
            event_id: event_id ?? null,
            registration_id,
            user_id: user_id ?? null,
            template_key,
            status: 'failed',
            provider_message_id: null,
            error_code: classified.code,
            error: classified.message,
          })
      }
    } catch (logError) {
      console.error('[send-event-email] failed to record error', logError)
    }

    const status = classified.code === 'BAD_REQUEST'
      ? 400
      : classified.code === 'FORBIDDEN'
        ? 403
        : classified.code === 'NOT_FOUND'
          ? 404
          : classified.code === 'CONFLICT'
            ? 409
            : 500

    return response(req, status, {
      error: classified.message,
      code: classified.code,
    })
  }
})
