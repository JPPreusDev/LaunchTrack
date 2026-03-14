/**
 * GET /api/integrations/teamwork/callback
 * Teamwork OAuth callback.
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeTeamworkCode } from '@/services/integrations/teamwork'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=teamwork_oauth_failed`
    )
  }

  try {
    await exchangeTeamworkCode(code, state)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=teamwork_connected`
    )
  } catch (err) {
    console.error('[Teamwork OAuth] Callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=teamwork_oauth_failed`
    )
  }
}
