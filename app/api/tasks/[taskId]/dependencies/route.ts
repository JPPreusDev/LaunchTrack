/**
 * GET    /api/tasks/[taskId]/dependencies — list dependencies
 * POST   /api/tasks/[taskId]/dependencies — add dependency
 * DELETE /api/tasks/[taskId]/dependencies — remove dependency
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
    .from('task_dependencies')
    .select('id, depends_on_task_id, dependency:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)')
    .eq('task_id', taskId)

  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { taskId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { depends_on_task_id } = await request.json()
  if (!depends_on_task_id) return NextResponse.json({ data: null, error: 'depends_on_task_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_task_id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ data: null, error: 'Dependency already exists' }, { status: 409 })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data, error: null }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { taskId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { depends_on_task_id } = await request.json()

  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_task_id', depends_on_task_id)

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: { ok: true }, error: null })
}
