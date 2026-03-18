/**
 * Settings → Integrations page.
 * Shows connected status for all providers + connect/disconnect buttons.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getClickUpAuthUrl } from '@/services/integrations/clickup'
import { getSlackAuthUrl } from '@/services/integrations/slack'
import { getMondayAuthUrl } from '@/services/integrations/monday'
import { getTeamworkAuthUrl } from '@/services/integrations/teamwork'
import { getGitHubAuthUrl } from '@/services/integrations/github'
import { getJiraAuthUrl } from '@/services/integrations/jira'
import { IntegrationCard } from '@/components/shared/IntegrationCard'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'org_admin') redirect('/dashboard')

  const orgId = profile.organization_id

  const { data: integrations } = await supabase
    .from('integrations')
    .select('provider, is_active, metadata, updated_at')
    .eq('organization_id', orgId)

  const connectedMap = Object.fromEntries(
    (integrations ?? []).map((i) => [i.provider, i])
  )

  const INTEGRATIONS = [
    {
      provider: 'clickup' as const,
      name: 'ClickUp',
      description: 'Sync onboarding tasks to ClickUp lists. Bi-directional status updates.',
      logo: '📋',
      authUrl: getClickUpAuthUrl(orgId),
      features: ['Task sync', 'Status bi-sync', 'Phase mapping'],
    },
    {
      provider: 'slack' as const,
      name: 'Slack',
      description: 'Send notifications to Slack for overdue tasks, stuck projects, and client uploads.',
      logo: '💬',
      authUrl: getSlackAuthUrl(orgId),
      features: ['Overdue alerts', 'Project stuck alerts', 'Asset submitted'],
    },
    {
      provider: 'monday' as const,
      name: 'Monday.com',
      description: 'Mirror onboarding projects to Monday boards with automatic phase groups.',
      logo: '📅',
      authUrl: getMondayAuthUrl(orgId),
      features: ['Board sync', 'Group per phase', 'Status column sync'],
    },
    {
      provider: 'teamwork' as const,
      name: 'Teamwork',
      description: 'Push tasks to Teamwork projects and sync completion status.',
      logo: '🤝',
      authUrl: getTeamworkAuthUrl(orgId),
      features: ['Task push', 'Status sync', 'Due date sync'],
    },
    {
      provider: 'github' as const,
      name: 'GitHub',
      description: 'Link GitHub repos to projects. Auto-complete tasks when PRs are merged.',
      logo: '🐙',
      authUrl: getGitHubAuthUrl(orgId),
      features: ['Repo linking', 'PR merge → task complete', 'Push activity log'],
    },
    {
      provider: 'jira' as const,
      name: 'Jira',
      description: 'Sync OnRampd tasks to Jira Cloud issues with two-way status updates.',
      logo: '🟦',
      authUrl: getJiraAuthUrl(orgId),
      features: ['Task push to Jira', 'Issue creation', 'Token auto-refresh'],
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Connect OnRampd with your existing tools. OnRampd remains the source of truth.
        </p>
      </div>

      <div className="space-y-4">
        {INTEGRATIONS.map((integration) => {
          const connected = connectedMap[integration.provider]
          return (
            <IntegrationCard
              key={integration.provider}
              logo={integration.logo}
              name={integration.name}
              description={integration.description}
              features={integration.features}
              authUrl={integration.authUrl}
              isConnected={!!connected?.is_active}
              connectedAt={connected?.updated_at}
              organizationId={orgId}
              provider={integration.provider}
            />
          )
        })}
      </div>

      <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-900">
        <strong>Note:</strong> OnRampd is always the source of truth for onboarding timelines,
        client visibility, and asset collection. External tools serve as execution mirrors only.
      </div>
    </div>
  )
}
