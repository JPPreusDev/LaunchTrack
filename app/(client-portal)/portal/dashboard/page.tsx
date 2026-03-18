/**
 * Client portal dashboard — lists all projects the logged-in client has access to.
 * White-labeled with agency branding. No OnRampd branding.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react'

export default async function PortalDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, organization:organizations(name, logo_url, brand_color, portal_tagline)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'client_user') redirect('/dashboard')

  // Fetch all projects this client has portal access to
  const { data: accessRows } = await supabase
    .from('client_portal_access')
    .select(`
      project:onboarding_projects(
        id, name, status, estimated_launch_date, start_date,
        organization:organizations(name, logo_url, brand_color),
        phases:project_phases(
          tasks(id, status, is_client_task)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  type Project = {
    id: string
    name: string
    status: string
    estimated_launch_date: string | null
    start_date: string
    organization: { name: string; logo_url: string | null; brand_color: string }
    phases: { tasks: { id: string; status: string; is_client_task: boolean }[] }[]
  }

  const projects = (accessRows ?? [])
    .map((row) => row.project as unknown as Project)
    .filter(Boolean)

  // If only one project, redirect straight to it
  if (projects.length === 1) {
    redirect(`/portal/${projects[0].id}`)
  }

  const org = profile.organization as unknown as {
    name: string; logo_url: string | null; brand_color: string; portal_tagline: string | null
  }
  const accentColor = org?.brand_color ?? '#B91C1C'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt={org.name} className="h-8 object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: accentColor }}
              >
                {(org?.name ?? 'P')[0].toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-slate-900 text-sm">{org?.name}</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {org?.portal_tagline ?? `Track your progress with ${org?.name}`}
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No projects yet. Your team will add you when one is ready.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const clientTasks = project.phases.flatMap((p) =>
                p.tasks.filter((t) => t.is_client_task)
              )
              const total = clientTasks.length
              const completed = clientTasks.filter((t) => t.status === 'completed').length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              const overdue = clientTasks.filter(
                (t) => t.status !== 'completed'
              ).length

              const statusConfig = {
                completed: { icon: CheckCircle2, label: 'Completed', color: 'text-green-600' },
                in_progress: { icon: Clock, label: 'In Progress', color: 'text-red-700' },
                waiting_on_client: { icon: AlertCircle, label: 'Needs Your Input', color: 'text-amber-600' },
                not_started: { icon: Clock, label: 'Not Started', color: 'text-slate-500' },
                on_hold: { icon: AlertCircle, label: 'On Hold', color: 'text-slate-500' },
              }
              const status = statusConfig[project.status as keyof typeof statusConfig] ?? statusConfig.not_started
              const StatusIcon = status.icon

              return (
                <Link
                  key={project.id}
                  href={`/portal/${project.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-all group"
                  style={{ ['--accent' as string]: accentColor }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-semibold text-slate-900 group-hover:text-red-700 transition-colors">
                        {project.name}
                      </h2>
                      {project.estimated_launch_date && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Estimated launch: {formatDate(project.estimated_launch_date)}
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>
                  </div>

                  {total > 0 && (
                    <>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: accentColor }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{completed} of {total} tasks complete</span>
                        {overdue > 0 && project.status !== 'completed' && (
                          <span className="text-amber-600 font-medium">{overdue} action{overdue !== 1 ? 's' : ''} needed</span>
                        )}
                      </div>
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
