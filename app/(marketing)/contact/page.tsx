/**
 * Contact page — demo request form.
 */
'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', company: '', team_size: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setDone(true)
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Something went wrong' }))
      setError(msg ?? 'Something went wrong')
    }
    setSubmitting(false)
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Left: context */}
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Get in touch</h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            Whether you want a demo, have a question about pricing, or want to discuss a
            custom implementation — we&apos;re here to help.
          </p>
          <div className="space-y-6">
            {[
              {
                title: 'Book a demo',
                desc: 'See OnRampd in action with a 30-minute walkthrough tailored to your agency.',
              },
              {
                title: 'Sales questions',
                desc: 'Ask about volume discounts, custom contracts, or white-label options.',
              },
              {
                title: 'Technical support',
                desc: 'Need help with a migration, integration, or setup? We\'ll get on a call.',
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              We reply within <strong>1 business day</strong>.
            </p>
          </div>
        </div>

        {/* Right: form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {done ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Message sent!</h2>
              <p className="text-slate-500 text-sm">We&apos;ll be in touch within 1 business day.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Work email <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="jane@agency.com"
                    className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Agency name</label>
                  <input
                    value={form.company}
                    onChange={(e) => update('company', e.target.value)}
                    placeholder="Pixel & Co."
                    className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Team size</label>
                  <select
                    value={form.team_size}
                    onChange={(e) => update('team_size', e.target.value)}
                    className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 bg-white"
                  >
                    <option value="">Select…</option>
                    <option value="1">Just me</option>
                    <option value="2-5">2–5</option>
                    <option value="6-15">6–15</option>
                    <option value="16-50">16–50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  rows={4}
                  placeholder="Tell us about your agency and what you're looking for…"
                  className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3 rounded-lg text-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
