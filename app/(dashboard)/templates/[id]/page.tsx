'use client'

/**
 * Template detail page.
 * Tasks tab: view phases/tasks with filter + sort by service category.
 * Settings tab: manage service categories and team member assignments.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ChevronLeft, Plus, Trash2, Bell, BellOff, Tag, Users, X,
} from 'lucide-react'
import type { ServiceCategory, CategoryAssignment } from '@/types'

// ── Colour palette for category badges (cycles by index) ──────────────
const BADGE_COLORS = [
  'bg-red-100 text-red-800',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
]
function categoryColor(idx: number) { return BADGE_COLORS[idx % BADGE_COLORS.length] }

// ── Types ──────────────────────────────────────────────────────────────
interface TemplateTask {
  id: string
  title: string
  description: string | null
  is_client_task: boolean
  requires_approval: boolean
  is_asset_required: boolean
  default_due_days: number
  sort_order: number
  service_category_id: string | null
}

interface TemplatePhase {
  id: string
  name: string
  sort_order: number
  template_tasks: TemplateTask[]
}

interface Template {
  id: string
  name: string
  description: string | null
  is_active: boolean
  organization_id: string
}

interface Member {
  id: string
  email: string
  full_name: string | null
}

interface AssignmentWithUser extends CategoryAssignment {
  user: Member
}

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'tasks' | 'settings'>('tasks')
  const [template, setTemplate] = useState<Template | null>(null)
  const [phases, setPhases] = useState<TemplatePhase[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [assignments, setAssignments] = useState<AssignmentWithUser[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Tasks tab state
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortMode, setSortMode] = useState<'phase' | 'category'>('phase')

  // Settings tab state
  const [newCategoryName, setNewCategoryName] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [selectedCategoryForAssign, setSelectedCategoryForAssign] = useState<string>('')
  const [selectedUserForAssign, setSelectedUserForAssign] = useState<string>('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'org_admin') { router.push('/dashboard'); return }

    const orgId = profile.organization_id

    const [templateRes, categoriesRes, assignmentsRes, membersRes] = await Promise.all([
      supabase
        .from('onboarding_templates')
        .select('*, template_phases(*, template_tasks(*))')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single(),
      supabase.from('service_categories').select('*').eq('organization_id', orgId).order('name'),
      supabase
        .from('category_assignments')
        .select('*, user:users(id, email, full_name)')
        .eq('organization_id', orgId),
      supabase
        .from('memberships')
        .select('user:users(id, email, full_name)')
        .eq('organization_id', orgId)
        .not('accepted_at', 'is', null),
    ])

    if (!templateRes.data) { router.push('/templates'); return }

    const t = templateRes.data
    setTemplate({
      id: t.id, name: t.name, description: t.description,
      is_active: t.is_active, organization_id: t.organization_id,
    })
    setPhases(
      ([...(t.template_phases ?? [])] as TemplatePhase[])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({
          ...p,
          template_tasks: [...(p.template_tasks ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        }))
    )
    setCategories(categoriesRes.data ?? [])
    setAssignments((assignmentsRes.data ?? []) as AssignmentWithUser[])
    setMembers(
      (membersRes.data ?? [])
        .map((m) => m.user as unknown as Member)
        .filter(Boolean)
    )
    setLoading(false)
  }, [id, supabase, router])

  useEffect(() => { load() }, [load])

  // ── Category lookup map ──
  const categoryMap = Object.fromEntries(categories.map((c, i) => [c.id, { ...c, colorIdx: i }]))

  // ── All tasks flat ──
  const allTasks = phases.flatMap((p) =>
    p.template_tasks.map((t) => ({ ...t, phaseName: p.name }))
  )

  // ── Filtered tasks ──
  const filteredTasks = filterCategory === 'all'
    ? allTasks
    : allTasks.filter((t) => t.service_category_id === filterCategory)

  // ── Tasks grouped by phase (for sort=phase view) ──
  const filteredPhases = phases.map((p) => ({
    ...p,
    template_tasks: p.template_tasks.filter(
      (t) => filterCategory === 'all' || t.service_category_id === filterCategory
    ),
  })).filter((p) => p.template_tasks.length > 0)

  // ── Tasks grouped by category (for sort=category view) ──
  const tasksByCategory: { label: string; colorIdx: number; tasks: typeof allTasks }[] = []
  if (sortMode === 'category') {
    const grouped: Record<string, typeof allTasks> = {}
    for (const t of filteredTasks) {
      const key = t.service_category_id ?? '__none__'
      grouped[key] = grouped[key] ?? []
      grouped[key].push(t)
    }
    categories.forEach((cat, i) => {
      if (grouped[cat.id]) {
        tasksByCategory.push({ label: cat.name, colorIdx: i, tasks: grouped[cat.id] })
      }
    })
    if (grouped['__none__']) {
      tasksByCategory.push({ label: 'Uncategorized', colorIdx: -1, tasks: grouped['__none__'] })
    }
  }

  // ── Settings: add category ──
  async function addCategory() {
    const name = newCategoryName.trim()
    if (!name || !template) return
    setSavingCategory(true)
    const { data, error } = await supabase
      .from('service_categories')
      .insert({ organization_id: template.organization_id, name })
      .select()
      .single()
    if (error) {
      toast.error(error.message.includes('unique') ? 'Category already exists' : error.message)
    } else {
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCategoryName('')
      toast.success('Category added')
    }
    setSavingCategory(false)
  }

  // ── Settings: delete category ──
  async function deleteCategory(catId: string) {
    const { error } = await supabase.from('service_categories').delete().eq('id', catId)
    if (error) { toast.error(error.message); return }
    setCategories((prev) => prev.filter((c) => c.id !== catId))
    setAssignments((prev) => prev.filter((a) => a.service_category_id !== catId))
    toast.success('Category deleted')
  }

  // ── Settings: add assignment ──
  async function addAssignment() {
    if (!selectedCategoryForAssign || !selectedUserForAssign || !template) return
    const exists = assignments.find(
      (a) => a.service_category_id === selectedCategoryForAssign && a.user_id === selectedUserForAssign
    )
    if (exists) { toast.error('Already assigned'); return }

    const { data, error } = await supabase
      .from('category_assignments')
      .insert({
        organization_id: template.organization_id,
        service_category_id: selectedCategoryForAssign,
        user_id: selectedUserForAssign,
        notify_on_client_complete: false,
      })
      .select('*, user:users(id, email, full_name)')
      .single()

    if (error) { toast.error(error.message); return }
    setAssignments((prev) => [...prev, data as AssignmentWithUser])
    setSelectedUserForAssign('')
    toast.success('Team member assigned')
  }

  // ── Settings: remove assignment ──
  async function removeAssignment(assignId: string) {
    const { error } = await supabase.from('category_assignments').delete().eq('id', assignId)
    if (error) { toast.error(error.message); return }
    setAssignments((prev) => prev.filter((a) => a.id !== assignId))
  }

  // ── Settings: toggle notify ──
  async function toggleNotify(assignId: string, current: boolean) {
    const { error } = await supabase
      .from('category_assignments')
      .update({ notify_on_client_complete: !current })
      .eq('id', assignId)
    if (error) { toast.error(error.message); return }
    setAssignments((prev) =>
      prev.map((a) => a.id === assignId ? { ...a, notify_on_client_complete: !current } : a)
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading...</div>
  }
  if (!template) return null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/templates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
            <ChevronLeft className="w-4 h-4" /> All Templates
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{template.name}</h1>
          {template.description && (
            <p className="text-slate-500 text-sm mt-0.5">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-shrink-0">
          <span>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{allTasks.length} task{allTasks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['tasks', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter + Sort bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="__none__">Uncategorized</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {(['phase', 'category'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                    sortMode === mode
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  By {mode}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 ml-auto">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* By Phase */}
          {sortMode === 'phase' && (
            <div className="space-y-4">
              {filteredPhases.map((phase) => (
                <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-700">{phase.name}</h3>
                    <span className="text-xs text-slate-400">{phase.template_tasks.length} task{phase.template_tasks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {phase.template_tasks.map((task) => {
                      const cat = task.service_category_id ? categoryMap[task.service_category_id] : null
                      return (
                        <div key={task.id} className="px-5 py-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-800">{task.title}</p>
                              {cat && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${categoryColor(cat.colorIdx)}`}>
                                  {cat.name}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span>Due day {task.default_due_days}</span>
                              {task.is_client_task && <span className="text-red-600">Client task</span>}
                              {task.requires_approval && <span className="text-amber-500">Needs approval</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {filteredPhases.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No tasks match this filter.</p>
              )}
            </div>
          )}

          {/* By Category */}
          {sortMode === 'category' && (
            <div className="space-y-4">
              {tasksByCategory.map(({ label, colorIdx, tasks }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    {colorIdx >= 0 ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${categoryColor(colorIdx)}`}>{label}</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-500">{label}</span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {tasks.map((task) => (
                      <div key={task.id} className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">{task.title}</p>
                          <span className="text-xs text-slate-400">— {task.phaseName}</span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span>Due day {task.default_due_days}</span>
                          {task.is_client_task && <span className="text-red-600">Client task</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {tasksByCategory.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No tasks match this filter.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="space-y-6">

          {/* Service Categories */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Service Categories</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <div key={cat.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${categoryColor(i)}`}>
                    {cat.name}
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-slate-400">No categories yet.</p>
                )}
              </div>

              {/* Add new */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  placeholder="Add new category..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                />
                <button
                  onClick={addCategory}
                  disabled={!newCategoryName.trim() || savingCategory}
                  className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Category Assignments */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Team Assignments</h2>
              <p className="text-xs text-slate-400 ml-1">— Assign team members to categories and set email notifications</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Add assignment form */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategoryForAssign}
                  onChange={(e) => setSelectedCategoryForAssign(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={selectedUserForAssign}
                  onChange={(e) => setSelectedUserForAssign(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                >
                  <option value="">Select team member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
                  ))}
                </select>
                <button
                  onClick={addAssignment}
                  disabled={!selectedCategoryForAssign || !selectedUserForAssign}
                  className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign
                </button>
              </div>

              {/* Assignments grouped by category */}
              {categories.map((cat, catIdx) => {
                const catAssignments = assignments.filter((a) => a.service_category_id === cat.id)
                if (catAssignments.length === 0) return null
                return (
                  <div key={cat.id} className="space-y-2">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${categoryColor(catIdx)}`}>
                      {cat.name}
                    </span>
                    <div className="space-y-1.5">
                      {catAssignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                          <span className="text-slate-700 font-medium">
                            {a.user.full_name ?? a.user.email}
                            <span className="text-slate-400 font-normal ml-1 text-xs">{a.user.email}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleNotify(a.id, a.notify_on_client_complete)}
                              title={a.notify_on_client_complete ? 'Disable email notifications' : 'Enable email notifications when client completes a task'}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                                a.notify_on_client_complete
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {a.notify_on_client_complete ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                              {a.notify_on_client_complete ? 'Notified' : 'Silent'}
                            </button>
                            <button
                              onClick={() => removeAssignment(a.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {assignments.length === 0 && (
                <p className="text-sm text-slate-400">
                  No assignments yet. Assign team members above to track ownership and enable notifications.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
