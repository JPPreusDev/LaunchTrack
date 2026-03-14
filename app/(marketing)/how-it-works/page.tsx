/**
 * How it works page — step-by-step walkthrough.
 */
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Create your first project template',
    description:
      'Build a reusable onboarding flow in minutes. Add phases (Discovery, Setup, Launch), tasks, dependencies, and asset requests. Save it as a template and reuse it for every new client.',
    details: [
      'Drag-and-drop phase ordering',
      'Task dependencies to prevent out-of-order work',
      'Sub-tasks for complex items',
      'Asset request types built in',
    ],
  },
  {
    number: '02',
    title: 'Launch a project from your template',
    description:
      'When a new client signs, create a project in under 60 seconds. Select your template, set the start date and launch target, assign team members, and you\'re ready.',
    details: [
      'Apply any template with one click',
      'Customize per-project as needed',
      'Set estimated launch date for deadline visibility',
      'Assign tasks to specific team members',
    ],
  },
  {
    number: '03',
    title: 'Invite your client to their portal',
    description:
      'Send a branded invitation email. Your client lands on their portal — your logo, your colors, your domain. They see exactly what they need to do, and nothing they don\'t.',
    details: [
      'Magic link invite — no account setup friction',
      'Fully white-labeled with your branding',
      'Mobile-responsive portal',
      'Client sees only client-facing tasks',
    ],
  },
  {
    number: '04',
    title: 'Collect assets and run intake forms',
    description:
      'Before work starts, send your intake form to collect goals, brand guidelines, credentials, and any other information you need. Asset requests prompt clients to upload files directly.',
    details: [
      'Custom form fields (text, select, date, checkbox)',
      'Intake responses visible in the project view',
      'Asset upload prompts with status tracking',
      'No email attachments or shared drives',
    ],
  },
  {
    number: '05',
    title: 'Track progress and communicate',
    description:
      'Your team works through tasks while the client follows along in their portal. Real-time chat keeps communication in context. Internal notes stay hidden from the client.',
    details: [
      'Task status cycling (not started → in progress → done)',
      'Dependency locks prevent working on blocked tasks',
      'Client-visible and internal messages in the same panel',
      'Approval tasks require explicit client sign-off',
    ],
  },
  {
    number: '06',
    title: 'Launch and measure satisfaction',
    description:
      'Hit 100%. Mark the project complete, send a CSAT survey to the client, and export your project report. Use your CSAT data to improve your next onboarding.',
    details: [
      'One-click CSAT survey sends to client',
      '1–5 star rating with optional comment',
      'Average CSAT visible on the project overview',
      'Export CSV report for the full project history',
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">How LaunchTrack works</h1>
        <p className="text-slate-500 text-lg">
          A structured, repeatable system that gets clients from signed to live — every time.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-100 hidden sm:block" />

          <div className="space-y-12">
            {STEPS.map((step) => (
              <div key={step.number} className="relative flex gap-6 sm:gap-8">
                <div className="flex-shrink-0 w-14 h-14 bg-blue-600 rounded-full text-white font-bold text-sm flex items-center justify-center z-10">
                  {step.number}
                </div>
                <div className="flex-1 pt-3">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h2>
                  <p className="text-slate-600 leading-relaxed mb-4">{step.description}</p>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                    {step.details.map((d) => (
                      <div key={d} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-600">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-blue-600 rounded-2xl p-10 text-center text-white">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">See it for yourself</h2>
          <p className="text-blue-100 mb-6">
            Set up your first project in under 5 minutes. No training required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Start free trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
