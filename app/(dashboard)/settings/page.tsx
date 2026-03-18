/**
 * Settings page — org profile + team management.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, Plug, Users, ArrowRight, Globe } from 'lucide-react'
import { GettingStartedSection } from '@/components/onboarding/GettingStartedSection'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'org_admin') redirect('/dashboard')

  const org = profile.organization as unknown as { name: string; slug: string; plan: string }

  const { data: members } = await supabase
    .from('memberships')
    .select('*, user:users(id, email, full_name, role)')
    .eq('organization_id', profile.organization_id)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your organization and team</p>
      </div>

      {/* Org info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Organization</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Name</p>
            <p className="font-medium text-slate-900">{org?.name}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Plan</p>
            <p className="font-medium text-slate-900 capitalize">{org?.plan}</p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Team Members</h2>
          </div>
          <Link
            href="/settings/invite"
            className="text-sm text-red-700 hover:underline font-medium"
          >
            Invite member
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {(members ?? []).map((m) => {
            const member = m.user as { id: string; email: string; full_name: string | null; role: string }
            return (
              <div key={m.id} className="px-6 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {member?.full_name ?? member?.email}
                  </p>
                  <p className="text-xs text-slate-500">{member?.email}</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium capitalize">
                  {m.role.replace('_', ' ')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Getting Started Guide */}
      <GettingStartedSection />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/settings/integrations"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-red-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2 mb-1">
            <Plug className="w-4 h-4 text-red-700" />
            <h3 className="font-semibold text-slate-900 text-sm">Integrations</h3>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto" />
          </div>
          <p className="text-xs text-slate-500">ClickUp, Slack, Monday, Teamwork</p>
        </Link>

        <Link
          href="/settings/portal"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-red-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-violet-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Client Portal</h3>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto" />
          </div>
          <p className="text-xs text-slate-500">White-label branding, login URL, client accounts</p>
        </Link>

        <Link
          href="/billing"
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-red-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">💳</span>
            <h3 className="font-semibold text-slate-900 text-sm">Billing</h3>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto" />
          </div>
          <p className="text-xs text-slate-500">Manage plan and subscription</p>
        </Link>
      </div>
    </div>
  )
}
