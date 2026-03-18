/**
 * Use cases page — agency verticals that benefit from OnRampd.
 */
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const USE_CASES = [
  {
    id: 'marketing',
    heading: 'Marketing Agencies',
    tagline: 'Stop chasing clients for brand assets and approvals.',
    description:
      'Marketing agencies lose weeks on every new account waiting for logos, passwords, and sign-offs. OnRampd structures the whole intake → creative → approval loop so you can start billing faster.',
    benefits: [
      'Branded onboarding portal impresses new clients from day one',
      'Structured asset requests for brand guidelines, copy, and ad accounts',
      'Approval workflows for campaign sign-off — no more email chains',
      'CSAT surveys show clients how smooth the handoff was',
    ],
    quote: '"We launch new clients 3 weeks faster than before. The intake form alone saves us 5+ hours per project." — Marketing Director, BrandBoost',
  },
  {
    id: 'dev',
    heading: 'Web & Development Agencies',
    tagline: 'From signed contract to first sprint in days, not weeks.',
    description:
      'Dev agencies need hosting credentials, design assets, and technical specs before they can write a line of code. OnRampd\'s intake forms and asset requests get you everything upfront — structured and tracked.',
    benefits: [
      'Custom intake form collects server access, domain credentials, and specs',
      'Task dependencies prevent devs from working on blocked items',
      'Sub-tasks break complex work into trackable chunks',
      'Client portal shows build progress without exposing your internal tools',
    ],
    quote: '"The dependency system is brilliant. No one starts the dev phase until discovery is signed off." — CTO, Cascade Digital',
  },
  {
    id: 'creative',
    heading: 'Creative Studios',
    tagline: 'Keep clients informed while you do the creative work.',
    description:
      'Creative studios need space to create, but clients need visibility. OnRampd\'s portal gives clients real-time progress updates without interrupting your process.',
    benefits: [
      'Phase-based project view shows exactly where the creative is in the process',
      'Asset upload portal means fewer "can you send me that file" emails',
      'Internal notes keep creative direction private from clients',
      'Real-time chat replaces long email threads for feedback and approvals',
    ],
    quote: '"Our clients finally understand what\'s happening. The portal makes us look incredibly organized." — Creative Director, Studio Nine',
  },
  {
    id: 'consulting',
    heading: 'Consulting Firms',
    tagline: 'Deliver structured, professional client onboarding at scale.',
    description:
      'Consultants build their reputation on professionalism. A OnRampd-powered onboarding experience signals to new clients that they made the right choice.',
    benefits: [
      'Custom domain makes the portal feel like your own proprietary tool',
      'Intake forms gather stakeholder info, goals, and constraints upfront',
      'Phase templates reflect your consulting methodology',
      'Reports give clients (and your team) a clear view of engagement',
    ],
    quote: '"Clients comment on how smooth the onboarding is. We use OnRampd templates for every new engagement." — Partner, Meridian Consulting',
  },
]

export default function UseCasesPage() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Built for every kind of agency</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Whether you run a marketing agency, dev shop, creative studio, or consulting firm —
          OnRampd fits the way you work.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-16">
        {USE_CASES.map((uc, idx) => (
          <div
            key={uc.id}
            id={uc.id}
            className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-start ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{uc.heading}</h2>
              <p className="text-red-700 font-medium mb-4">{uc.tagline}</p>
              <p className="text-slate-600 mb-6 leading-relaxed">{uc.description}</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-red-800 transition-colors"
              >
                Try it free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                {uc.benefits.map((b) => (
                  <div key={b} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">{b}</p>
                  </div>
                ))}
              </div>
              <blockquote className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <p className="text-sm text-slate-600 italic leading-relaxed">{uc.quote}</p>
              </blockquote>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
