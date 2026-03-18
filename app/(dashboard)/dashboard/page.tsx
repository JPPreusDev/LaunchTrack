/**
 * Main dashboard — shows all active projects with KPIs.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getDaysSince, getDaysUntil, getStatusColor, getStatusLabel } from '@/lib/utils'
import { AlertCircle, Clock, CheckCircle2, TrendingUp, Plus } from 'lucide-react'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/login')

  // Fetch active projects with client info
  const { data: projects } = await supabase
    .from('onboarding_projects')
    .select(`
      *,
      client:clients(name, company_name),
      tasks(id, status, due_date, is_client_task)
    `)
    .eq('organization_id', profile.organization_id)
    .neq('status', 'completed')
    .order('updated_at', { ascending: false })

  const enrichedProjects = (projects ?? []).map((p) => {
    const tasks = (p.tasks ?? []) as { id: string; status: string; due_date: string | null; is_client_task: boolean }[]
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const overdue = tasks.filter(
      (t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()
    ).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const daysSince = getDaysSince(p.start_date)
    const daysStuck = p.status === 'waiting_on_client' && p.waiting_since
      ? getDaysSince(p.waiting_since)
      : null

    return { ...p, total, completed, overdue, pct, daysSince, daysStuck }
  })

  // KPI cards
  const totalActive = enrichedProjects.length
  const waitingOnClient = enrichedProjects.filter((p) => p.status === 'waiting_on_client').length
  const overdueAny = enrichedProjects.filter((p) => (p.overdue ?? 0) > 0).length
  const completedThisMonth = (
    await supabase
      .from('onboarding_projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .eq('status', 'completed')
      .gte('updated_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  ).count ?? 0

  return (
    <div className="space-y-6">
      {/* Onboarding checklist — visible to admins until all tours complete or dismissed */}
      {profile.role === 'org_admin' && <OnboardingChecklist />}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Overview of active onboarding projects
          </p>
        </div>
        {profile.role === 'org_admin' && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Active Projects"
          value={totalActive}
          icon={<TrendingUp className="w-5 h-5 text-red-600" />}
          color="blue"
        />
        <KPICard
          label="Waiting on Client"
          value={waitingOnClient}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
        <KPICard
          label="Projects w/ Overdue Tasks"
          value={overdueAny}
          icon={<AlertCircle className="w-5 h-5 text-red-500" />}
          color="red"
        />
        <KPICard
          label="Completed This Month"
          value={completedThisMonth}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          color="green"
        />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Active Onboarding Projects</h2>
        </div>

        {enrichedProjects.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No active projects yet.</p>
            {profile.role === 'org_admin' && (
              <Link href="/projects/new" className="mt-3 inline-block text-red-700 text-sm hover:underline">
                Create your first project →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Days Running</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Launch Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enrichedProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {(p.client as unknown as { name: string })?.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {(p.client as unknown as { company_name?: string })?.company_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/projects/${p.id}`} className="font-medium text-red-700 hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[80px]">
                          <div
                            className="bg-red-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">{p.pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.daysSince}d
                      {p.daysStuck != null && (
                        <span className="ml-1.5 text-amber-600 font-medium text-xs">
                          ({p.daysStuck}d stuck)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.estimated_launch_date
                        ? formatDate(p.estimated_launch_date)
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {(p.overdue ?? 0) > 0 ? (
                        <span className="text-red-600 font-medium">{p.overdue} tasks</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'amber' | 'red' | 'green'
}) {
  const bg = {
    blue: 'bg-red-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    green: 'bg-green-50',
  }[color]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
