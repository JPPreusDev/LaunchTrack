/**
 * GET  /api/intake-forms?template_id= — list intake forms for org
 * POST /api/intake-forms               — create intake form
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })

  const templateId = request.nextUrl.searchParams.get('template_id')

  let query = supabase
    .from('intake_forms')
    .select('id, name, description, is_active, template_id, fields:intake_form_fields(id, label, field_type, options, placeholder, is_required, sort_order)')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (templateId) query = query.eq('template_id', templateId)

  const { data } = await query
  return NextResponse.json({ data: data ?? [], error: null })
}

export async function POST(request: NextRequest) {
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

  const { name, description, template_id, fields = [] } = await request.json()
  if (!name?.trim()) return NextResponse.json({ data: null, error: 'Name required' }, { status: 400 })

  const { data: form, error } = await supabase
    .from('intake_forms')
    .insert({ name: name.trim(), description: description || null, template_id: template_id || null, organization_id: profile.organization_id })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

  if (fields.length > 0) {
    await supabase.from('intake_form_fields').insert(
      fields.map((f: { label: string; field_type: string; placeholder?: string; is_required?: boolean; options?: string[]; sort_order?: number }, i: number) => ({
        form_id: form.id,
        label: f.label,
        field_type: f.field_type ?? 'text',
        placeholder: f.placeholder || null,
        is_required: f.is_required ?? false,
        options: f.options ? JSON.stringify(f.options) : null,
        sort_order: f.sort_order ?? i,
      }))
    )
  }

  return NextResponse.json({ data: form, error: null }, { status: 201 })
}
