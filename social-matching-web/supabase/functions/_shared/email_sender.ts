import nodemailer from 'npm:nodemailer'

export interface EmailSendInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface EmailSendResult {
  provider: 'gmail'
  providerMessageId: string
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export function getDefaultFromAddress(): string {
  return Deno.env.get('EMAIL_FROM_ADDRESS') ?? 'Circles <circlesplatform@gmail.com>'
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function sendHtmlEmail(input: EmailSendInput): Promise<EmailSendResult> {
  const gmailUser = requireEnv('GMAIL_USER')
  const gmailAppPassword = requireEnv('GMAIL_APP_PASSWORD')

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
    connectionTimeout: 5000,
  })

  const info = await transporter.sendMail({
    from: input.from ?? getDefaultFromAddress(),
    to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? htmlToText(input.html),
  })

  const providerMessageId = typeof info.messageId === 'string' ? info.messageId.trim() : ''
  if (!providerMessageId) {
    throw new Error('[PROVIDER_MESSAGE_ID_MISSING] SMTP provider returned no messageId')
  }

  return {
    provider: 'gmail',
    providerMessageId,
  }
}
