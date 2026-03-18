/**
 * Billing page — Stripe subscription management.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle2, Zap } from 'lucide-react'
import { CheckoutButton } from '@/components/billing/CheckoutButton'
import { ManageBillingButton } from '@/components/billing/ManageBillingButton'
import { PLAN_LIMITS } from '@/types'

const PLANS = [
  {
    key: 'starter' as const,
    name: 'Starter',
    price: 49,
    features: [
      'Up to 5 active onboarding projects',
      'Unlimited templates',
      'Client portal',
      'Asset collection',
      'Email notifications',
    ],
  },
  {
    key: 'growth' as const,
    name: 'Growth',
    price: 149,
    features: [
      'Up to 20 active onboarding projects',
      'Everything in Starter',
      'Approval checkpoints',
      'Integration (ClickUp, Slack)',
      'Automation rules',
    ],
    popular: true,
  },
  {
    key: 'scale' as const,
    name: 'Scale',
    price: 299,
    features: [
      'Unlimited onboarding projects',
      'Everything in Growth',
      'All integrations (Monday, Teamwork)',
      'Priority support',
      'Custom automation',
    ],
  },
]

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'org_admin') redirect('/dashboard')

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, subscription_status, stripe_customer_id, trial_ends_at')
    .eq('id', profile.organization_id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  const currentPlan = org?.plan ?? 'starter'
  const status = org?.subscription_status ?? 'trialing'

  // Count active projects
  const { count: activeProjects } = await supabase
    .from('onboarding_projects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .neq('status', 'completed')

  const maxProjects = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS]?.max_projects ?? 5

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your subscription and plan</p>
      </div>

      {/* Current plan status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-red-700" />
              <h2 className="font-semibold text-slate-900">
                Current Plan: <span className="text-red-700 capitalize">{currentPlan}</span>
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Status: <span className="capitalize font-medium text-slate-700">{status}</span>
              {status === 'trialing' && org?.trial_ends_at && (
                <span className="text-amber-600 ml-1">
                  · Trial ends{' '}
                  {new Date(org.trial_ends_at).toLocaleDateString()}
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Active projects: {activeProjects ?? 0} / {maxProjects >= 999999 ? '∞' : maxProjects}
            </p>
          </div>

          {org?.stripe_customer_id && (
            <ManageBillingButton customerId={org.stripe_customer_id} />
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key

          return (
            <div
              key={plan.key}
              className={`bg-white rounded-xl border-2 p-6 relative ${
                plan.popular
                  ? 'border-red-600 shadow-lg'
                  : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="w-full text-center py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                  Current Plan
                </div>
              ) : (
                <CheckoutButton
                  plan={plan.key}
                  organizationId={profile.organization_id}
                  userEmail={user.email!}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
