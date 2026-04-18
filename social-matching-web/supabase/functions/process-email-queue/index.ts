import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

type QueueRow = {
  id: string
  user_id: string
  registration_id: string
  event_id: string
  template_key: string
  retry_count: number
  next_attempt_at: string | null
}

const MAX_RETRIES = 5
const BATCH_SIZE = 10
const CLAIM_LEASE_MS = 2 * 60 * 1000

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
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

function authorize(req: Request) {
  const serviceRole = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const processKey = Deno.env.get('PROCESS_EMAIL_QUEUE_SERVICE_KEY') ?? Deno.env.get('process_email_queue_service_key')
  const apiKey = req.headers.get('apikey')
  const authHeader = req.headers.get('authorization')

  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const accepted = [serviceRole, processKey].filter((value): value is string => Boolean(value))

  return accepted.includes(apiKey ?? '') || accepted.includes(bearerToken ?? '')
}

function classifyFailure(message: string) {
  const normalized = message.toLowerCase()
  const taggedCode = message.match(/\[([A-Z_]+)\]/)?.[1]
  if (taggedCode) {
    return { code: taggedCode, terminal: ['BAD_REQUEST', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT'].includes(taggedCode), reason: message }
  }

  if (normalized.includes('forbidden')) return { code: 'FORBIDDEN', terminal: true, reason: message }
  if (normalized.includes('not found')) return { code: 'NOT_FOUND', terminal: true, reason: message }
  if (normalized.includes('conflict')) return { code: 'CONFLICT', terminal: true, reason: message }
  if (normalized.includes('timeout') || normalized.includes('network') || normalized.includes('fetch')) {
    return { code: 'NETWORK', terminal: false, reason: message }
  }

  return { code: 'UNKNOWN', terminal: false, reason: message }
}

function computeBackoffSeconds(nextRetryCount: number) {
  return Math.min(30 * (2 ** Math.max(nextRetryCount - 1, 0)), 60 * 60)
}

/** Stable fields on every `processed[]` entry for operator correlation (no behavior change). */
function queueItemContext(row: QueueRow) {
  return {
    id: row.id,
    registration_id: row.registration_id,
    template_key: row.template_key,
    event_id: row.event_id,
  }
}

async function claimQueueRow(
  supabase: ReturnType<typeof createClient>,
  item: QueueRow,
) {
  const nowIso = new Date().toISOString()
  const leaseUntil = new Date(Date.now() + CLAIM_LEASE_MS).toISOString()

  const { data, error } = await supabase
    .from('email_queue')
    .update({
      next_attempt_at: leaseUntil,
      updated_at: nowIso,
    })
    .eq('id', item.id)
    .eq('status', 'queued')
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
    .select('id')
    .maybeSingle()

  if (error) throw error
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return response(req, 405, { error: 'Method not allowed' })
  }

  if (!authorize(req)) {
    return response(req, 403, { error: 'Forbidden' })
  }

  const supabaseUrl = requireEnv('SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const processKey = Deno.env.get('PROCESS_EMAIL_QUEUE_SERVICE_KEY') ?? Deno.env.get('process_email_queue_service_key')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    await supabase.rpc('release_stale_email_claims')
  } catch (error) {
    console.warn('[process-email-queue] stale claim release failed', error)
  }

  const nowIso = new Date().toISOString()
  const { data: dueRows, error: fetchError } = await supabase
    .from('email_queue')
    .select('id, user_id, registration_id, event_id, template_key, retry_count, next_attempt_at')
    .eq('status', 'queued')
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError) {
    return response(req, 500, { error: fetchError.message, code: 'SERVER' })
  }

  const queueRows = (dueRows ?? []) as QueueRow[]
  if (queueRows.length === 0) {
    return response(req, 200, {
      processed: [],
      counts: { sent: 0, failed: 0, queued: 0, skipped: 0 },
    })
  }

  const results: Array<Record<string, unknown>> = []

  for (const row of queueRows) {
    try {
      const claimed = await claimQueueRow(supabase, row)
      if (!claimed) {
        results.push({ ...queueItemContext(row), status: 'skipped_not_claimed' })
        continue
      }

      const invokeHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: anonKey ?? serviceRoleKey,
        Authorization: `Bearer ${processKey ?? serviceRoleKey}`,
      }
      if (processKey) {
        invokeHeaders['x-circles-internal-secret'] = processKey
      }

      const invokeResponse = await fetch(`${supabaseUrl}/functions/v1/send-event-email`, {
        method: 'POST',
        headers: invokeHeaders,
        body: JSON.stringify({
          user_id: row.user_id,
          registration_id: row.registration_id,
          event_id: row.event_id,
          template_key: row.template_key,
        }),
      })

      const text = await invokeResponse.text()
      const data = text ? JSON.parse(text) as Record<string, unknown> : {}

      if (!invokeResponse.ok) {
        throw new Error(`[${String(data.code ?? 'FUNCTION_HTTP_ERROR')}] ${String(data.error ?? 'Function invocation failed')}`)
      }

      const providerMessageId =
        (typeof data.provider_message_id === 'string' && data.provider_message_id)
        || null

      if (!providerMessageId) {
        throw new Error('[PROVIDER_MESSAGE_ID_MISSING] send-event-email returned success without provider_message_id')
      }

      const { error: updateError } = await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: providerMessageId,
          next_attempt_at: null,
          error_code: null,
          error_reason: null,
          error_message: null,
          last_error: null,
        })
        .eq('id', row.id)

      if (updateError) throw updateError

      results.push({
        ...queueItemContext(row),
        status: 'sent',
        provider_message_id: providerMessageId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const failure = classifyFailure(message)
      const nextRetryCount = (row.retry_count ?? 0) + 1
      const terminal = failure.terminal || nextRetryCount >= MAX_RETRIES
      const nextAttemptAt = terminal
        ? null
        : new Date(Date.now() + computeBackoffSeconds(nextRetryCount) * 1000).toISOString()

      const { error: updateError } = await supabase
        .from('email_queue')
        .update({
          status: terminal ? 'failed' : 'queued',
          retry_count: nextRetryCount,
          next_attempt_at: nextAttemptAt,
          error_code: failure.code,
          error_reason: failure.reason,
          error_message: message,
          last_error: message,
        })
        .eq('id', row.id)

      if (updateError) {
        return response(req, 500, {
          error: updateError.message,
          code: 'SERVER',
          failed_row_id: row.id,
        })
      }

      results.push({
        ...queueItemContext(row),
        status: terminal ? 'failed' : 'queued',
        retry_count: nextRetryCount,
        error_code: failure.code,
        error_message: message,
      })
    }
  }

  return response(req, 200, {
    processed: results,
    counts: {
      sent: results.filter((item) => item.status === 'sent').length,
      failed: results.filter((item) => item.status === 'failed').length,
      queued: results.filter((item) => item.status === 'queued').length,
      skipped: results.filter((item) => item.status === 'skipped_not_claimed').length,
    },
  })
})
