'use client'

/**
 * Add new client page.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')

  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
  })

  useEffect(() => {
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
      if (data?.organization_id) setOrganizationId(data.organization_id)
    }
    loadOrg()
  }, [supabase])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .insert({
        organization_id: organizationId,
        name: form.name,
        company_name: form.companyName || null,
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
        notes: form.notes || null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Failed to create client: ' + error.message)
      setLoading(false)
      return
    }

    toast.success('Client added!')
    router.push(`/clients/${data.id}`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" />
        All Clients
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Client</h1>
        <p className="text-slate-500 text-sm mt-0.5">Add a client to create onboarding projects for them.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact name *</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mike Reynolds"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company name</label>
            <input
              name="companyName"
              type="text"
              value={form.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brightstar Retail"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address *</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="client@company.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 555 000 0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
            <input
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://brightstar.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Internal notes (team only)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Key context about this client..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add Client'}
          </button>
          <Link href="/clients" className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
