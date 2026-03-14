'use client'

/**
 * CSAT survey form — 1-5 star rating + optional comment.
 */
import { useState } from 'react'
import { Star } from 'lucide-react'

interface CsatFormProps {
  surveyId: string
  projectId: string
  accentColor: string
}

export function CsatForm({ surveyId, projectId, accentColor }: CsatFormProps) {
  const [score, setScore] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const LABELS = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent']

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!score) return
    setSubmitting(true)

    await fetch(`/api/csat/${surveyId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, comment: comment.trim() || null, project_id: projectId }),
    })

    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Thank you!</h2>
        <p className="text-slate-500 text-sm">Your feedback helps us improve our service.</p>
      </div>
    )
  }

  const display = hovered ?? score

  return (
    <form onSubmit={submit}>
      <h2 className="text-lg font-semibold text-slate-900 mb-1 text-center">
        How was your experience?
      </h2>
      <p className="text-slate-500 text-sm text-center mb-6">
        Rate your overall onboarding experience.
      </p>

      {/* Star rating */}
      <div className="flex justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className="w-10 h-10"
              style={{
                fill: display && n <= display ? accentColor : 'transparent',
                color: display && n <= display ? accentColor : '#cbd5e1',
              }}
            />
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500 h-5 mb-6">
        {display ? LABELS[display] : ''}
      </p>

      {/* Optional comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Any additional feedback? <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Tell us more about your experience…"
          className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!score || submitting}
        className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-40 transition-colors"
        style={{ backgroundColor: accentColor }}
      >
        {submitting ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </form>
  )
}
