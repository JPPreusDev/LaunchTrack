'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { SubscriptionPlan } from '@/types'

interface CheckoutButtonProps {
  plan: SubscriptionPlan
  organizationId: string
  userEmail: string
}

export function CheckoutButton({ plan, organizationId, userEmail }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, organizationId, userEmail }),
      })

      const data: { url?: string; error?: { message: string } } = await response.json()

      if (data.error || !data.url) {
        toast.error(data.error?.message ?? 'Failed to start checkout')
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
      onClick={handleCheckout}
      disabled={loading}
      className="w-full py-2.5 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Redirecting...' : 'Upgrade Now'}
    </button>
  )
}
