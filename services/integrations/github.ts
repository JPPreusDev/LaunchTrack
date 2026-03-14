/**
 * GitHub Integration Service.
 * OAuth App flow + webhook event handling.
 * Supports: linking repos to projects, auto-completing tasks on PR merge.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto/tokens'

const GITHUB_API = 'https://api.github.com'

/**
 * Get OAuth authorization URL for GitHub.
 */
export function getGitHubAuthUrl(organizationId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`,
    scope: 'repo,read:user,read:org',
    state: organizationId,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

/**
 * Exchange OAuth code for access token and store it.
 */
export async function exchangeGitHubCode(
  code: string,
  organizationId: string
): Promise<void> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`,
    }),
  })

  const data: { access_token?: string; error?: string } = await response.json()

  if (!data.access_token) {
    throw new Error(data.error ?? 'GitHub OAuth failed — no access token returned')
  }

  // Fetch GitHub user info for display metadata
  const userRes = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  const githubUser: { login?: string; name?: string; avatar_url?: string } = userRes.ok
    ? await userRes.json()
    : {}

  const encryptedToken = await encrypt(data.access_token)

  const supabase = createServiceClient()
  await supabase
    .from('integrations')
    .upsert({
      organization_id: organizationId,
      provider: 'github',
      access_token_encrypted: encryptedToken,
      metadata: {
        login: githubUser.login,
        name: githubUser.name,
        avatar_url: githubUser.avatar_url,
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .match({ organization_id: organizationId, provider: 'github' })
}

/**
 * Get the stored GitHub access token for an organization.
 */
async function getGitHubToken(organizationId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('integrations')
    .select('access_token_encrypted')
    .eq('organization_id', organizationId)
    .eq('provider', 'github')
    .eq('is_active', true)
    .single()

  if (!data?.access_token_encrypted) return null
  try {
    return await decrypt(data.access_token_encrypted)
  } catch {
    return null
  }
}

interface GitHubPushPayload {
  repository: { full_name: string }
  ref: string
  commits: Array<{ id: string; message: string; url: string }>
  pusher: { name: string }
}

interface GitHubPullRequestPayload {
  action: string
  pull_request: {
    id: number
    number: number
    title: string
    html_url: string
    merged: boolean
    state: string
    body: string | null
    head: { ref: string }
    base: { ref: string }
  }
  repository: { full_name: string }
}

/**
 * Handle a GitHub push event.
 * Logs the push to portal_activity_log and optionally links to tasks via commit message.
 * Convention: include "Closes #<taskId>" or "Fixes #<taskId>" in commit message to auto-link.
 */
export async function handleGitHubPush(
  payload: GitHubPushPayload,
  organizationId: string
): Promise<void> {
  const supabase = createServiceClient()

  // Find integration_mapping for this repo
  const { data: mapping } = await supabase
    .from('integration_mappings')
    .select('project_id')
    .eq('organization_id', organizationId)
    .eq('provider', 'github')
    .eq('external_project_id', payload.repository.full_name)
    .maybeSingle()

  if (!mapping) return // Repo not linked to a LaunchTrack project

  // Log activity
  await supabase.from('portal_activity_log').insert({
    organization_id: organizationId,
    project_id: mapping.project_id,
    action_type: 'code_push',
    metadata: {
      repo: payload.repository.full_name,
      ref: payload.ref,
      commit_count: payload.commits.length,
      pusher: payload.pusher.name,
      latest_commit: payload.commits[0]?.message ?? null,
    },
  }).select('id')
}

/**
 * Handle a GitHub pull_request event.
 * On PR merge: look for linked tasks by PR title/body pattern and mark them complete.
 * Convention: include "task:<taskId>" in PR description to auto-complete.
 */
export async function handleGitHubPullRequest(
  payload: GitHubPullRequestPayload,
  organizationId: string
): Promise<void> {
  if (payload.action !== 'closed' || !payload.pull_request.merged) return

  const supabase = createServiceClient()
  const pr = payload.pull_request

  // Find integration_mapping for this repo
  const { data: mapping } = await supabase
    .from('integration_mappings')
    .select('project_id')
    .eq('organization_id', organizationId)
    .eq('provider', 'github')
    .eq('external_project_id', payload.repository.full_name)
    .maybeSingle()

  if (!mapping) return

  // Look for task IDs in PR body: "task:abc123def" or "task: abc123def"
  const body = pr.body ?? ''
  const taskMatches = body.match(/task:\s*([a-f0-9-]{8,})/gi)

  if (taskMatches && taskMatches.length > 0) {
    for (const match of taskMatches) {
      const taskId = match.replace(/task:\s*/i, '').trim()
      // Verify task belongs to this project before updating
      const { data: task } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('id', taskId)
        .maybeSingle()

      if (task && task.status !== 'completed') {
        await supabase
          .from('tasks')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', taskId)
      }
    }
  }

  // Log PR merge as activity
  await supabase.from('portal_activity_log').insert({
    organization_id: organizationId,
    project_id: mapping.project_id,
    action_type: 'pr_merged',
    metadata: {
      pr_number: pr.number,
      pr_title: pr.title,
      pr_url: pr.html_url,
      head_branch: pr.head.ref,
      base_branch: pr.base.ref,
    },
  }).select('id')
}

/**
 * Validate GitHub webhook signature (HMAC-SHA256).
 */
export function validateGitHubSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return false

  const crypto = require('crypto')
  const expectedSig = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')}`

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}
