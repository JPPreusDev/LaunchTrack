/**
 * POST /api/projects/[projectId]/activity — log a portal activity event
 * GET  /api/projects/[projectId]/activity — get engagement summary for org staff
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ projectId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { action_type = 'page_view' } = await request.json().catch(() => ({}))

  const service = createServiceClient()
  const { data: project } = await service
    .from('onboarding_projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()

  if (!project) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

  await service
    .from('portal_activity_log')
    .insert({ project_id: projectId, organization_id: project.organization_id, user_id: user.id, action_type })

  return NextResponse.json({ data: { ok: true }, error: null })
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'client_user') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  // Last visit and total visits from client users
  const { data: lastVisit } = await supabase
    .from('portal_activity_log')
    .select('created_at, user_id')
    .eq('project_id', projectId)
    .eq('action_type', 'page_view')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { count: totalVisits } = await supabase
    .from('portal_activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  return NextResponse.json({
    data: {
      last_visit: lastVisit?.created_at ?? null,
      total_visits: totalVisits ?? 0,
    },
    error: null,
  })
}
