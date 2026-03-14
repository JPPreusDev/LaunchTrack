'use client'

/**
 * Portal settings — brand color, tagline, subdomain URL, custom domain, and client accounts.
 * Growth/Scale plans only.
 */
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ChevronLeft, Copy, Check, Globe, Palette, Users,
  ExternalLink, ShieldCheck, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#64748b',
]

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'

interface OrgData {
  id: string
  name: string
  slug: string
  plan: string
  brand_color: string
  portal_tagline: string | null
  custom_domain: string | null
  custom_domain_verified: boolean
  custom_domain_verify_token: string | null
}

interface ClientUser {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export default function PortalSettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [org, setOrg] = useState<OrgData | null>(null)
  const [clients, setClients] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedSubdomain, setCopiedSubdomain] = useState(false)

  // Branding state
  const [brandColor, setBrandColor] = useState('#3b82f6')
  const [tagline, setTagline] = useState('')

  // Custom domain state
  const [customDomain, setCustomDomain] = useState('')
  const [savedCustomDomain, setSavedCustomDomain] = useState<string | null>(null)
  const [customDomainVerified, setCustomDomainVerified] = useState(false)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const [savingDomain, setSavingDomain] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select(
          'role, organization_id, organization:organizations(id, name, slug, plan, brand_color, portal_tagline, custom_domain, custom_domain_verified, custom_domain_verify_token)'
        )
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'org_admin') {
        router.push('/dashboard')
        return
      }

      const orgData = profile.organization as OrgData
      setOrg(orgData)
      setBrandColor(orgData.brand_color ?? '#3b82f6')
      setTagline(orgData.portal_tagline ?? '')
      setSavedCustomDomain(orgData.custom_domain)
      setCustomDomain(orgData.custom_domain ?? '')
      setCustomDomainVerified(orgData.custom_domain_verified)
      setVerifyToken(orgData.custom_domain_verify_token)

      // Fetch client users in the org's projects
      const { data: clientRows } = await supabase
        .from('users')
        .select('id, email, full_name, created_at')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'client_user')
        .order('created_at', { ascending: false })

      setClients(clientRows ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings/portal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_color: brandColor, portal_tagline: tagline }),
    })
    if (res.ok) {
      toast.success('Portal settings saved')
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to save')
    }
    setSaving(false)
  }

  async function handleSaveDomain() {
    setSavingDomain(true)
    const trimmedDomain = customDomain.trim() || null
    const res = await fetch('/api/settings/portal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_domain: trimmedDomain }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setSavedCustomDomain(trimmedDomain)
      setCustomDomainVerified(false)
      setVerifyToken(data?.verify_token ?? null)
      toast.success(trimmedDomain ? 'Custom domain saved' : 'Custom domain cleared')
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to save')
    }
    setSavingDomain(false)
  }

  async function handleVerifyDomain() {
    setVerifying(true)
    const res = await fetch('/api/settings/portal/verify-domain', { method: 'POST' })
    const { data, error } = await res.json()
    if (data?.verified) {
      setCustomDomainVerified(true)
      toast.success('Domain verified!')
    } else {
      toast.error(error ?? 'Verification failed')
    }
    setVerifying(false)
  }

  function copyPortalUrl() {
    if (!org) return
    const url = `${window.location.origin}/portal/login?org=${org.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copySubdomainUrl() {
    if (!org) return
    const protocol = window.location.protocol
    const url = `${protocol}//${org.slug}.${APP_DOMAIN}`
    navigator.clipboard.writeText(url)
    setCopiedSubdomain(true)
    setTimeout(() => setCopiedSubdomain(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!org || (org.plan !== 'growth' && org.plan !== 'scale')) {
    return (
      <div className="max-w-2xl space-y-6">
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Settings
        </Link>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Globe className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Client Portal</h2>
          <p className="text-slate-500 text-sm mb-4">
            The white-labeled client portal is available on Growth and Scale plans.
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    )
  }

  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/login?org=${org.slug}`
  const subdomainUrl = `${org.slug}.${APP_DOMAIN}`

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Client Portal</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          White-labeled login portal for your clients — no LaunchTrack branding.
        </p>
      </div>

      {/* Standard Portal URL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Portal Login URL</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Share this link with your clients so they can log in to their portal.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-mono truncate">
            {portalUrl}
          </div>
          <button
            onClick={copyPortalUrl}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Branded Subdomain */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Branded Subdomain</h2>
          <span className="ml-auto text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">
            Active
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Your clients can also log in at this URL — no setup required.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-mono truncate">
            {subdomainUrl}
          </div>
          <button
            onClick={copySubdomainUrl}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {copiedSubdomain ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copiedSubdomain ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Custom Domain</h2>
          {savedCustomDomain && (
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium border ${
                customDomainVerified
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              {customDomainVerified ? 'Verified' : 'Pending verification'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Point your own domain to your client portal for a fully branded experience.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="portal.yourdomain.com"
            className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          />
          <button
            onClick={handleSaveDomain}
            disabled={savingDomain}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {savingDomain ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* DNS instructions — shown after a domain is saved */}
        {savedCustomDomain && verifyToken && (
          <div className="mt-2 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-3">
              <p className="font-medium text-slate-800">DNS setup instructions</p>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Step 1 — CNAME record (point domain to LaunchTrack)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Host</span>
                    <div className="mt-0.5 bg-white border border-slate-200 rounded px-2 py-1">
                      @ (or www)
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Value</span>
                    <div className="mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 truncate">
                      {APP_DOMAIN}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                  Step 2 — TXT record (domain verification)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400">Host</span>
                    <div className="mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 truncate">
                      _launchtrack.{savedCustomDomain}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Value</span>
                    <div className="mt-0.5 bg-white border border-slate-200 rounded px-2 py-1 truncate">
                      launchtrack-verify={verifyToken}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {customDomainVerified ? (
                <div className="flex items-center gap-1.5 text-sm text-green-700">
                  <ShieldCheck className="w-4 h-4" />
                  Domain verified
                </div>
              ) : (
                <>
                  <button
                    onClick={handleVerifyDomain}
                    disabled={verifying}
                    className="inline-flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {verifying ? 'Checking...' : 'Verify Domain'}
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    DNS changes can take up to 48 hours
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Branding */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Branding</h2>
        </div>

        <div className="space-y-5">
          {/* Brand color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Brand Color
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setBrandColor(color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: brandColor === color ? '#1e293b' : 'transparent',
                    transform: brandColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                  title={color}
                />
              ))}
              <div className="flex items-center gap-2 ml-1">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                  title="Custom color"
                />
                <span className="text-xs text-slate-500 font-mono">{brandColor}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className="h-2 w-24 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              <button
                className="text-xs text-white px-3 py-1 rounded-md font-medium"
                style={{ backgroundColor: brandColor }}
              >
                Sample button
              </button>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-slate-700 mb-1">
              Portal Tagline
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              id="tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Track your project with us"
              maxLength={120}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-400 mt-1">
              Shown on the login page below your agency name.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>

      {/* Client accounts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Client Accounts</h2>
          <span className="ml-1 text-sm text-slate-400">{clients.length}</span>
        </div>

        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">
              No client accounts yet. Send a portal invite from a client&apos;s page.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {clients.map((c) => (
              <div key={c.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {c.full_name ?? c.email}
                  </p>
                  {c.full_name && (
                    <p className="text-xs text-slate-500">{c.email}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Joined {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
