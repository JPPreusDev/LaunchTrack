/**
 * POST /api/csat/[surveyId]/respond — submit a CSAT score (public endpoint for clients)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ surveyId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { surveyId } = await params
  const service = createServiceClient()

  const { score, comment } = await request.json()

  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ data: null, error: 'Score must be 1–5' }, { status: 400 })
  }

  const { data: survey } = await service
    .from('csat_surveys')
    .select('id, project_id')
    .eq('id', surveyId)
    .single()

  if (!survey) return NextResponse.json({ data: null, error: 'Survey not found' }, { status: 404 })

  // Prevent duplicate responses
  const { count } = await service
    .from('csat_responses')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', surveyId)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ data: null, error: 'Already responded' }, { status: 409 })
  }

  const { data, error } = await service
    .from('csat_responses')
    .insert({ survey_id: surveyId, project_id: survey.project_id, score, comment: comment || null })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null }, { status: 201 })
}
