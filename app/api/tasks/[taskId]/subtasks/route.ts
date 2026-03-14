/**
 * GET  /api/tasks/[taskId]/subtasks — list sub-tasks
 * POST /api/tasks/[taskId]/subtasks — create sub-task
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ taskId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { taskId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, assigned_to, assignee:users!tasks_assigned_to_fkey(full_name, email)')
    .eq('parent_task_id', taskId)
    .order('sort_order')

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { taskId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  // Fetch parent task to inherit project/phase/org context
  const { data: parent } = await supabase
    .from('tasks')
    .select('project_id, phase_id, organization_id')
    .eq('id', taskId)
    .single()

  if (!parent) return NextResponse.json({ data: null, error: 'Parent task not found' }, { status: 404 })

  const { title, description, due_date, assigned_to } = await request.json()
  if (!title?.trim()) return NextResponse.json({ data: null, error: 'Title required' }, { status: 400 })

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: title.trim(),
      description: description || null,
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      parent_task_id: taskId,
      project_id: parent.project_id,
      phase_id: parent.phase_id,
      organization_id: parent.organization_id,
      status: 'not_started',
      is_client_task: false,
      requires_approval: false,
      is_asset_required: false,
      sort_order: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null }, { status: 201 })
}
