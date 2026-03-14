'use client'

/**
 * Sends a portal account invitation to a client.
 * Calls POST /api/clients/create-account with the client's database ID.
 */
import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  clientId: string
  label?: string
}

export function SendPortalInviteButton({ clientId, label = 'Send Portal Invite' }: Props) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    setLoading(true)
    try {
      const res = await fetch('/api/clients/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to send invite')
      } else {
        setSent(true)
        toast.success('Portal invite sent')
      }
    } catch {
      toast.error('Failed to send invite')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium px-4 py-2">
        ✓ Invite sent
      </span>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
    >
      <Send className="w-4 h-4" />
      {loading ? 'Sending...' : label}
    </button>
  )
}
