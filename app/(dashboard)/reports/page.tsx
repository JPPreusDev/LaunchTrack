/**
 * Reports page — exportable CSV summaries of projects, tasks, and CSAT.
 * Admin only.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getStatusLabel, isOverdue } from '@/lib/utils'
import { BarChart2, Download } from 'lucide-react'
import { ExportButton } from '@/components/reports/ExportButton'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'org_admin') redirect('/dashboard')

  // Projects + tasks
  const { data: projects } = await supabase
    .from('onboarding_projects')
    .select(`
      id, name, status, start_date, estimated_launch_date,
      client:clients(name, company_name),
      tasks(id, status, due_date, is_client_task)
    `)
    .eq('organization_id', profile.organization_id)
    .order('start_date', { ascending: false })

  // CSAT responses
  const { data: csatData } = await supabase
    .from('csat_responses')
    .select('score, project_id, submitted_at')
    .order('submitted_at', { ascending: false })

  const csatByProject = (csatData ?? []).reduce<Record<string, number[]>>((acc, r) => {
    acc[r.project_id] ??= []
    acc[r.project_id].push(r.score)
    return acc
  }, {})

  const enriched = (projects ?? []).map((p) => {
    const tasks = (p.tasks ?? []) as { id: string; status: string; due_date: string | null; is_client_task: boolean }[]
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const overdue = tasks.filter((t) => t.status !== 'completed' && isOverdue(t.due_date)).length
    const clientTasks = tasks.filter((t) => t.is_client_task).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const scores = csatByProject[p.id] ?? []
    const avgCsat = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null
    return { ...p, total, completed, overdue, clientTasks, pct, avgCsat, csatCount: scores.length }
  })

  const totalProjects = enriched.length
  const activeProjects = enriched.filter((p) => p.status === 'active').length
  const avgCompletion = totalProjects > 0
    ? Math.round(enriched.reduce((s, p) => s + p.pct, 0) / totalProjects)
    : 0
  const allCsatScores = (csatData ?? []).map((r) => r.score)
  const overallCsat = allCsatScores.length > 0
    ? (allCsatScores.reduce((a, b) => a + b, 0) / allCsatScores.length).toFixed(1)
    : null

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Project health, task completion, and CSAT overview</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ExportButton projects={enriched as any} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: totalProjects },
          { label: 'Active Projects', value: activeProjects },
          { label: 'Avg Completion', value: `${avgCompletion}%` },
          { label: 'Overall CSAT', value: overallCsat ? `${overallCsat}/5` : '—' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Project table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-sm text-slate-700">Project Summary</h3>
          <span className="text-xs text-slate-400 ml-auto">{enriched.length} projects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Project</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Progress</th>
                <th className="px-4 py-3 text-right font-medium">Overdue</th>
                <th className="px-4 py-3 text-right font-medium">CSAT</th>
                <th className="px-4 py-3 text-right font-medium">Launch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {enriched.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {(p.client as unknown as { name: string })?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-600">{getStatusLabel(p.status)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-slate-600">{p.pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {p.overdue > 0 ? (
                      <span className="text-xs font-medium text-red-600">{p.overdue}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {p.avgCsat ? (
                      <span className="text-xs font-medium text-amber-600">{p.avgCsat}/5</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-500 text-xs">
                    {p.estimated_launch_date ? formatDate(p.estimated_launch_date) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
