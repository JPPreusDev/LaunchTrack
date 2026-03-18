'use client'

/**
 * Individual task row in agency project view.
 * Supports: status cycling, sub-tasks, dependency locking, expand/collapse.
 */
import { useState } from 'react'
import {
  CheckCircle2, Circle, Clock, AlertCircle,
  ChevronDown, ChevronUp, UserCheck, Lock, Tag,
  Paperclip, Link2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate, isOverdue, getStatusColor, getStatusLabel } from '@/lib/utils'
import { toast } from 'sonner'
import { SubTaskList } from './SubTaskList'
import type { TaskStatus } from '@/types'

interface Dependency {
  id: string
  title: string
  status: string
}

interface TaskRowProps {
  task: {
    id: string
    title: string
    description: string | null
    internal_notes: string | null
    status: string
    is_client_task: boolean
    requires_approval: boolean
    is_asset_required: boolean
    due_date: string | null
    assigned_to: string | null
    sort_order: number
    assignee?: { id: string; full_name: string | null; email: string } | null
    service_category?: { id: string; name: string } | null
    dependencies?: Dependency[]
    subtask_count?: number
  }
  projectId: string
  showInternalNotes: boolean
}

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  completed: CheckCircle2,
  in_progress: Clock,
  waiting_on_client: AlertCircle,
  not_started: Circle,
}

/** Renders comment text with @mention highlighting */
function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w[\w.]*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="bg-red-100 text-red-800 rounded px-0.5 font-medium">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

export function TaskRow({ task, projectId, showInternalNotes }: TaskRowProps) {
  const supabase = createClient()
  const [status, setStatus] = useState(task.status as TaskStatus)
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const StatusIcon = STATUS_ICON[status] ?? Circle
  const overdue = status !== 'completed' && isOverdue(task.due_date)

  const blockedDeps = (task.dependencies ?? []).filter((d) => d.status !== 'completed')
  const isBlocked = blockedDeps.length > 0 && status === 'not_started'

  async function cycleStatus() {
    if (isBlocked) {
      toast.error(`Blocked by: ${blockedDeps.map((d) => d.title).join(', ')}`)
      return
    }
    const cycle: TaskStatus[] = ['not_started', 'in_progress', 'waiting_on_client', 'completed']
    const next = cycle[(cycle.indexOf(status) + 1) % cycle.length]

    setUpdating(true)
    const { error } = await supabase
      .from('tasks')
      .update({
        status: next,
        completed_at: next === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (error) {
      toast.error('Failed to update task status')
    } else {
      setStatus(next)
      toast.success(`Task marked as ${getStatusLabel(next)}`)
    }
    setUpdating(false)
  }

  const hasExpandContent = task.description || (task.internal_notes && showInternalNotes) || true // always show sub-tasks

  return (
    <div className={cn('px-5 py-3.5', overdue && 'bg-red-50/40', isBlocked && 'opacity-75')}>
      <div className="flex items-center gap-3">
        {/* Status toggle */}
        <button
          onClick={cycleStatus}
          disabled={updating}
          className="flex-shrink-0 transition-transform hover:scale-110"
          title={isBlocked ? `Blocked by unfinished dependencies` : `Status: ${getStatusLabel(status)}. Click to change.`}
        >
          {isBlocked ? (
            <Lock className="w-5 h-5 text-slate-400" />
          ) : (
            <StatusIcon
              className={cn(
                'w-5 h-5',
                status === 'completed' && 'text-green-500',
                status === 'in_progress' && 'text-red-600',
                status === 'waiting_on_client' && 'text-amber-500',
                status === 'not_started' && 'text-slate-300'
              )}
            />
          )}
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              'text-sm font-medium',
              status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
            )}>
              {task.title}
            </p>
            {isBlocked && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                <Link2 className="w-3 h-3" />
                Blocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.is_client_task ? (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">
                <UserCheck className="w-3 h-3" />
                Client
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                <Lock className="w-3 h-3" />
                Internal
              </span>
            )}
            {task.service_category && (
              <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                <Tag className="w-3 h-3" />
                {task.service_category.name}
              </span>
            )}
            {task.requires_approval && (
              <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                Approval required
              </span>
            )}
            {task.is_asset_required && (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                <Paperclip className="w-3 h-3" />
                Asset needed
              </span>
            )}
            {task.assignee && (
              <span className="text-xs text-slate-400">
                → {task.assignee.full_name ?? task.assignee.email}
              </span>
            )}
            {task.due_date && (
              <span className={cn('text-xs', overdue ? 'text-red-600 font-medium' : 'text-slate-400')}>
                {overdue ? '⚠ Overdue · ' : ''}Due {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>

        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', getStatusColor(status as TaskStatus))}>
          {getStatusLabel(status as TaskStatus)}
        </span>

        {hasExpandContent && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 ml-8 space-y-3">
          {task.description && (
            <p className="text-sm text-slate-600">{task.description}</p>
          )}
          {task.internal_notes && showInternalNotes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Internal Notes</p>
              <p className="text-sm text-amber-800">
                <MentionText text={task.internal_notes} />
              </p>
            </div>
          )}
          {/* Dependency list */}
          {(task.dependencies ?? []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Depends on</p>
              <div className="space-y-1">
                {task.dependencies!.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                    {dep.status === 'completed'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      : <Circle className="w-3.5 h-3.5 text-slate-300" />
                    }
                    <span className={dep.status === 'completed' ? 'line-through text-slate-400' : ''}>
                      {dep.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Sub-tasks */}
          <SubTaskList parentTaskId={task.id} />
        </div>
      )}
    </div>
  )
}
