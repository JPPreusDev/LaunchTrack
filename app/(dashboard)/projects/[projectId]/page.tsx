/**
 * Agency project detail — phases, tasks, assets, approvals, chat, engagement, CSAT.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getStatusColor, getStatusLabel, isOverdue } from '@/lib/utils'
import {
  ChevronLeft, AlertCircle, CheckCircle2, Clock, Upload,
  MessageSquare, Activity, Star, FileText,
} from 'lucide-react'
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge'
import { TaskRow } from '@/components/tasks/TaskRow'
import { AssetRequestCard } from '@/components/projects/AssetRequestCard'
import { ApprovalBanner } from '@/components/projects/ApprovalBanner'
import { ProjectChat } from '@/components/projects/ProjectChat'
import { SendCsatButton } from '@/components/projects/SendCsatButton'
import { differenceInDays, parseISO } from 'date-fns'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  // Fetch project with all data
  const { data: project } = await supabase
    .from('onboarding_projects')
    .select(`
      *,
      client:clients(id, name, company_name, email),
      phases:project_phases(
        id, name, sort_order,
        tasks(
          id, title, description, internal_notes, status,
          is_client_task, requires_approval, is_asset_required, due_date,
          assigned_to, sort_order, parent_task_id,
          assignee:users!tasks_assigned_to_fkey(id, full_name, email),
          service_category:service_categories(id, name),
          dependencies:task_dependencies(
            id, depends_on_task_id,
            dependency:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)
          )
        )
      ),
      asset_requests(*),
      approvals(*)
    `)
    .eq('id', projectId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!project) notFound()

  // Fetch engagement data
  const { data: lastActivity } = await supabase
    .from('portal_activity_log')
    .select('created_at')
    .eq('project_id', projectId)
    .eq('action_type', 'page_view')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch CSAT
  const { data: csatResponses } = await supabase
    .from('csat_responses')
    .select('score')
    .eq('project_id', projectId)

  const avgCsat = csatResponses && csatResponses.length > 0
    ? (csatResponses.reduce((s, r) => s + r.score, 0) / csatResponses.length).toFixed(1)
    : null

  // Fetch intake form responses
  const { data: intakeResponses } = await supabase
    .from('intake_responses')
    .select('id, client_name, submitted_at, answers:intake_response_answers(value, field:intake_form_fields(label))')
    .eq('project_id', projectId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const phases = [...(project.phases ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

  const allTasks = phases.flatMap((p: { tasks?: { id: string; status: string; due_date: string | null; parent_task_id: string | null }[] }) =>
    (p.tasks ?? []).filter((t) => !t.parent_task_id)
  )
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length
  const overdueTasks = allTasks.filter((t) => t.status !== 'completed' && isOverdue(t.due_date)).length
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const pendingApprovals = (project.approvals ?? []).filter((a: { status: string }) => a.status === 'pending')

  const lastVisitDays = lastActivity?.created_at
    ? differenceInDays(new Date(), parseISO(lastActivity.created_at))
    : null

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> All Projects
      </Link>

      {/* Project header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-slate-500 text-sm">
              {(project.client as unknown as { name: string })?.name}
              {(project.client as unknown as { company_name?: string })?.company_name &&
                ` · ${(project.client as unknown as { company_name: string }).company_name}`}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500 space-y-1">
            <p>Started {formatDate(project.start_date)}</p>
            {project.estimated_launch_date && (
              <p className="font-medium text-slate-700">Launch: {formatDate(project.estimated_launch_date)}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Overall Progress</span>
            <span className="font-bold text-slate-900">{pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              {completedTasks}/{totalTasks} tasks
            </span>
            {overdueTasks > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3.5 h-3.5" />
                {overdueTasks} overdue
              </span>
            )}
          </div>
        </div>

        {/* Engagement + CSAT strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            {lastVisitDays === null
              ? 'Client portal not visited yet'
              : lastVisitDays === 0
              ? 'Client visited portal today'
              : `Client last visited ${lastVisitDays}d ago`
            }
          </span>
          {avgCsat && (
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              CSAT avg: <strong className="text-slate-700">{avgCsat}/5</strong>
            </span>
          )}
          {profile.role === 'org_admin' && (
            <SendCsatButton projectId={projectId} />
          )}
        </div>
      </div>

      {/* Pending approvals */}
      {pendingApprovals.length > 0 && (
        <ApprovalBanner count={pendingApprovals.length} projectId={projectId} />
      )}

      {/* Main content + Chat panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: phases + assets + intake */}
        <div className="lg:col-span-2 space-y-4">
          {/* Intake form responses */}
          {intakeResponses && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-sm text-slate-700">Intake Form Response</h3>
                <span className="text-xs text-slate-400 ml-1">
                  {intakeResponses.client_name} · {new Date(intakeResponses.submitted_at).toLocaleDateString()}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {(intakeResponses.answers as unknown as { value: string; field: { label: string } | null }[]).map((a, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-slate-500">{a.field?.label ?? 'Answer'}</p>
                    <p className="text-sm text-slate-800">{a.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phases + tasks */}
          {phases.map((phase: {
            id: string; name: string
            tasks?: {
              id: string; title: string; description: string | null; internal_notes: string | null
              status: string; is_client_task: boolean; requires_approval: boolean
              is_asset_required: boolean; due_date: string | null; assigned_to: string | null
              sort_order: number; parent_task_id: string | null
              assignee?: { id: string; full_name: string | null; email: string } | null
              service_category?: { id: string; name: string } | null
              dependencies?: { id: string; depends_on_task_id: string; dependency: { id: string; title: string; status: string } | null }[]
            }[]
          }) => {
            const topLevelTasks = [...(phase.tasks ?? [])]
              .filter((t) => !t.parent_task_id)
              .sort((a, b) => a.sort_order - b.sort_order)
            const phaseCompleted = topLevelTasks.filter((t) => t.status === 'completed').length

            return (
              <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-semibold text-sm text-slate-700">{phase.name}</h3>
                  <span className="text-xs text-slate-400">{phaseCompleted}/{topLevelTasks.length} complete</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {topLevelTasks.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-slate-400">No tasks in this phase.</p>
                  ) : (
                    topLevelTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={{
                          ...task,
                          dependencies: (task.dependencies ?? [])
                            .map((d) => d.dependency)
                            .filter(Boolean) as { id: string; title: string; status: string }[],
                        }}
                        projectId={projectId}
                        showInternalNotes={profile.role !== 'client_user'}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}

          {/* Asset requests */}
          {(project.asset_requests ?? []).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <Upload className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-sm text-slate-700">Asset Requests</h3>
              </div>
              <div className="p-4 grid gap-3">
                {(project.asset_requests as Parameters<typeof AssetRequestCard>[0]['asset'][]).map((asset) => (
                  <AssetRequestCard key={asset.id} asset={asset} projectId={projectId} isAdmin={profile.role === 'org_admin'} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat panel */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: '600px' }}>
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50 flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-700">Messages</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ProjectChat
              projectId={projectId}
              currentUserId={user.id}
              isAgencyView={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
