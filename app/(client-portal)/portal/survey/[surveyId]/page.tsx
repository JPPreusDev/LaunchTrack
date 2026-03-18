/**
 * Client-facing CSAT survey page.
 * Public — no auth required (survey is linked to a specific user via survey_id).
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CsatForm } from './CsatForm'

interface PageProps {
  params: Promise<{ surveyId: string }>
}

export default async function CsatSurveyPage({ params }: PageProps) {
  const { surveyId } = await params
  const supabase = await createClient()

  const { data: survey } = await supabase
    .from('csat_surveys')
    .select(`
      id, project_id, sent_at,
      project:onboarding_projects(
        name,
        organization:organizations(name, logo_url, brand_color)
      )
    `)
    .eq('id', surveyId)
    .single()

  if (!survey) notFound()

  // Check if already responded
  const { data: existing } = await supabase
    .from('csat_responses')
    .select('id')
    .eq('survey_id', surveyId)
    .maybeSingle()

  const project = survey.project as unknown as {
    name: string
    organization: { name: string; logo_url: string | null; brand_color: string } | null
  } | null

  const org = project?.organization
  const orgName = org?.name ?? 'Your Agency'
  const accentColor = org?.brand_color ?? '#B91C1C'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4"
            style={{ backgroundColor: accentColor }}
          >
            {orgName[0].toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">{orgName}</h1>
          <p className="text-slate-500 text-sm">{project?.name}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {existing ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Already submitted</h2>
              <p className="text-slate-500 text-sm">Thank you — your feedback has been recorded.</p>
            </div>
          ) : (
            <CsatForm
              surveyId={surveyId}
              projectId={survey.project_id}
              accentColor={accentColor}
            />
          )}
        </div>
      </div>
    </div>
  )
}
