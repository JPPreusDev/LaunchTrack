/**
 * Client-facing onboarding portal.
 * Accessible via magic link or client login.
 * Shows timeline, tasks, asset requests, chat — NO internal notes.
 * Logs page_view activity on each visit.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, isOverdue } from '@/lib/utils'
import { ClientTaskList } from '@/components/client-portal/ClientTaskList'
import { ClientAssetList } from '@/components/client-portal/ClientAssetList'
import { ProjectChat } from '@/components/projects/ProjectChat'
import { createServiceClient } from '@/lib/supabase/server'
import { CheckCircle2, Clock, AlertCircle, Upload, MessageSquare } from 'lucide-react'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/portal/${projectId}`)

  // Verify portal access
  const { data: access } = await supabase
    .from('client_portal_access')
    .select('*, project:onboarding_projects(*)')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!access) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg">You don&apos;t have access to this project.</p>
        </div>
      </div>
    )
  }

  // Update last accessed
  await supabase
    .from('client_portal_access')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', access.id)

  // Log portal activity via service client (bypasses RLS)
  const service = createServiceClient()
  const { data: projectOrg } = await service
    .from('onboarding_projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()
  if (projectOrg) {
    service.from('portal_activity_log').insert({
      project_id: projectId,
      organization_id: projectOrg.organization_id,
      user_id: user.id,
      action_type: 'page_view',
    }).then(() => {}).catch(() => {})
  }

  // Fetch project with phases/tasks (no internal_notes via RLS)
  const { data: project } = await supabase
    .from('onboarding_projects')
    .select(`
      *,
      organization:organizations(id, name, logo_url, brand_color),
      phases:project_phases(
        id, name, sort_order,
        tasks(
          id, title, description, status,
          is_client_task, requires_approval, is_asset_required, due_date, sort_order
        )
      ),
      asset_requests(*)
    `)
    .eq('id', projectId)
    .single()

  if (!project) redirect('/login')

  const phases = [...(project.phases ?? [])]
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((p: {
      id: string; name: string; sort_order: number
      tasks?: {
        id: string; title: string; description: string | null; status: string
        is_client_task: boolean; requires_approval: boolean; is_asset_required: boolean
        due_date: string | null; sort_order: number
      }[]
    }) => ({
      ...p,
      tasks: [...(p.tasks ?? [])].filter((t) => t.is_client_task),
    }))

  const allClientTasks = phases.flatMap((p) => p.tasks)
  const total = allClientTasks.length
  const completed = allClientTasks.filter((t) => t.status === 'completed').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const overdueTasks = allClientTasks.filter(
    (t) => t.status !== 'completed' && isOverdue(t.due_date)
  ).length

  const org = project.organization as unknown as { id: string; name: string; logo_url: string | null; brand_color: string } | null
  const orgName = org?.name ?? 'Your Agency'
  const accentColor = org?.brand_color ?? '#B91C1C'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — white-labeled with agency branding */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt={orgName} className="h-8 object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: accentColor }}
              >
                {orgName[0].toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-slate-900 text-sm">{orgName}</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: project + tasks + assets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project hero */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{project.name}</h1>
              <p className="text-slate-500 text-sm mb-5">
                Your dedicated onboarding portal · {orgName}
              </p>

              {/* Progress ring + stats */}
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="40" cy="40" r="32"
                      fill="none" stroke={accentColor} strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-900">{pct}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-slate-600">{completed} of {total} tasks complete</span>
                  </div>
                  {overdueTasks > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 font-medium">{overdueTasks} overdue</span>
                    </div>
                  )}
                  {project.estimated_launch_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-red-600" />
                      <span className="text-slate-600">
                        Estimated launch: <strong>{formatDate(project.estimated_launch_date)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline phases */}
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Your Onboarding Steps</h2>
              {phases.map((phase: {
                id: string
                name: string
                tasks: {
                  id: string; title: string; description: string | null; status: string
                  is_client_task: boolean; requires_approval: boolean; is_asset_required: boolean
                  due_date: string | null; sort_order: number
                }[]
              }, idx: number) => {
                if (phase.tasks.length === 0) return null

                const phaseCompleted = phase.tasks.filter((t) => t.status === 'completed').length
                const phaseTotal = phase.tasks.length
                const isDone = phaseCompleted === phaseTotal

                return (
                  <div key={phase.id} className="relative">
                    {idx < phases.length - 1 && (
                      <div className="absolute left-5 top-full w-0.5 h-4 bg-slate-200 z-10" />
                    )}

                    <div className={`bg-white rounded-xl border overflow-hidden ${isDone ? 'border-green-200' : 'border-slate-200'}`}>
                      <div className={`px-5 py-3 flex items-center justify-between ${isDone ? 'bg-green-50' : 'bg-slate-50'} border-b ${isDone ? 'border-green-100' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <h3 className="font-semibold text-sm text-slate-700">{phase.name}</h3>
                        </div>
                        <span className={`text-xs ${isDone ? 'text-green-600' : 'text-slate-400'}`}>
                          {phaseCompleted}/{phaseTotal}
                        </span>
                      </div>

                      <ClientTaskList
                        tasks={phase.tasks}
                        projectId={projectId}
                        organizationId={(project as { organization_id: string }).organization_id}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Asset Requests */}
            {(project.asset_requests ?? []).length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Required Uploads
                </h2>
                <ClientAssetList
                  assets={project.asset_requests}
                  projectId={projectId}
                  organizationId={(project as { organization_id: string }).organization_id}
                />
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
                isAgencyView={false}
                accentColor={accentColor}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
