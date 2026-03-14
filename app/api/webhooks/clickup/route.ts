/**
 * POST /api/webhooks/clickup
 * Handles ClickUp webhook events for bi-directional sync.
 */
import { NextRequest, NextResponse } from 'next/server'
import { handleClickUpWebhook } from '@/services/integrations/clickup'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    // Validate ClickUp webhook signature
    if (signature && process.env.CLICKUP_WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.CLICKUP_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (
        !crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSig)
        )
      ) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload: Record<string, unknown> = JSON.parse(body)
    await handleClickUpWebhook(payload)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[ClickUp Webhook] Error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
