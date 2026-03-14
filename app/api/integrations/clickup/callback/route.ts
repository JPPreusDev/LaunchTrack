/**
 * GET /api/integrations/clickup/callback
 * ClickUp OAuth callback — exchanges code for token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeClickUpCode } from '@/services/integrations/clickup'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') // organization_id

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=clickup_oauth_failed`
    )
  }

  try {
    await exchangeClickUpCode(code, state)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=clickup_connected`
    )
  } catch (err) {
    console.error('[ClickUp OAuth] Callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=clickup_oauth_failed`
    )
  }
}
