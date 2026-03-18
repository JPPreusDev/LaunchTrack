/**
 * Clients list page.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Users, Plus, ChevronRight, Building2 } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      onboarding_projects(id, status, name)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {clients?.length ?? 0} client{(clients?.length ?? 0) !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        {profile.role === 'org_admin' && (
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Client
          </Link>
        )}
      </div>

      {(!clients || clients.length === 0) ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No clients yet</h3>
          <p className="text-slate-400 text-sm mb-4">Add your first client to start an onboarding project.</p>
          {profile.role === 'org_admin' && (
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-1.5 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {clients.map((client) => {
              const activeProjects = (client.onboarding_projects as { id: string; status: string; name: string }[])
                ?.filter((p) => p.status !== 'completed') ?? []

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{client.name}</p>
                      {client.company_name && (
                        <p className="text-slate-400 text-sm">· {client.company_name}</p>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{client.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-slate-700">
                      {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-400">Added {formatDate(client.created_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
