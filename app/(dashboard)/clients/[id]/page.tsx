/**
 * Client detail page — contact info, projects, portal access status, and activity.
 */
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import {
  ChevronLeft, Building2, Mail, Phone, Globe,
  FileText, Plus, ExternalLink, ShieldCheck, ShieldOff, Clock,
} from 'lucide-react'
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge'
import type { ProjectStatus } from '@/types'
import { SendPortalInviteButton } from '@/components/clients/SendPortalInviteButton'
import { ClientDetailActions } from './ClientDetailActions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role, organization:organizations(plan)')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const orgPlan = (profile.organization as unknown as { plan: string } | null)?.plan ?? 'starter'
  const portalEnabled = orgPlan === 'growth' || orgPlan === 'scale'
  const isAdmin = profile.role === 'org_admin'

  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      onboarding_projects(
        id, name, status, start_date, estimated_launch_date, created_at,
        phases:project_phases(
          tasks(id, status)
        )
      )
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!client) notFound()

  // Check portal access status (no extra migration needed — join via email)
  const service = createServiceClient()

  const { data: portalUser } = await service
    .from('users')
    .select('id, created_at')
    .eq('email', client.email)
    .eq('organization_id', profile.organization_id)
    .eq('role', 'client_user')
    .maybeSingle()

  // Find last portal visit across all client's projects
  let lastPortalVisit: string | null = null
  if (portalUser) {
    const projectIds = (client.onboarding_projects ?? []).map((p: { id: string }) => p.id)
    if (projectIds.length > 0) {
      const { data: lastActivity } = await service
        .from('portal_activity_log')
        .select('created_at')
        .eq('user_id', portalUser.id)
        .eq('action_type', 'page_view')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      lastPortalVisit = lastActivity?.created_at ?? null
    }
  }

  type Project = {
    id: string
    name: string
    status: ProjectStatus
    start_date: string
    estimated_launch_date: string | null
    created_at: string
    phases: { tasks: { id: string; status: string }[] }[]
  }

  const projects = ([...(client.onboarding_projects ?? [])] as Project[])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Portal access status
  type PortalStatus = 'none' | 'invited' | 'active'
  let portalStatus: PortalStatus = 'none'
  if (portalUser && lastPortalVisit) portalStatus = 'active'
  else if (portalUser) portalStatus = 'invited'

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />
        All Clients
      </Link>

      {/* Client header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
              {client.company_name && (
                <p className="text-slate-500 text-sm">{client.company_name}</p>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/projects/new?clientId=${client.id}`}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
              {/* Edit + Delete actions (client component) */}
              <ClientDetailActions client={client} />
            </div>
          )}
        </div>

        {/* Contact details */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 group"
          >
            <Mail className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
            {client.email}
          </a>
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 group"
            >
              <Phone className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
              {client.phone}
            </a>
          )}
          {client.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-blue-600 group"
            >
              <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
              {client.website}
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
            </a>
          )}
          <div className="flex items-center gap-2.5 text-sm text-slate-400">
            <FileText className="w-4 h-4" />
            Added {formatDate(client.created_at)}
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-1">Internal notes</p>
            {client.notes}
          </div>
        )}
      </div>

      {/* Portal Access Section */}
      {isAdmin && portalEnabled && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Portal Access</h2>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {portalStatus === 'active' && (
                <>
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Active</p>
                    <p className="text-xs text-slate-500">
                      Last seen {formatDate(lastPortalVisit!)}
                    </p>
                  </div>
                </>
              )}
              {portalStatus === 'invited' && (
                <>
                  <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Invite sent — awaiting first login</p>
                    <p className="text-xs text-slate-500">
                      Account created {formatDate(portalUser!.created_at)}
                    </p>
                  </div>
                </>
              )}
              {portalStatus === 'none' && (
                <>
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                    <ShieldOff className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">No portal access yet</p>
                    <p className="text-xs text-slate-500">Send an invite to give this client portal access</p>
                  </div>
                </>
              )}
            </div>

            {portalStatus === 'none' && (
              <SendPortalInviteButton clientId={client.id} />
            )}
            {portalStatus === 'invited' && (
              <SendPortalInviteButton clientId={client.id} label="Resend Invite" />
            )}
          </div>
        </div>
      )}

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">
            Projects
            <span className="ml-2 text-sm font-normal text-slate-400">{projects.length}</span>
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm mb-3">No projects yet for this client.</p>
            {isAdmin && (
              <Link
                href={`/projects/new?clientId=${client.id}`}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Project
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const allTasks = project.phases.flatMap((p) => p.tasks)
              const total = allTasks.length
              const completed = allTasks.filter((t) => t.status === 'completed').length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {project.name}
                        </h3>
                        <ProjectStatusBadge status={project.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Started {formatDate(project.start_date)}</span>
                        {project.estimated_launch_date && (
                          <>
                            <span>·</span>
                            <span>Launch {formatDate(project.estimated_launch_date)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-700">{pct}%</p>
                      <p className="text-xs text-slate-400">{completed}/{total} tasks</p>
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
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
