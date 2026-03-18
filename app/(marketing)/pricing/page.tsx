/**
 * Pricing page — 3 tiers with feature comparison.
 */
import Link from 'next/link'
import { CheckCircle2, X, Zap } from 'lucide-react'

interface PricingTier {
  name: string
  price: number
  description: string
  highlight: boolean
  features: string[]
  cta: string
}

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for solo freelancers and small teams just getting started.',
    highlight: false,
    cta: 'Start free trial',
    features: [
      'Up to 10 active projects',
      'Unlimited clients',
      '3 team members',
      'White-labeled client portal',
      'Phase + task management',
      'File asset requests',
      'Real-time chat',
      'Intake forms',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: 149,
    description: 'For growing agencies that need more projects and collaboration.',
    highlight: true,
    cta: 'Start free trial',
    features: [
      'Up to 50 active projects',
      'Unlimited clients',
      '10 team members',
      'Everything in Starter',
      'Custom subdomain branding',
      'CSAT surveys',
      'Engagement analytics',
      'CSV/PDF reports',
      'Task dependencies',
      'Priority email support',
    ],
  },
  {
    name: 'Scale',
    price: 299,
    description: 'For established agencies with high volume and custom domain needs.',
    highlight: false,
    cta: 'Start free trial',
    features: [
      'Unlimited projects',
      'Unlimited clients',
      'Unlimited team members',
      'Everything in Growth',
      'Custom domain (your own URL)',
      'API access',
      'Advanced reporting',
      'Dedicated onboarding call',
      'Slack support',
      'SLA guarantee',
    ],
  },
]

const COMPARISON_ROWS = [
  { label: 'Active projects', starter: '10', growth: '50', scale: 'Unlimited' },
  { label: 'Team members', starter: '3', growth: '10', scale: 'Unlimited' },
  { label: 'Client portal (white-label)', starter: true, growth: true, scale: true },
  { label: 'Real-time chat', starter: true, growth: true, scale: true },
  { label: 'Intake forms', starter: true, growth: true, scale: true },
  { label: 'Asset requests', starter: true, growth: true, scale: true },
  { label: 'Custom subdomain', starter: false, growth: true, scale: true },
  { label: 'Custom domain (CNAME)', starter: false, growth: false, scale: true },
  { label: 'CSAT surveys', starter: false, growth: true, scale: true },
  { label: 'Engagement analytics', starter: false, growth: true, scale: true },
  { label: 'CSV reports', starter: false, growth: true, scale: true },
  { label: 'API access', starter: false, growth: false, scale: true },
]

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-slate-700">{value}</span>
  }
  return value
    ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
    : <X className="w-4 h-4 text-slate-300 mx-auto" />
}

export default function PricingPage() {
  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                tier.highlight
                  ? 'border-red-600 bg-red-700 text-white shadow-xl'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {tier.highlight && (
                <div className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-medium px-2.5 py-1 rounded-full mb-4 self-start">
                  <Zap className="w-3 h-3" /> Most popular
                </div>
              )}
              <h2 className={`text-xl font-bold mb-1 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                {tier.name}
              </h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-4xl font-extrabold ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                  ${tier.price}
                </span>
                <span className={`text-sm ${tier.highlight ? 'text-blue-200' : 'text-slate-400'}`}>/mo</span>
              </div>
              <p className={`text-sm mb-6 leading-relaxed ${tier.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                {tier.description}
              </p>

              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-blue-200' : 'text-green-500'}`} />
                    <span className={tier.highlight ? 'text-blue-50' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  tier.highlight
                    ? 'bg-white text-red-800 hover:bg-red-50'
                    : 'bg-red-700 text-white hover:bg-red-800'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Feature comparison</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 w-1/2">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">Starter</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-red-700 bg-red-50/50">Growth</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">Scale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-slate-600">{row.label}</td>
                      <td className="px-6 py-3.5 text-center"><FeatureCell value={row.starter} /></td>
                      <td className="px-6 py-3.5 text-center bg-red-50/30"><FeatureCell value={row.growth} /></td>
                      <td className="px-6 py-3.5 text-center"><FeatureCell value={row.scale} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                q: 'What happens after the 14-day trial?',
                a: 'We\'ll ask you to choose a plan. Your data is safe — nothing is deleted.',
              },
              {
                q: 'Do clients need a OnRampd account?',
                a: 'No. Clients access their portal via a magic link or password login. They never see the OnRampd brand.',
              },
              {
                q: 'Can I use my own domain for the client portal?',
                a: 'Yes — on the Scale plan. You point a CNAME and add a TXT verification record, and we handle the rest.',
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
