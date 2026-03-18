'use client'

/**
 * Sub-task list shown in the expanded TaskRow.
 * Supports creating new sub-tasks and toggling their status.
 */
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SubTask {
  id: string
  title: string
  status: string
}

interface SubTaskListProps {
  parentTaskId: string
}

export function SubTaskList({ parentTaskId }: SubTaskListProps) {
  const supabase = createClient()
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/tasks/${parentTaskId}/subtasks`)
      .then((r) => r.json())
      .then(({ data }) => { setSubTasks(data ?? []); setLoading(false) })
  }, [parentTaskId])

  async function addSubTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)

    const res = await fetch(`/api/tasks/${parentTaskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setSubTasks((prev) => [...prev, data])
      setNewTitle('')
      setAdding(false)
    } else {
      toast.error('Failed to add sub-task')
    }
    setSaving(false)
  }

  async function toggleStatus(st: SubTask) {
    const next = st.status === 'completed' ? 'not_started' : 'completed'
    await supabase
      .from('tasks')
      .update({ status: next, completed_at: next === 'completed' ? new Date().toISOString() : null })
      .eq('id', st.id)

    setSubTasks((prev) => prev.map((t) => t.id === st.id ? { ...t, status: next } : t))
  }

  if (loading) return null

  const doneCount = subTasks.filter((t) => t.status === 'completed').length

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500">
          Sub-tasks {subTasks.length > 0 && `${doneCount}/${subTasks.length}`}
        </span>
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-red-700 hover:underline flex items-center gap-0.5"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <div className="space-y-1">
        {subTasks.map((st) => (
          <div key={st.id} className="flex items-center gap-2 py-1">
            <button onClick={() => toggleStatus(st)} className="flex-shrink-0">
              {st.status === 'completed'
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <Circle className="w-4 h-4 text-slate-300" />
              }
            </button>
            <span className={cn(
              'text-sm flex-1',
              st.status === 'completed' && 'line-through text-slate-400'
            )}>
              {st.title}
            </span>
          </div>
        ))}
      </div>

      {adding && (
        <form onSubmit={addSubTask} className="flex items-center gap-2 mt-1.5">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Sub-task title"
            className="flex-1 text-sm px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-700"
          />
          <button
            type="submit"
            disabled={saving || !newTitle.trim()}
            className="text-xs bg-red-700 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
          >
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </form>
      )}
    </div>
  )
}
