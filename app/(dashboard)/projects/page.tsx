/**
 * Projects list page — all onboarding projects.
 */
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getDaysSince, getStatusColor, getStatusLabel, isOverdue } from '@/lib/utils'
import { FolderKanban, Plus, ChevronRight, MessageSquare } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: projects } = await supabase
    .from('onboarding_projects')
    .select(`
      *,
      client:clients(name, company_name),
      tasks(id, status, due_date)
    `)
    .eq('organization_id', profile.organization_id)
    .order('updated_at', { ascending: false })

  // Check for recent unread client messages (last 24h) per project
  const since24h = new Date()
  since24h.setHours(since24h.getHours() - 24)

  const service = createServiceClient()
  const projectIds = (projects ?? []).map((p) => p.id)

  let recentMessageProjectIds = new Set<string>()
  if (projectIds.length > 0) {
    // Find projects with client messages in last 24h (sent by client_user role)
    const { data: recentMessages } = await service
      .from('project_messages')
      .select('project_id, sender:users!project_messages_user_id_fkey(role)')
      .in('project_id', projectIds)
      .eq('is_internal', false)
      .gte('created_at', since24h.toISOString())

    for (const msg of recentMessages ?? []) {
      const role = (msg.sender as { role?: string } | null)?.role
      if (role === 'client_user') {
        recentMessageProjectIds.add(msg.project_id)
      }
    }
  }

  const enriched = (projects ?? []).map((p) => {
    const tasks = p.tasks as { id: string; status: string; due_date: string | null }[]
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const overdue = tasks.filter((t) => t.status !== 'completed' && isOverdue(t.due_date)).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const hasNewMessage = recentMessageProjectIds.has(p.id)
    return { ...p, total, completed, overdue, pct, hasNewMessage }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {enriched.length} project{enriched.length !== 1 ? 's' : ''} total
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

      {enriched.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-4">
            Create your first onboarding project to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {enriched.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                    {p.overdue > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        {p.overdue} overdue
                      </span>
                    )}
                    {p.hasNewMessage && (
                      <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        <MessageSquare className="w-3 h-3" />
                        New message
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {(p.client as unknown as { name: string })?.name}
                    {(p.client as unknown as { company_name?: string })?.company_name &&
                      ` · ${(p.client as unknown as { company_name: string }).company_name}`}
                  </p>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0 text-sm text-slate-500">
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-red-600 h-1.5 rounded-full"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs">{p.pct}%</span>
                  </div>
                  <span className="text-xs text-slate-400 w-20 text-right">
                    {getDaysSince(p.start_date)}d running
                  </span>
                  {p.estimated_launch_date && (
                    <span className="text-xs text-slate-400 w-28 text-right">
                      {formatDate(p.estimated_launch_date)}
                    </span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
