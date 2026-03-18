'use client'

/**
 * Create new onboarding template page — admin only.
 * Allows defining a template with phases and tasks.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Trash2, GripVertical } from 'lucide-react'

interface NewTask {
  title: string
  description: string
  is_client_task: boolean
  requires_approval: boolean
  is_asset_required: boolean
  default_due_days: number
  sort_order: number
  service_category_id: string | null
}

interface NewPhase {
  name: string
  description: string
  sort_order: number
  tasks: NewTask[]
}

const defaultTask = (): NewTask => ({
  title: '',
  description: '',
  is_client_task: false,
  requires_approval: false,
  is_asset_required: false,
  default_due_days: 7,
  sort_order: 0,
  service_category_id: null,
})

const defaultPhase = (sort_order: number): NewPhase => ({
  name: '',
  description: '',
  sort_order,
  tasks: [defaultTask()],
})

export default function NewTemplatePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState<Record<string, string>>({})

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phases, setPhases] = useState<NewPhase[]>([defaultPhase(0)])

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'org_admin') { router.push('/dashboard'); return }

      setOrganizationId(profile.organization_id)
      setUserId(user.id)

      const { data: cats } = await supabase
        .from('service_categories')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name')
      setCategories(cats ?? [])
    }
    checkAuth()
  }, [supabase, router])

  async function addNewCategory(key: string) {
    const catName = (newCategoryInput[key] ?? '').trim()
    if (!catName || !organizationId) return
    const { data, error } = await supabase
      .from('service_categories')
      .insert({ organization_id: organizationId, name: catName })
      .select('id, name')
      .single()
    if (error) {
      toast.error(error.message.includes('unique') ? 'Category already exists' : error.message)
      return
    }
    setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewCategoryInput((prev) => ({ ...prev, [key]: '' }))
    toast.success('Category added')
    return data.id
  }

  // --- Phase helpers ---
  function addPhase() {
    setPhases((prev) => [...prev, defaultPhase(prev.length)])
  }

  function removePhase(phaseIdx: number) {
    setPhases((prev) => prev.filter((_, i) => i !== phaseIdx).map((p, i) => ({ ...p, sort_order: i })))
  }

  function updatePhase(phaseIdx: number, field: keyof Pick<NewPhase, 'name' | 'description'>, value: string) {
    setPhases((prev) => prev.map((p, i) => i === phaseIdx ? { ...p, [field]: value } : p))
  }

  // --- Task helpers ---
  function addTask(phaseIdx: number) {
    setPhases((prev) => prev.map((p, i) => {
      if (i !== phaseIdx) return p
      return { ...p, tasks: [...p.tasks, { ...defaultTask(), sort_order: p.tasks.length }] }
    }))
  }

  function removeTask(phaseIdx: number, taskIdx: number) {
    setPhases((prev) => prev.map((p, i) => {
      if (i !== phaseIdx) return p
      return {
        ...p,
        tasks: p.tasks.filter((_, ti) => ti !== taskIdx).map((t, ti) => ({ ...t, sort_order: ti })),
      }
    }))
  }

  function updateTask<K extends keyof NewTask>(phaseIdx: number, taskIdx: number, field: K, value: NewTask[K]) {
    setPhases((prev) => prev.map((p, i) => {
      if (i !== phaseIdx) return p
      return {
        ...p,
        tasks: p.tasks.map((t, ti) => ti === taskIdx ? { ...t, [field]: value } : t),
      }
    }))
  }

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (phases.some((p) => !p.name.trim())) {
      toast.error('All phases must have a name.')
      return
    }
    if (phases.some((p) => p.tasks.some((t) => !t.title.trim()))) {
      toast.error('All tasks must have a title.')
      return
    }

    setLoading(true)
    try {
      // 1. Create template
      const { data: template, error: templateError } = await supabase
        .from('onboarding_templates')
        .insert({
          organization_id: organizationId,
          name: name.trim(),
          description: description.trim() || null,
          created_by: userId,
          is_active: true,
        })
        .select('id')
        .single()

      if (templateError || !template) {
        toast.error('Failed to create template: ' + (templateError?.message ?? 'Unknown error'))
        return
      }

      // 2. Create phases + tasks sequentially to preserve order
      for (const phase of phases) {
        const { data: createdPhase, error: phaseError } = await supabase
          .from('template_phases')
          .insert({
            template_id: template.id,
            name: phase.name.trim(),
            description: phase.description.trim() || null,
            sort_order: phase.sort_order,
          })
          .select('id')
          .single()

        if (phaseError || !createdPhase) {
          toast.error('Failed to create phase: ' + (phaseError?.message ?? 'Unknown error'))
          return
        }

        for (const task of phase.tasks) {
          const { error: taskError } = await supabase
            .from('template_tasks')
            .insert({
              template_id: template.id,
              phase_id: createdPhase.id,
              title: task.title.trim(),
              description: task.description.trim() || null,
              is_client_task: task.is_client_task,
              requires_approval: task.requires_approval,
              is_asset_required: task.is_asset_required,
              default_due_days: task.default_due_days,
              sort_order: task.sort_order,
              service_category_id: task.service_category_id || null,
            })

          if (taskError) {
            toast.error('Failed to create task: ' + taskError.message)
            return
          }
        }
      }

      toast.success('Template created!')
      router.push('/templates')
    } catch (err) {
      toast.error('Unexpected error creating template')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />
        All Templates
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Onboarding Template</h1>
        <p className="text-slate-500 text-sm mt-0.5">Define a reusable workflow with phases and tasks.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Template details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Template Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Template name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
              placeholder="Standard Website Launch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 resize-none"
              placeholder="Describe when to use this template..."
            />
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          {phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              {/* Phase header */}
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-slate-300 mt-2.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                      Phase {phaseIdx + 1}
                    </span>
                    {phases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhase(phaseIdx)}
                        className="ml-auto text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phase name *</label>
                      <input
                        type="text"
                        required
                        value={phase.name}
                        onChange={(e) => updatePhase(phaseIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                        placeholder="Discovery & Setup"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <input
                        type="text"
                        value={phase.description}
                        onChange={(e) => updatePhase(phaseIdx, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                        placeholder="Optional phase description"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="ml-7 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tasks</p>
                {phase.tasks.map((task, taskIdx) => (
                  <div key={taskIdx} className="border border-slate-100 rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Task {taskIdx + 1}</span>
                      {phase.tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTask(phaseIdx, taskIdx)}
                          className="ml-auto text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                        <input
                          type="text"
                          required
                          value={task.title}
                          onChange={(e) => updateTask(phaseIdx, taskIdx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
                          placeholder="Task title"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) => updateTask(phaseIdx, taskIdx, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
                          placeholder="Optional instructions for this task"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Default due (days from start)</label>
                        <input
                          type="number"
                          min={1}
                          value={task.default_due_days}
                          onChange={(e) => updateTask(phaseIdx, taskIdx, 'default_due_days', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Service category</label>
                        {task.service_category_id === '__new__' ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newCategoryInput[`${phaseIdx}-${taskIdx}`] ?? ''}
                              onChange={(e) => setNewCategoryInput((p) => ({ ...p, [`${phaseIdx}-${taskIdx}`]: e.target.value }))}
                              placeholder="New category name"
                              className="flex-1 px-2 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const newId = await addNewCategory(`${phaseIdx}-${taskIdx}`)
                                  if (newId) updateTask(phaseIdx, taskIdx, 'service_category_id', newId)
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const newId = await addNewCategory(`${phaseIdx}-${taskIdx}`)
                                if (newId) updateTask(phaseIdx, taskIdx, 'service_category_id', newId)
                              }}
                              className="px-2 py-1.5 bg-red-700 text-white rounded-lg text-xs"
                            >Save</button>
                            <button
                              type="button"
                              onClick={() => updateTask(phaseIdx, taskIdx, 'service_category_id', null)}
                              className="px-2 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs"
                            >Cancel</button>
                          </div>
                        ) : (
                          <select
                            value={task.service_category_id ?? ''}
                            onChange={(e) => updateTask(phaseIdx, taskIdx, 'service_category_id', e.target.value === '' ? null : e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
                          >
                            <option value="">No category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            <option value="__new__">+ Add new category...</option>
                          </select>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={task.is_client_task}
                            onChange={(e) => updateTask(phaseIdx, taskIdx, 'is_client_task', e.target.checked)}
                            className="rounded border-slate-300 text-red-700"
                          />
                          Client task
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={task.requires_approval}
                            onChange={(e) => updateTask(phaseIdx, taskIdx, 'requires_approval', e.target.checked)}
                            className="rounded border-slate-300 text-red-700"
                          />
                          Requires approval
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={task.is_asset_required}
                            onChange={(e) => updateTask(phaseIdx, taskIdx, 'is_asset_required', e.target.checked)}
                            className="rounded border-slate-300 text-red-700"
                          />
                          Asset required
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addTask(phaseIdx)}
                  className="flex items-center gap-1.5 text-xs text-red-700 hover:text-red-800 font-medium mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add task
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPhase}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-red-400 text-slate-400 hover:text-red-700 rounded-xl py-3.5 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add phase
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Template'}
          </button>
          <Link href="/templates" className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
