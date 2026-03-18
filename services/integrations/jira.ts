/**
 * Jira Integration Service.
 * Jira Cloud OAuth 2.0 (3-legged) + issue push.
 * Supports: syncing OnRampd tasks to Jira Cloud issues.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto/tokens'
import type { Task } from '@/types'

const JIRA_AUTH_URL = 'https://auth.atlassian.com/authorize'
const JIRA_TOKEN_URL = 'https://auth.atlassian.com/oauth/token'
const JIRA_API_URL = 'https://api.atlassian.com'

/**
 * Get OAuth 2.0 authorization URL for Jira Cloud.
 */
export function getJiraAuthUrl(organizationId: string): string {
  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: process.env.JIRA_CLIENT_ID!,
    scope: 'read:jira-work write:jira-work offline_access',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
    state: organizationId,
    response_type: 'code',
    prompt: 'consent',
  })
  return `${JIRA_AUTH_URL}?${params}`
}

/**
 * Exchange OAuth code for access + refresh tokens, then fetch the Jira cloud ID.
 */
export async function exchangeJiraCode(
  code: string,
  organizationId: string
): Promise<void> {
  // Exchange code for tokens
  const tokenRes = await fetch(JIRA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.JIRA_CLIENT_ID,
      client_secret: process.env.JIRA_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
    }),
  })

  const tokens: {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  } = await tokenRes.json()

  if (!tokens.access_token) {
    throw new Error(tokens.error ?? 'Jira OAuth failed — no access token returned')
  }

  // Fetch accessible Jira Cloud resources (cloud ID)
  const resourcesRes = await fetch(`${JIRA_API_URL}/oauth/token/accessible-resources`, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: 'application/json',
    },
  })

  const resources: Array<{ id: string; name: string; url: string }> = resourcesRes.ok
    ? await resourcesRes.json()
    : []

  const primarySite = resources[0]

  const encryptedToken = await encrypt(tokens.access_token)
  const encryptedRefresh = tokens.refresh_token ? await encrypt(tokens.refresh_token) : null

  const tokenExpiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  const supabase = createServiceClient()
  await supabase
    .from('integrations')
    .upsert({
      organization_id: organizationId,
      provider: 'jira',
      access_token_encrypted: encryptedToken,
      refresh_token_encrypted: encryptedRefresh,
      token_expiry: tokenExpiry,
      metadata: {
        cloud_id: primarySite?.id,
        site_name: primarySite?.name,
        site_url: primarySite?.url,
        available_sites: resources.map((r) => ({ id: r.id, name: r.name })),
      },
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .match({ organization_id: organizationId, provider: 'jira' })
}

interface JiraIntegrationData {
  access_token_encrypted: string
  refresh_token_encrypted: string | null
  token_expiry: string | null
  metadata: { cloud_id?: string; site_url?: string } | null
}

/**
 * Get a valid Jira access token, refreshing if needed.
 */
async function getJiraToken(organizationId: string): Promise<{
  token: string
  cloudId: string
} | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('integrations')
    .select('access_token_encrypted, refresh_token_encrypted, token_expiry, metadata')
    .eq('organization_id', organizationId)
    .eq('provider', 'jira')
    .eq('is_active', true)
    .single()

  if (!data) return null
  const integration = data as JiraIntegrationData
  const cloudId = integration.metadata?.cloud_id
  if (!cloudId) return null

  // Check if token is expired (with 5-minute buffer)
  const isExpired = integration.token_expiry
    ? new Date(integration.token_expiry).getTime() < Date.now() + 5 * 60 * 1000
    : false

  if (isExpired && integration.refresh_token_encrypted) {
    // Refresh the token
    try {
      const refreshToken = await decrypt(integration.refresh_token_encrypted)
      const refreshRes = await fetch(JIRA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: process.env.JIRA_CLIENT_ID,
          client_secret: process.env.JIRA_CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
      })
      const newTokens: { access_token?: string; expires_in?: number } = await refreshRes.json()
      if (newTokens.access_token) {
        const encryptedNew = await encrypt(newTokens.access_token)
        const newExpiry = newTokens.expires_in
          ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
          : null
        await supabase
          .from('integrations')
          .update({ access_token_encrypted: encryptedNew, token_expiry: newExpiry })
          .eq('organization_id', organizationId)
          .eq('provider', 'jira')
        return { token: newTokens.access_token, cloudId }
      }
    } catch {
      // Fall through to use (possibly expired) token
    }
  }

  try {
    const token = await decrypt(integration.access_token_encrypted)
    return { token, cloudId }
  } catch {
    return null
  }
}

/**
 * Create a Jira issue from a OnRampd task.
 * Requires an integration_mapping with external_project_id = "JIRA_PROJECT_KEY".
 */
export async function createJiraIssue(
  organizationId: string,
  jiraProjectKey: string,
  task: Pick<Task, 'id' | 'title' | 'description' | 'due_date'>
): Promise<{ issueKey: string; issueUrl: string } | null> {
  const auth = await getJiraToken(organizationId)
  if (!auth) return null

  const fields: Record<string, unknown> = {
    project: { key: jiraProjectKey },
    summary: task.title,
    issuetype: { name: 'Task' },
  }

  if (task.description) {
    fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: task.description }],
        },
      ],
    }
  }

  if (task.due_date) {
    fields.duedate = task.due_date.slice(0, 10)
  }

  const res = await fetch(`${JIRA_API_URL}/ex/jira/${auth.cloudId}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Jira issue creation failed: ${err}`)
  }

  const issue: { id: string; key: string; self: string } = await res.json()

  const supabase = createServiceClient()
  const integration = await supabase
    .from('integrations')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('provider', 'jira')
    .single()

  const siteUrl = (integration.data?.metadata as { site_url?: string })?.site_url ?? ''
  const issueUrl = siteUrl ? `${siteUrl}/browse/${issue.key}` : issue.self

  return { issueKey: issue.key, issueUrl }
}
