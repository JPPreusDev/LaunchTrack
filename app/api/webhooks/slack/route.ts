/**
 * POST /api/webhooks/slack
 * Handles Slack event callbacks and slash commands.
 */
import { NextRequest, NextResponse } from 'next/server'
import { validateSlackSignature } from '@/services/integrations/slack'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const timestamp = request.headers.get('x-slack-request-timestamp') ?? ''
    const signature = request.headers.get('x-slack-signature') ?? ''

    // Validate timestamp to prevent replay attacks (5 min window)
    const tsAge = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (tsAge > 300) {
      return NextResponse.json({ error: 'Request too old' }, { status: 400 })
    }

    if (!validateSlackSignature(body, timestamp, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = new URLSearchParams(body)
    const type = payload.get('type')

    // Slack URL verification challenge
    const jsonBody = JSON.parse(body.startsWith('{') ? body : '{}') as {
      type?: string
      challenge?: string
    }
    if (jsonBody.type === 'url_verification') {
      return NextResponse.json({ challenge: jsonBody.challenge })
    }

    // Handle event callbacks
    console.log('[Slack Webhook] Received event type:', type ?? jsonBody.type)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Slack Webhook] Error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
