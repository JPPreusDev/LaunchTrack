'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle, Upload, Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatDate, isOverdue, getStatusLabel, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'
import type { TaskStatus } from '@/types'

interface ClientTask {
  id: string
  title: string
  description: string | null
  status: string
  is_client_task: boolean
  requires_approval: boolean
  is_asset_required: boolean
  due_date: string | null
  sort_order: number
}

interface ClientTaskListProps {
  tasks: ClientTask[]
  projectId: string
  organizationId: string
}

export function ClientTaskList({ tasks, projectId, organizationId }: ClientTaskListProps) {
  const supabase = createClient()
  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>(
    Object.fromEntries(tasks.map((t) => [t.id, t.status]))
  )
  const [updating, setUpdating] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})

  const sortedTasks = [...tasks].sort((a, b) => a.sort_order - b.sort_order)

  async function markComplete(taskId: string) {
    if (updating) return
    setUpdating(taskId)

    const current = taskStatuses[taskId]
    const next: TaskStatus = current === 'completed' ? 'not_started' : 'completed'

    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: next === 'completed' }),
      })

      if (!res.ok) {
        toast.error('Failed to update task')
      } else {
        setTaskStatuses((prev) => ({ ...prev, [taskId]: next }))
        if (next === 'completed') toast.success('Task completed!')
      }
    } catch {
      toast.error('Failed to update task')
    }

    setUpdating(null)
  }

  async function handleFileUpload(taskId: string, file: File) {
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`File too large. Max size is ${formatFileSize(maxSize)}`)
      return
    }

    setUploading(taskId)

    const path = `${projectId}/tasks/${taskId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(path, file)

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(path)

    const { error: recordError } = await supabase.from('uploaded_files').insert({
      project_id: projectId,
      task_id: taskId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: path,
      public_url: publicUrl,
      organization_id: organizationId,
    })

    if (recordError) {
      toast.error('File uploaded but could not be recorded')
    } else {
      setUploaded((prev) => ({ ...prev, [taskId]: true }))
      toast.success('Asset uploaded successfully!')
    }

    setUploading(null)
  }

  return (
    <div className="divide-y divide-slate-50">
      {sortedTasks.map((task) => {
        const status = taskStatuses[task.id] as TaskStatus
        const overdue = status !== 'completed' && isOverdue(task.due_date)
        const isUpdating = updating === task.id
        const isUploading = uploading === task.id
        const hasUploaded = uploaded[task.id]

        return (
          <div key={task.id} className={cn('px-5 py-3.5 flex items-start gap-3', overdue && 'bg-red-50/30')}>
            {/* Checkbox */}
            <button
              onClick={() => markComplete(task.id)}
              disabled={isUpdating || !task.is_client_task}
              className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110 disabled:cursor-default"
            >
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : status === 'waiting_on_client' ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : status === 'in_progress' ? (
                <Clock className="w-5 h-5 text-red-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 hover:text-red-500" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium',
                status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
              )}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
              )}
              {task.due_date && (
                <p className={cn(
                  'text-xs mt-1',
                  overdue ? 'text-red-600 font-medium' : 'text-slate-400'
                )}>
                  {overdue ? '⚠ Overdue · ' : ''}Due {formatDate(task.due_date)}
                </p>
              )}

              {/* Inline asset upload */}
              {task.is_asset_required && status !== 'completed' && (
                <div className="mt-2">
                  {hasUploaded ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Asset uploaded
                    </span>
                  ) : (
                    <label className={cn('cursor-pointer', isUploading && 'opacity-50 cursor-not-allowed')}>
                      <input
                        type="file"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(task.id, file)
                        }}
                      />
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors font-medium">
                        <Paperclip className="w-3 h-3" />
                        {isUploading ? 'Uploading...' : 'Upload required asset'}
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Right side: upload icon + status label */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {task.is_asset_required && status === 'completed' && (
                <span title="Asset was required"><Upload className="w-3.5 h-3.5 text-slate-300" /></span>
              )}
              {status !== 'not_started' && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  status === 'completed' && 'bg-green-100 text-green-700',
                  status === 'in_progress' && 'bg-red-100 text-red-800',
                  status === 'waiting_on_client' && 'bg-amber-100 text-amber-700'
                )}>
                  {getStatusLabel(status)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
