/**
 * Client-facing intake form page.
 * Linked from portal invitation. Public (no auth required after org lookup).
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { IntakeFormClient } from './IntakeFormClient'

interface PageProps {
  params: Promise<{ formId: string }>
  searchParams: Promise<{ project?: string }>
}

export default async function IntakeFormPage({ params, searchParams }: PageProps) {
  const { formId } = await params
  const { project: projectId } = await searchParams
  const supabase = await createClient()

  const { data: form } = await supabase
    .from('intake_forms')
    .select(`
      id, name, description,
      fields:intake_form_fields(
        id, label, field_type, options, placeholder, is_required, sort_order
      ),
      organization:organizations(name, logo_url, brand_color)
    `)
    .eq('id', formId)
    .eq('is_active', true)
    .single()

  if (!form) notFound()

  const fields = [...(form.fields as {
    id: string; label: string; field_type: string; options: string[] | null
    placeholder: string | null; is_required: boolean; sort_order: number
  }[])].sort((a, b) => a.sort_order - b.sort_order)

  const org = form.organization as { name: string; logo_url: string | null; brand_color: string } | null
  const orgName = org?.name ?? 'Your Agency'
  const accentColor = org?.brand_color ?? '#3b82f6'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {orgName[0].toUpperCase()}
          </div>
          <span className="font-semibold text-slate-900 text-sm">{orgName}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{form.name}</h1>
          {form.description && (
            <p className="text-slate-500 mt-1">{form.description}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <IntakeFormClient
            formId={formId}
            projectId={projectId ?? null}
            fields={fields}
            accentColor={accentColor}
          />
        </div>
      </div>
    </div>
  )
}
