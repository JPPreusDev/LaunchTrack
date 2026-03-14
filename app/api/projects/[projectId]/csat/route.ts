/**
 * POST /api/projects/[projectId]/csat       — org admin sends a CSAT survey to client
 * GET  /api/projects/[projectId]/csat       — get CSAT responses for project
 * PUT  /api/projects/[projectId]/csat       — client submits score (public, uses survey token via query param)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ projectId: string }> }

// Org admin: send/create a CSAT survey for this project
export async function POST(_req: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'org_admin') {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  // Find the client user for this project
  const { data: access } = await supabase
    .from('client_portal_access')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const { data: survey, error } = await supabase
    .from('csat_surveys')
    .insert({
      organization_id: profile.organization_id,
      project_id: projectId,
      trigger_type: 'manual',
      sent_to_user_id: access?.user_id ?? null,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: survey, error: null }, { status: 201 })
}

// Org admin: read CSAT results
export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('csat_responses')
    .select('id, score, comment, submitted_at')
    .eq('project_id', projectId)
    .order('submitted_at', { ascending: false })

  const responses = data ?? []
  const avg = responses.length > 0
    ? responses.reduce((s, r) => s + r.score, 0) / responses.length
    : null

  return NextResponse.json({ data: { responses, average: avg }, error: null })
}
