/**
 * GET /api/integrations/github/callback
 * Handles GitHub OAuth App callback — exchanges code for token.
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeGitHubCode } from '@/services/integrations/github'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // organizationId
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const settingsUrl = `${appUrl}/settings/integrations`

  if (error || !code || !state) {
    return NextResponse.redirect(`${settingsUrl}?error=github_auth_failed`)
  }

  try {
    await exchangeGitHubCode(code, state)
    return NextResponse.redirect(`${settingsUrl}?connected=github`)
  } catch (err) {
    console.error('[GitHub OAuth] Callback error:', err)
    return NextResponse.redirect(`${settingsUrl}?error=github_token_exchange_failed`)
  }
}
