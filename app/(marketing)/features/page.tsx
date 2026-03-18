/**
 * Features page — detailed breakdown of all OnRampd capabilities.
 */
import Link from 'next/link'
import {
  Zap, Users, CheckCircle2, MessageSquare, Upload,
  BarChart2, Clock, Shield, Star, Link2, FileText, Globe,
  ArrowRight,
} from 'lucide-react'

const FEATURE_GROUPS = [
  {
    heading: 'Client Portal',
    icon: Globe,
    color: 'blue',
    features: [
      {
        title: 'White-labeled, fully branded',
        description: 'Clients land on your brand. Use your logo, brand colors, and custom domain. OnRampd is completely invisible.',
      },
      {
        title: 'Custom subdomain & domain',
        description: 'Get myagency.onrampd.com automatically, or point your own domain (myagency.com) with a simple CNAME.',
      },
      {
        title: 'Magic link access',
        description: 'Invite clients with a single click. They access their portal without creating a password if they choose.',
      },
      {
        title: 'Mobile-friendly',
        description: 'The client portal works beautifully on any device — desktop, tablet, or phone.',
      },
    ],
  },
  {
    heading: 'Project Management',
    icon: CheckCircle2,
    color: 'green',
    features: [
      {
        title: 'Phase-by-phase onboarding',
        description: 'Structure projects into phases (Discovery, Setup, Launch, etc.) so clients always know where they are.',
      },
      {
        title: 'Task dependencies',
        description: 'Block tasks until prerequisites are done. If "Legal Review" isn\'t complete, "Go Live" stays locked.',
      },
      {
        title: 'Sub-tasks',
        description: 'Break complex tasks into bite-sized steps without cluttering the main view.',
      },
      {
        title: 'Approval workflows',
        description: 'Flag tasks that require client sign-off. Approvals are tracked and visible to both sides.',
      },
    ],
  },
  {
    heading: 'Communication',
    icon: MessageSquare,
    color: 'purple',
    features: [
      {
        title: 'Real-time project chat',
        description: 'Message clients directly from the project. Internal messages (visible only to your team) keep sensitive notes private.',
      },
      {
        title: '@mention support',
        description: 'Tag team members in internal notes and messages to loop in the right people.',
      },
      {
        title: 'Client-visible vs. internal messages',
        description: 'Toggle between client-visible and internal-only messages with one click.',
      },
    ],
  },
  {
    heading: 'Asset Collection',
    icon: Upload,
    color: 'amber',
    features: [
      {
        title: 'Structured asset requests',
        description: 'Request logos, copy, credentials, and any file type. Track what\'s been submitted and what\'s pending.',
      },
      {
        title: 'Client upload portal',
        description: 'Clients upload directly to their portal. No emailing large files.',
      },
    ],
  },
  {
    heading: 'Intake Forms',
    icon: FileText,
    color: 'teal',
    features: [
      {
        title: 'Custom intake forms',
        description: 'Build forms with text, dropdowns, checkboxes, and date fields. Link forms to projects.',
      },
      {
        title: 'Responses in the project view',
        description: 'Intake answers appear alongside tasks and chat — no context-switching.',
      },
      {
        title: 'Public form links',
        description: 'Share a link before the project even starts to gather info upfront.',
      },
    ],
  },
  {
    heading: 'Analytics & Reporting',
    icon: BarChart2,
    color: 'indigo',
    features: [
      {
        title: 'Client engagement tracking',
        description: 'See when clients last visited their portal, how often they log in, and whether they\'re ignoring you.',
      },
      {
        title: 'CSAT surveys',
        description: 'Send 1-5 star satisfaction surveys at any point. View average scores across all projects.',
      },
      {
        title: 'Exportable CSV reports',
        description: 'Download a full project summary — status, completion %, overdue tasks, CSAT — in one click.',
      },
    ],
  },
  {
    heading: 'Team Management',
    icon: Users,
    color: 'rose',
    features: [
      {
        title: 'Role-based access',
        description: 'Admins manage everything. Team members focus on assigned projects. Clients see only their portal.',
      },
      {
        title: 'Task assignment',
        description: 'Assign tasks to specific team members and track who owns what.',
      },
      {
        title: 'Service categories',
        description: 'Tag tasks by service type (Design, Dev, SEO, etc.) for better reporting.',
      },
    ],
  },
  {
    heading: 'Templates',
    icon: Zap,
    color: 'orange',
    features: [
      {
        title: 'Reusable project templates',
        description: 'Build once, launch forever. Create templates for your most common onboarding flows.',
      },
      {
        title: 'Phase + task presets',
        description: 'Templates include phases, tasks, dependencies, and asset requests — fully customizable.',
      },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-red-50', text: 'text-red-700' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
}

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Every tool your agency needs to onboard clients well
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          From the first intake form to the CSAT survey at launch — OnRampd handles the full
          onboarding lifecycle in one platform.
        </p>
      </section>

      {/* Feature groups */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-16">
        {FEATURE_GROUPS.map((group) => {
          const colors = COLOR_MAP[group.color]
          return (
            <div key={group.heading}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <group.icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{group.heading}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.features.map((f) => (
                  <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed pl-6">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start using these features today</h2>
          <p className="text-slate-400 mb-8">14-day free trial. No credit card required.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
          >
            Start free trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
