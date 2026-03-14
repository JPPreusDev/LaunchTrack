/**
 * POST /api/intake-forms/[formId]/respond
 * Public endpoint — client submits intake form answers.
 * project_id passed in body to link response to project.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ formId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { formId } = await params
  const service = createServiceClient()

  const { project_id, client_name, client_email, answers } = await request.json()

  if (!project_id) return NextResponse.json({ data: null, error: 'project_id required' }, { status: 400 })

  const { data: form } = await service
    .from('intake_forms')
    .select('id, is_active')
    .eq('id', formId)
    .single()

  if (!form || !form.is_active) {
    return NextResponse.json({ data: null, error: 'Form not found' }, { status: 404 })
  }

  const { data: response, error } = await service
    .from('intake_responses')
    .insert({ form_id: formId, project_id, client_name: client_name || null, client_email: client_email || null })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  if (answers && typeof answers === 'object') {
    const answerRows = Object.entries(answers as Record<string, string>).map(([field_id, value]) => ({
      response_id: response.id,
      field_id,
      value: String(value ?? ''),
    }))
    if (answerRows.length > 0) {
      await service.from('intake_response_answers').insert(answerRows)
    }
  }

  return NextResponse.json({ data: { response_id: response.id }, error: null }, { status: 201 })
}
