/**
 * Dashboard layout with sidebar navigation.
 * All authenticated agency staff routes use this layout.
 * Wraps children in OnboardingTourProvider so tours persist across navigations.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TopBar } from '@/components/dashboard/TopBar'
import { OnboardingTourProvider } from '@/components/onboarding/OnboardingTourProvider'
import { TourModal } from '@/components/onboarding/TourModal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile + org
  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Clients use portal, not dashboard
  if (profile.role === 'client_user') {
    redirect('/portal/dashboard')
  }

  // Check whether the org already has resources so tours can auto-complete.
  // Only run for admins since tours are admin-only.
  let hasTemplates = false
  let hasClients = false
  let hasProjects = false

  if (profile.role === 'org_admin' && profile.organization_id) {
    const [t, c, p] = await Promise.all([
      supabase
        .from('onboarding_templates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id),
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id),
      supabase
        .from('onboarding_projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id),
    ])
    hasTemplates = (t.count ?? 0) > 0
    hasClients = (c.count ?? 0) > 0
    hasProjects = (p.count ?? 0) > 0
  }

  return (
    <OnboardingTourProvider
      userId={user.id}
      hasTemplates={hasTemplates}
      hasClients={hasClients}
      hasProjects={hasProjects}
    >
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          userRole={profile.role}
          organizationName={(profile.organization as { name: string })?.name ?? ''}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={profile} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      {/* TourModal renders fixed/floating — persists across page navigations */}
      <TourModal />
    </OnboardingTourProvider>
  )
}
