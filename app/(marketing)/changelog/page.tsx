/**
 * Changelog page — product updates.
 */
import { Zap } from 'lucide-react'

const ENTRIES = [
  {
    version: '1.3.0',
    date: 'February 2026',
    tag: 'Major release',
    tagColor: 'bg-red-50 text-red-800',
    updates: [
      {
        type: 'New',
        items: [
          'Real-time project chat with internal/client-visible message toggle',
          'Client engagement analytics — see when clients last visited their portal',
          'CSAT surveys — send 1-5 star satisfaction surveys to clients',
          'Intake forms — customizable forms linked to projects',
          'Sub-tasks — break tasks into smaller steps',
          'Task dependencies — lock tasks until prerequisites are complete',
          'CSV export reports for all projects',
        ],
      },
    ],
  },
  {
    version: '1.2.0',
    date: 'January 2026',
    tag: 'Feature update',
    tagColor: 'bg-green-50 text-green-700',
    updates: [
      {
        type: 'New',
        items: [
          'Custom subdomain branding (myagency.onrampd.com)',
          'Custom domain support with CNAME + TXT verification',
          'Portal branding settings — upload logo, set brand color, custom tagline',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Portal login page now fully white-labeled — no OnRampd branding visible',
          'Middleware now handles clean subdomain URLs',
        ],
      },
    ],
  },
  {
    version: '1.1.0',
    date: 'December 2025',
    tag: 'Feature update',
    tagColor: 'bg-green-50 text-green-700',
    updates: [
      {
        type: 'New',
        items: [
          'Approval banners — alert agency staff when client approvals are pending',
          'Asset request cards with upload tracking',
          'Service categories for task tagging',
          'Project templates with full phase/task structure',
        ],
      },
      {
        type: 'Improved',
        items: [
          'Project detail page redesigned with progress bar and engagement strip',
          'Client portal now shows a circular progress indicator',
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    date: 'November 2025',
    tag: 'Launch',
    tagColor: 'bg-purple-50 text-purple-700',
    updates: [
      {
        type: 'New',
        items: [
          'Initial release of OnRampd',
          'Multi-tenant agency dashboard',
          'White-labeled client portal',
          'Phase + task management with status cycling',
          'Client portal access via magic link',
          'Team member management with role-based access',
          'Billing via Stripe (Starter, Growth, Scale plans)',
        ],
      },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  New: 'bg-green-50 text-green-700',
  Improved: 'bg-red-50 text-red-800',
  Fixed: 'bg-amber-50 text-amber-700',
}

export default function ChangelogPage() {
  return (
    <>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Changelog</h1>
        <p className="text-slate-500 text-lg">
          Everything new in OnRampd — shipped regularly, documented openly.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div className="space-y-12">
          {ENTRIES.map((entry) => (
            <div key={entry.version} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900">v{entry.version}</h2>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${entry.tagColor}`}>
                    {entry.tag}
                  </span>
                  <span className="text-sm text-slate-400">{entry.date}</span>
                </div>
              </div>

              <div className="ml-11 space-y-4">
                {entry.updates.map((update) => (
                  <div key={update.type}>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md mb-2.5 ${TYPE_COLORS[update.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {update.type}
                    </span>
                    <ul className="space-y-1.5">
                      {update.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-slate-300 mt-1.5 flex-shrink-0">—</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
