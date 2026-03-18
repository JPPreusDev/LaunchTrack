'use client'

/**
 * Real-time project chat panel.
 * Used in both the agency project view and client portal.
 * Internal messages only visible to agency staff.
 */
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Lock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  user_id: string
  sender: { full_name: string | null; email: string; role: string } | null
}

interface ProjectChatProps {
  projectId: string
  currentUserId: string
  isAgencyView: boolean
  accentColor?: string
}

export function ProjectChat({ projectId, currentUserId, isAgencyView, accentColor = '#B91C1C' }: ProjectChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/messages`)
      .then((r) => r.json())
      .then(({ data }) => setMessages(data ?? []))
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const msg = payload.new as Message
        if (!msg.is_internal || isAgencyView) {
          // Re-fetch to get sender info
          fetch(`/api/projects/${projectId}/messages`)
            .then((r) => r.json())
            .then(({ data }) => setMessages(data ?? []))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, projectId, isAgencyView])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)

    const res = await fetch(`/api/projects/${projectId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim(), is_internal: isAgencyView && isInternal }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setMessages((prev) => [...prev, data])
      setInput('')
    }
    setSending(false)
  }

  const visibleMessages = isAgencyView
    ? messages
    : messages.filter((m) => !m.is_internal)

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {visibleMessages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            No messages yet. Start the conversation.
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMine = msg.user_id === currentUserId
            const senderName = msg.sender?.full_name ?? msg.sender?.email ?? 'Unknown'
            const isClient = msg.sender?.role === 'client_user'

            return (
              <div key={msg.id} className={cn('flex gap-2', isMine && 'flex-row-reverse')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold',
                  isClient ? 'bg-red-600' : 'bg-slate-600'
                )}>
                  {senderName[0]?.toUpperCase()}
                </div>
                <div className={cn('max-w-[75%]', isMine && 'items-end')}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-slate-500">{isMine ? 'You' : senderName}</span>
                    {msg.is_internal && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-amber-50 text-amber-700 px-1.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Internal
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    'rounded-xl px-3 py-2 text-sm',
                    isMine
                      ? 'text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm',
                    msg.is_internal && !isMine && 'bg-amber-50 border border-amber-100',
                  )}
                  style={isMine ? { backgroundColor: accentColor } : undefined}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        {isAgencyView && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setIsInternal(false)}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
                !isInternal ? 'bg-red-50 text-red-800 font-medium' : 'text-slate-400 hover:bg-slate-50'
              )}
            >
              <Globe className="w-3 h-3" /> Client visible
            </button>
            <button
              onClick={() => setIsInternal(true)}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
                isInternal ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-400 hover:bg-slate-50'
              )}
            >
              <Lock className="w-3 h-3" /> Internal only
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message…"
            className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg text-white disabled:opacity-40 transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
