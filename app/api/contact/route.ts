/**
 * POST /api/contact — public contact/demo request form
 */
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { name, email, company, team_size, message } = await request.json()

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ data: null, error: 'Name and email are required' }, { status: 400 })
  }

  // Send via Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@rampify.com'
  const toEmail = process.env.CONTACT_TO_EMAIL ?? fromEmail

  if (resendKey && resendKey !== 're_...') {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: `Demo request from ${name} — ${company ?? 'Unknown company'}`,
          html: `
            <h2>New Demo Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company ?? '—'}</p>
            <p><strong>Team Size:</strong> ${team_size ?? '—'}</p>
            <p><strong>Message:</strong> ${message ?? '—'}</p>
          `,
        }),
      })
    } catch {
      // Log but don't fail — contact form should always succeed from user perspective
      console.error('[contact] Failed to send email')
    }
  }

  return NextResponse.json({ data: { ok: true }, error: null })
}
