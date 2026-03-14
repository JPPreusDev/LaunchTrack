/**
 * GET /api/integrations/jira/callback
 * Handles Jira Cloud OAuth 2.0 callback — exchanges code for tokens.
 */
import { NextRequest, NextResponse } from 'next/server'
import { exchangeJiraCode } from '@/services/integrations/jira'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // organizationId
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const settingsUrl = `${appUrl}/settings/integrations`

  if (error || !code || !state) {
    return NextResponse.redirect(`${settingsUrl}?error=jira_auth_failed`)
  }

  try {
    await exchangeJiraCode(code, state)
    return NextResponse.redirect(`${settingsUrl}?connected=jira`)
  } catch (err) {
    console.error('[Jira OAuth] Callback error:', err)
    return NextResponse.redirect(`${settingsUrl}?error=jira_token_exchange_failed`)
  }
}
