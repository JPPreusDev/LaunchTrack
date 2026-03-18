/**
 * Portal Analytics Dashboard — admin only.
 * Shows client engagement data from portal_activity_log.
 */
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { TrendingUp, Users, Eye, Activity } from 'lucide-react'
import { PortalAnalyticsCharts } from './PortalAnalyticsCharts'

export default async function AnalyticsPage() {
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
  const service = createServiceClient()

  interface ActivityLog {
    id: string
    action_type: string
    user_id: string
    project_id: string
    created_at: string
  }

  // 30-day window
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString()

  // Total visits (30d) + unique clients
  const { data: logs } = await service
    .from('portal_activity_log')
    .select('id, action_type, user_id, project_id, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })

  const allLogs: ActivityLog[] = (logs as ActivityLog[] | null) ?? []
  const totalVisits = allLogs.filter((l) => l.action_type === 'page_view').length
  const uniqueClients = new Set(allLogs.map((l) => l.user_id)).size

  // Activity type breakdown
  const actionCounts: Record<string, number> = {}
  for (const log of allLogs) {
    actionCounts[log.action_type] = (actionCounts[log.action_type] ?? 0) + 1
  }

  // Daily visits (last 30 days) for line chart
  const dailyMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dailyMap[key] = 0
  }
  for (const log of allLogs) {
    if (log.action_type === 'page_view') {
      const day = log.created_at.slice(0, 10)
      if (day in dailyMap) dailyMap[day]++
    }
  }
  const dailyData = Object.entries(dailyMap).map(([date, visits]) => ({ date, visits }))

  // Top clients by visit count
  const clientVisits: Record<string, number> = {}
  for (const log of allLogs) {
    if (log.action_type === 'page_view') {
      clientVisits[log.user_id] = (clientVisits[log.user_id] ?? 0) + 1
    }
  }

  const topUserIds = Object.entries(clientVisits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id)

  let topClientsData: { name: string; visits: number }[] = []
  if (topUserIds.length > 0) {
    const { data: topUsers } = await service
      .from('users')
      .select('id, full_name')
      .in('id', topUserIds)

    topClientsData = (topUsers ?? []).map((u: { id: string; full_name: string | null }) => ({
      name: u.full_name ?? 'Client',
      visits: clientVisits[u.id] ?? 0,
    })).sort((a: { visits: number }, b: { visits: number }) => b.visits - a.visits)
  }

  // Activity breakdown data for pie/bar chart
  const actionLabels: Record<string, string> = {
    page_view: 'Page Views',
    task_complete: 'Tasks Completed',
    asset_upload: 'Assets Uploaded',
    message_sent: 'Messages Sent',
  }
  const activityBreakdown = Object.entries(actionCounts).map(([action, count]) => ({
    name: actionLabels[action] ?? action,
    value: count,
  }))

  // Recent activity feed (last 20 events)
  const recentLogs = allLogs.slice(0, 20)

  // Fetch user names + project names for recent feed
  const feedUserIds = [...new Set(recentLogs.map((l) => l.user_id).filter(Boolean))]
  const feedProjectIds = [...new Set(recentLogs.map((l) => l.project_id).filter(Boolean))]

  const [{ data: feedUsers }, { data: feedProjects }] = await Promise.all([
    feedUserIds.length > 0
      ? service.from('users').select('id, full_name').in('id', feedUserIds)
      : { data: [] },
    feedProjectIds.length > 0
      ? service.from('onboarding_projects').select('id, name').in('id', feedProjectIds)
      : { data: [] },
  ])

  const userMap = Object.fromEntries(
    ((feedUsers ?? []) as { id: string; full_name: string | null }[]).map((u) => [u.id, u.full_name])
  )
  const projectMap = Object.fromEntries(
    ((feedProjects ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name])
  )

  const recentFeed = recentLogs.map((log) => ({
    id: log.id,
    action: log.action_type,
    userName: userMap[log.user_id] ?? 'Client',
    projectName: projectMap[log.project_id] ?? 'Project',
    createdAt: log.created_at,
  }))

  const actionIcon: Record<string, string> = {
    page_view: '👁',
    task_complete: '✅',
    asset_upload: '📎',
    message_sent: '💬',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portal Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Client engagement over the last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="w-5 h-5 text-red-700" />}
          label="Total Portal Visits"
          value={totalVisits.toLocaleString()}
          bg="bg-red-50"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-violet-600" />}
          label="Active Clients"
          value={uniqueClients.toLocaleString()}
          bg="bg-violet-50"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-green-600" />}
          label="Tasks Completed"
          value={(actionCounts['task_complete'] ?? 0).toLocaleString()}
          bg="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          label="Messages Sent"
          value={(actionCounts['message_sent'] ?? 0).toLocaleString()}
          bg="bg-amber-50"
        />
      </div>

      {/* Charts — client component (Recharts requires browser) */}
      <PortalAnalyticsCharts
        dailyData={dailyData}
        topClientsData={topClientsData}
        activityBreakdown={activityBreakdown}
      />

      {/* Recent activity feed */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
        </div>
        {recentFeed.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No portal activity yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentFeed.map((event) => (
              <div key={event.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg flex-shrink-0">{actionIcon[event.action] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{event.userName}</span>
                    {' — '}
                    <span className="text-slate-500">{actionLabels[event.action] ?? event.action}</span>
                    {' in '}
                    <span className="font-medium">{event.projectName}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{formatDate(event.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
