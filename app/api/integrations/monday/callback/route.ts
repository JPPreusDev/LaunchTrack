/**
 * GET /api/integrations/monday/callback
 * Monday.com OAuth callback.
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeMondayCode } from '@/services/integrations/monday'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=monday_oauth_failed`
    )
  }

  try {
    await exchangeMondayCode(code, state)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?success=monday_connected`
    )
  } catch (err) {
    console.error('[Monday OAuth] Callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=monday_oauth_failed`
    )
  }
}
