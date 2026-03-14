/**
 * Integrations page — what LaunchTrack connects with.
 */
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

const INTEGRATIONS = [
  {
    name: 'Stripe',
    category: 'Billing',
    description: 'Manage subscriptions, trial periods, and plan upgrades through Stripe Checkout.',
    status: 'live',
  },
  {
    name: 'Resend',
    category: 'Email',
    description: 'Transactional emails — invitations, CSAT surveys, and notifications — delivered reliably via Resend.',
    status: 'live',
  },
  {
    name: 'Supabase Storage',
    category: 'Files',
    description: 'Client asset uploads are stored securely in Supabase Storage with per-org access controls.',
    status: 'live',
  },
  {
    name: 'Slack',
    category: 'Notifications',
    description: 'Get notified in Slack when clients complete tasks, upload assets, or send messages.',
    status: 'coming_soon',
  },
  {
    name: 'Zapier',
    category: 'Automation',
    description: 'Connect LaunchTrack to 6,000+ apps. Trigger workflows when tasks complete or projects launch.',
    status: 'coming_soon',
  },
  {
    name: 'HubSpot',
    category: 'CRM',
    description: 'Sync new clients from HubSpot deals and update contact properties when projects progress.',
    status: 'coming_soon',
  },
  {
    name: 'Notion',
    category: 'Documentation',
    description: 'Import Notion databases as project templates or sync project notes to your workspace.',
    status: 'coming_soon',
  },
  {
    name: 'Webhooks',
    category: 'Developer',
    description: 'Subscribe to any LaunchTrack event via webhooks and build your own integrations.',
    status: 'coming_soon',
  },
]

const CATEGORIES = [...new Set(INTEGRATIONS.map((i) => i.category))]

export default function IntegrationsPage() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Integrations</h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          LaunchTrack works with the tools your agency already uses — and a growing list of new connections coming soon.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="bg-white rounded-xl border border-slate-200 p-6 relative"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                  <span className="text-xs text-slate-400">{integration.category}</span>
                </div>
                {integration.status === 'live' ? (
                  <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                    Live
                  </span>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{integration.description}</p>
            </div>
          ))}
        </div>

        {/* API note */}
        <div className="mt-12 bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
          <Zap className="w-8 h-8 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Need a custom integration?</h2>
          <p className="text-slate-500 mb-5 max-w-md mx-auto text-sm">
            The LaunchTrack API (available on Scale plan) lets you build anything — push projects
            from your CRM, sync tasks to your PM tool, or automate client communications.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            Talk to us about your integration needs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </>
  )
}
