/**
 * GET /api/integrations/slack/callback
 * Slack OAuth callback — exchanges code for token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeSlackCode } from '@/services/integrations/slack'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') // organization_id
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=slack_oauth_failed`
    )
  }

  try {
    await exchangeSlackCode(code, state)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=slack_connected`
    )
  } catch (err) {
    console.error('[Slack OAuth] Callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=slack_oauth_failed`
    )
  }
}
