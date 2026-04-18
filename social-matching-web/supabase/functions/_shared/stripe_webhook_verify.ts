/**
 * Verify Stripe-Signature header (v1) per https://stripe.com/docs/webhooks/signatures
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!signatureHeader) return false

  const parts = signatureHeader.split(',').map((p) => p.trim())
  const tPart = parts.find((p) => p.startsWith('t='))
  const v1Sigs = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))
  if (!tPart || v1Sigs.length === 0) return false

  const t = tPart.slice(2)
  const ts = Number(t)
  if (Number.isNaN(ts)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - ts) > toleranceSeconds) return false

  const signedPayload = `${t}.${rawBody}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload))
  const expectedHex = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('')

  return v1Sigs.some((sig) => timingSafeEqualHex(expectedHex, sig))
}
