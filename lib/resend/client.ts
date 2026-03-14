/**
 * Resend email client and send helpers.
 */
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@launchtrack.io'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

/**
 * Send a transactional email via Resend.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    reply_to: payload.replyTo,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  console.log('[Email] Sent:', data?.id, 'to', payload.to)
}

/**
 * Build a standardized email template wrapper.
 */
export function buildEmailHtml({
  agencyName,
  clientName,
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  agencyName: string
  clientName: string
  heading: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#0f172a;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">LaunchTrack</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">by ${agencyName}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:600;">${heading}</h2>
      <p style="margin:0 0 8px;color:#475569;font-size:15px;">Hi ${clientName},</p>
      <div style="color:#475569;font-size:15px;line-height:1.6;">${body}</div>

      ${ctaLabel && ctaUrl
        ? `<div style="margin-top:28px;">
            <a href="${ctaUrl}"
               style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;
                      padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
              ${ctaLabel}
            </a>
          </div>`
        : ''
      }
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding:20px 32px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        This email was sent by ${agencyName} via LaunchTrack.
        If you have questions, reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`
}
