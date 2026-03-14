'use client'

import { useState } from 'react'
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { IntegrationProvider } from '@/types'

interface IntegrationCardProps {
  logo: string
  name: string
  description: string
  features: string[]
  authUrl: string
  isConnected: boolean
  connectedAt?: string
  organizationId: string
  provider: IntegrationProvider
}

export function IntegrationCard({
  logo,
  name,
  description,
  features,
  authUrl,
  isConnected,
  connectedAt,
  organizationId,
  provider,
}: IntegrationCardProps) {
  const supabase = createClient()
  const [connected, setConnected] = useState(isConnected)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${name}? This will stop all syncs.`)) return

    setDisconnecting(true)
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: false })
      .eq('organization_id', organizationId)
      .eq('provider', provider)

    if (error) {
      toast.error('Failed to disconnect')
    } else {
      setConnected(false)
      toast.success(`${name} disconnected`)
    }
    setDisconnecting(false)
  }

  return (
    <div className={`bg-white rounded-xl border-2 p-5 transition-colors ${connected ? 'border-green-200' : 'border-slate-200'}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {logo}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-slate-900">{name}</h3>
            {connected && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 mb-3">{description}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {features.map((f) => (
              <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {f}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
                {connectedAt && (
                  <p className="text-xs text-slate-400">
                    Connected {formatRelativeDate(connectedAt)}
                  </p>
                )}
              </>
            ) : (
              <a
                href={authUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Connect {name}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
