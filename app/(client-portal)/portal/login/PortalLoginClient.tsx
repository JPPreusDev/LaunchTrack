'use client'

/**
 * White-labeled client portal login — client component.
 * Receives orgSlug as a prop (resolved by the server page from header or searchParams).
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface OrgBranding {
  name: string
  logo_url: string | null
  brand_color: string
  portal_tagline: string | null
}

interface PortalLoginClientProps {
  orgSlug: string | null
}

export function PortalLoginClient({ orgSlug }: PortalLoginClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [branding, setBranding] = useState<OrgBranding | null>(null)
  const [loadingBranding, setLoadingBranding] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleResendLink() {
    if (!email) {
      toast.error('Enter your email address first')
      return
    }
    setResendLoading(true)
    await fetch('/api/portal/resend-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, orgSlug }),
    })
    setResendSent(true)
    setResendLoading(false)
    toast.success('If your email is registered, a login link has been sent.')
  }

  useEffect(() => {
    async function fetchBranding() {
      if (!orgSlug) { setLoadingBranding(false); return }
      const res = await fetch(`/api/portal/branding?org=${encodeURIComponent(orgSlug)}`)
      if (res.ok) {
        const { data } = await res.json()
        setBranding(data)
      }
      setLoadingBranding(false)
    }
    fetchBranding()
  }, [orgSlug])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Verify the signed-in user is a client_user
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'client_user') {
      // Agency staff — send to their dashboard instead
      router.push('/dashboard')
      return
    }

    router.push('/portal/dashboard')
    router.refresh()
  }

  const accentColor = branding?.brand_color ?? '#B91C1C'

  if (loadingBranding) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Agency branding header */}
        <div className="text-center mb-8">
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt={branding.name}
              className="h-12 mx-auto mb-3 object-contain"
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 text-white font-bold text-lg"
              style={{ backgroundColor: accentColor }}
            >
              {(branding?.name ?? 'P')[0].toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-bold text-slate-900">
            {branding?.name ?? 'Client Portal'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {branding?.portal_tagline ?? 'Sign in to view your project'}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ ['--tw-ring-color' as string]: accentColor }}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2">
              Can&apos;t remember your password? We&apos;ll email you a sign-in link.
            </p>
            {resendSent ? (
              <p className="text-xs text-green-600 font-medium">Login link sent — check your inbox.</p>
            ) : (
              <button
                type="button"
                onClick={handleResendLink}
                disabled={resendLoading}
                className="text-sm font-medium disabled:opacity-50"
                style={{ color: accentColor }}
              >
                {resendLoading ? 'Sending…' : 'Send me a login link'}
              </button>
            )}
          </div>
        </div>

        {/* No Rampify branding here */}
      </div>
    </div>
  )
}
