'use client'

/**
 * Create new onboarding project page.
 * Selects a client + template and clones tasks.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import type { Client, OnboardingTemplate, TemplatePhase, TemplateTask, PLAN_LIMITS } from '@/types'

interface TemplateWithDetails extends OnboardingTemplate {
  template_phases: (TemplatePhase & { template_tasks: TemplateTask[] })[]
}

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [planLimit, setPlanLimit] = useState<{ canCreate: boolean; current: number; max: number }>({
    canCreate: true, current: 0, max: 5,
  })

  const [form, setForm] = useState({
    name: '',
    clientId: '',
    templateId: '',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return
      setOrganizationId(profile.organization_id)

      // Load clients + templates in parallel
      const [clientsRes, templatesRes, orgRes, countRes] = await Promise.all([
        supabase.from('clients').select('*').eq('organization_id', profile.organization_id).order('name'),
        supabase.from('onboarding_templates')
          .select('*, template_phases(*, template_tasks(*))')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true),
        supabase.from('organizations').select('plan').eq('id', profile.organization_id).single(),
        supabase.from('onboarding_projects')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .neq('status', 'completed'),
      ])

      if (clientsRes.data) setClients(clientsRes.data)
      if (templatesRes.data) setTemplates(templatesRes.data as TemplateWithDetails[])

      const plan = orgRes.data?.plan ?? 'starter'
      const maxMap: Record<string, number> = { starter: 5, growth: 20, scale: 999999 }
      const max = maxMap[plan] ?? 5
      const current = countRes.count ?? 0

      setPlanLimit({ canCreate: current < max, current, max })
    }
    load()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!planLimit.canCreate) {
      toast.error(`You've reached your plan limit (${planLimit.max} active projects). Upgrade to create more.`)
      return
    }

    setLoading(true)

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('onboarding_projects')
        .insert({
          organization_id: organizationId,
          client_id: form.clientId,
          template_id: form.templateId || null,
          name: form.name,
          description: form.description || null,
          status: 'not_started',
          start_date: form.startDate,
        })
        .select('id')
        .single()

      if (projectError || !project) {
        toast.error('Failed to create project: ' + (projectError?.message ?? 'Unknown error'))
        return
      }

      // Clone template if selected
      if (form.templateId) {
        const template = templates.find((t) => t.id === form.templateId)
        if (template) {
          const startDate = new Date(form.startDate)

          for (const phase of template.template_phases.sort((a, b) => a.sort_order - b.sort_order)) {
            const { data: projectPhase } = await supabase
              .from('project_phases')
              .insert({
                project_id: project.id,
                template_phase_id: phase.id,
                name: phase.name,
                description: phase.description,
                sort_order: phase.sort_order,
              })
              .select('id')
              .single()

            if (!projectPhase) continue

            for (const task of phase.template_tasks.sort((a, b) => a.sort_order - b.sort_order)) {
              const dueDate = new Date(startDate)
              dueDate.setDate(dueDate.getDate() + task.default_due_days)

              await supabase.from('tasks').insert({
                project_id: project.id,
                phase_id: projectPhase.id,
                template_task_id: task.id,
                organization_id: organizationId,
                title: task.title,
                description: task.description,
                is_client_task: task.is_client_task,
                requires_approval: task.requires_approval,
                is_asset_required: task.is_asset_required,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'not_started',
                sort_order: task.sort_order,
                service_category_id: task.service_category_id ?? null,
              })
            }
          }

          // Calculate estimated launch date
          const maxDueDays = Math.max(
            ...template.template_phases.flatMap((p) =>
              p.template_tasks.map((t) => t.default_due_days)
            ),
            0
          )
          const launchDate = new Date(startDate)
          launchDate.setDate(launchDate.getDate() + maxDueDays)

          await supabase
            .from('onboarding_projects')
            .update({ estimated_launch_date: launchDate.toISOString().split('T')[0] })
            .eq('id', project.id)
        }
      }

      toast.success('Project created!')
      router.push(`/projects/${project.id}`)
    } catch (err) {
      toast.error('Unexpected error creating project')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />
        All Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Onboarding Project</h1>
        <p className="text-slate-500 text-sm mt-0.5">Select a client and optionally a template to clone.</p>
      </div>

      {!planLimit.canCreate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          You've reached your plan limit ({planLimit.current}/{planLimit.max} active projects).
          <Link href="/billing" className="underline ml-1">Upgrade your plan</Link> to create more.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Project name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
            placeholder="Brightstar Website Launch"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Client *</label>
          <select
            required
            value={form.clientId}
            onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company_name ? ` (${c.company_name})` : ''}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">
              No clients yet.{' '}
              <Link href="/clients/new" className="text-red-700 hover:underline">Add one first</Link>.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Template (optional)</label>
          <select
            value={form.templateId}
            onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
          >
            <option value="">Start blank (no template)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.template_phases.reduce((sum, p) => sum + p.template_tasks.length, 0)} tasks)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Start date *</label>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 resize-none"
            placeholder="Brief project notes..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !planLimit.canCreate}
            className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <Link
            href="/projects"
            className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
