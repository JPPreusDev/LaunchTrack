'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'

export function ManageBillingButton({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleManageBilling() {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })

      const data: { url?: string; error?: { message: string } } = await response.json()

      if (data.error || !data.url) {
        toast.error(data.error?.message ?? 'Failed to open billing portal')
        return
      }

      window.location.href = data.url
    } catch {
      toast.error('Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleManageBilling}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      <ExternalLink className="w-4 h-4" />
      {loading ? 'Opening...' : 'Manage Billing'}
    </button>
  )
}
