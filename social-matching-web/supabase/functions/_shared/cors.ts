const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN')
const ALLOWED_ORIGINS_ENV = Deno.env.get('ALLOWED_ORIGINS')

export function getCorsHeaders(req: Request): Record<string, string> {
  const defaultHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-circles-internal-secret',
  }

  const origin = req.headers.get('origin')
  if (!origin) {
    return { ...defaultHeaders, 'Access-Control-Allow-Origin': ALLOWED_ORIGIN ?? '' }
  }

  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return { ...defaultHeaders, 'Access-Control-Allow-Origin': origin }
  }

  if (ALLOWED_ORIGINS_ENV) {
    const allowedOrigins = ALLOWED_ORIGINS_ENV.split(',').map((value) => value.trim()).filter(Boolean)
    if (allowedOrigins.includes(origin)) {
      return { ...defaultHeaders, 'Access-Control-Allow-Origin': origin }
    }
  }

  if (ALLOWED_ORIGIN && ALLOWED_ORIGIN === origin) {
    return { ...defaultHeaders, 'Access-Control-Allow-Origin': origin }
  }

  return { ...defaultHeaders, 'Access-Control-Allow-Origin': ALLOWED_ORIGIN ?? '' }
}
