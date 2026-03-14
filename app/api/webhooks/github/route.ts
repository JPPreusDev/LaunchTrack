/**
 * POST /api/webhooks/github
 * Handles incoming GitHub webhook events.
 * Validates HMAC-SHA256 signature, routes push and pull_request events.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  validateGitHubSignature,
  handleGitHubPush,
  handleGitHubPullRequest,
} from '@/services/integrations/github'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256') ?? ''
  const event = request.headers.get('x-github-event') ?? ''

  // Validate signature
  if (!validateGitHubSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Resolve organization from the repo full_name stored in integration_mappings
  const repoFullName = (payload.repository as { full_name?: string })?.full_name
  if (!repoFullName) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()
  const { data: mapping } = await supabase
    .from('integration_mappings')
    .select('organization_id')
    .eq('provider', 'github')
    .eq('external_project_id', repoFullName)
    .maybeSingle()

  if (!mapping?.organization_id) {
    return NextResponse.json({ ok: true }) // Repo not linked — ignore silently
  }

  const orgId = mapping.organization_id

  try {
    if (event === 'push') {
      await handleGitHubPush(payload as unknown as Parameters<typeof handleGitHubPush>[0], orgId)
    } else if (event === 'pull_request') {
      await handleGitHubPullRequest(
        payload as unknown as Parameters<typeof handleGitHubPullRequest>[0],
        orgId
      )
    }
  } catch (err) {
    console.error('[GitHub Webhook] Handler error:', err)
    // Return 200 so GitHub doesn't retry — errors are internal
  }

  return NextResponse.json({ ok: true })
}
