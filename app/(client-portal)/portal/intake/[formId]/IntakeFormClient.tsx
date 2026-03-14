'use client'

/**
 * Intake form — dynamic fields rendered from schema.
 */
import { useState } from 'react'

interface Field {
  id: string
  label: string
  field_type: string
  options: string[] | null
  placeholder: string | null
  is_required: boolean
  sort_order: number
}

interface IntakeFormClientProps {
  formId: string
  projectId: string | null
  fields: Field[]
  accentColor: string
}

export function IntakeFormClient({ formId, projectId, fields, accentColor }: IntakeFormClientProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const answers = fields.map((f) => ({
      field_id: f.id,
      value: values[f.id] ?? '',
    }))

    const res = await fetch(`/api/intake-forms/${formId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        client_name: name.trim(),
        client_email: email.trim(),
        answers,
      }),
    })

    if (res.ok) {
      setDone(true)
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Submission failed' }))
      setError(msg ?? 'Submission failed')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Form submitted!</h2>
        <p className="text-slate-500">Thank you — your team will review your responses shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-100">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Dynamic fields */}
      {fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {field.label}
            {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {field.field_type === 'textarea' ? (
            <textarea
              required={field.is_required}
              value={values[field.id] ?? ''}
              onChange={(e) => set(field.id, e.target.value)}
              placeholder={field.placeholder ?? ''}
              rows={4}
              className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : field.field_type === 'select' ? (
            <select
              required={field.is_required}
              value={values[field.id] ?? ''}
              onChange={(e) => set(field.id, e.target.value)}
              className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select an option…</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.field_type === 'checkbox' ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values[field.id] === 'true'}
                onChange={(e) => set(field.id, e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">{field.placeholder ?? 'Yes'}</span>
            </label>
          ) : (
            <input
              required={field.is_required}
              type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : field.field_type === 'date' ? 'date' : 'text'}
              value={values[field.id] ?? ''}
              onChange={(e) => set(field.id, e.target.value)}
              placeholder={field.placeholder ?? ''}
              className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg text-white font-medium text-sm disabled:opacity-40 transition-colors mt-2"
        style={{ backgroundColor: accentColor }}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  )
}
