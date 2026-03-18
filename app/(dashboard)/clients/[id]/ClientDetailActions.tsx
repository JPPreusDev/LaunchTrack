'use client'

/**
 * Client detail actions — Edit (inline form) and Delete (with confirmation dialog).
 * Client component so it can manage local UI state.
 */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  website: string | null
  notes: string | null
}

interface Props {
  client: Client
}

export function ClientDetailActions({ client }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone ?? '',
    company_name: client.company_name ?? '',
    website: client.website ?? '',
    notes: client.notes ?? '',
  })

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          company_name: form.company_name.trim() || null,
          website: form.website.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to save changes')
      } else {
        toast.success('Client updated')
        setEditing(false)
        router.refresh()
      }
    } catch {
      toast.error('Failed to save changes')
    }
    setSaving(false)
  }

  async function handleDelete(force = false) {
    setDeleting(true)
    try {
      const url = `/api/clients/${client.id}${force ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      const json = await res.json()

      if (res.status === 409 && json.error?.code === 'HAS_ACTIVE_PROJECTS') {
        const confirmed = window.confirm(
          `${json.error.message}\n\nDelete anyway and remove all their projects?`
        )
        if (confirmed) {
          setDeleting(false)
          return handleDelete(true)
        }
        setDeleting(false)
        return
      }

      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to delete client')
      } else {
        toast.success('Client deleted')
        router.push('/clients')
      }
    } catch {
      toast.error('Failed to delete client')
    }
    setDeleting(false)
  }

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Edit Client</h2>
            <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Edit
      </button>
      <button
        onClick={() => handleDelete(false)}
        disabled={deleting}
        className="inline-flex items-center gap-1.5 border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
    </>
  )
}
