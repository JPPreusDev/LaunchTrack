/**
 * Templates list page — admin only.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { LayoutTemplate, Plus, ChevronRight } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'org_admin') redirect('/dashboard')

  const { data: templates } = await supabase
    .from('onboarding_templates')
    .select(`
      *,
      template_phases(
        id,
        template_tasks(id)
      )
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Onboarding Templates</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Define reusable onboarding workflows for new clients
          </p>
        </div>
        <Link
          href="/templates/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {(!templates || templates.length === 0) ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No templates yet</h3>
          <p className="text-slate-400 text-sm mb-4">
            Create your first onboarding template to standardize your client process.
          </p>
          <Link
            href="/templates/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => {
            const totalTasks = (t.template_phases ?? []).reduce(
              (sum: number, p: { template_tasks?: { id: string }[] }) =>
                sum + (p.template_tasks?.length ?? 0),
              0
            )
            const phaseCount = (t.template_phases ?? []).length

            return (
              <Link
                key={t.id}
                href={`/templates/${t.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LayoutTemplate className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    {!t.is_active && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{t.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>{phaseCount} phase{phaseCount !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>Created {formatDate(t.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
