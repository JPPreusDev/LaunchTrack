'use client'

/**
 * Button to send a CSAT survey to the project client.
 * Only shown to org_admin users.
 */
import { useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface SendCsatButtonProps {
  projectId: string
}

export function SendCsatButton({ projectId }: SendCsatButtonProps) {
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    const res = await fetch(`/api/projects/${projectId}/csat`, { method: 'POST' })
    if (res.ok) {
      toast.success('CSAT survey sent to client')
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Failed to send survey' }))
      toast.error(error ?? 'Failed to send survey')
    }
    setSending(false)
  }

  return (
    <button
      onClick={send}
      disabled={sending}
      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 disabled:opacity-50 transition-colors"
    >
      <Star className="w-3.5 h-3.5" />
      {sending ? 'Sending…' : 'Send CSAT'}
    </button>
  )
}
