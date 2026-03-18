/**
 * Marketing homepage — hero, features overview, social proof, pricing CTA.
 */
import Link from 'next/link'
import {
  ArrowRight, CheckCircle2, Zap, Users, BarChart2,
  MessageSquare, Clock, Shield, Star,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'White-labeled client portal',
    description: 'Your brand, your domain. Clients see your logo — OnRampd stays invisible.',
  },
  {
    icon: CheckCircle2,
    title: 'Phase-by-phase task tracking',
    description: 'Break onboarding into phases. Dependencies, sub-tasks, and approvals built in.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time project chat',
    description: 'Agency-client messaging in one place. Internal notes stay private.',
  },
  {
    icon: Users,
    title: 'Intake forms',
    description: 'Collect everything you need upfront with branded intake forms linked to projects.',
  },
  {
    icon: BarChart2,
    title: 'Engagement analytics',
    description: 'See when clients last visited, track CSAT scores, and export reports as CSV.',
  },
  {
    icon: Clock,
    title: 'Asset collection',
    description: 'Request logos, copy, credentials — with upload tracking and reminders.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'OnRampd cut our average onboarding time from 6 weeks to 3. Clients actually know what to do next.',
    name: 'Sarah Chen',
    role: 'Operations Director, Pixel & Co.',
    score: 5,
  },
  {
    quote: 'The white-label portal is a game-changer. Clients think we built custom software for them.',
    name: 'Marcus Rivera',
    role: 'Founder, Cascade Digital',
    score: 5,
  },
  {
    quote: 'We went from chaotic email threads to having every asset, approval, and message in one place.',
    name: 'Jamie Park',
    role: 'Client Success Manager, Studio Nine',
    score: 5,
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-blue-400/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            Built for agencies. Loved by clients.
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Onboard clients
            <br />
            <span className="text-red-500">in half the time</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            OnRampd gives your agency a white-labeled client portal, structured onboarding phases,
            real-time chat, and CSAT — so you can get from signed to launched faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base"
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-base transition-colors"
            >
              See how it works
              <ArrowRight className="w-4 h-4 opacity-60" />
            </Link>
          </div>
          <p className="text-slate-500 text-xs mt-5">14-day free trial · No credit card required</p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="bg-slate-50 border-b border-slate-100 py-5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            Trusted by <strong className="text-slate-700">500+</strong> agencies to manage client onboarding
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Everything your team needs to deliver great onboarding
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            From intake form to live launch — OnRampd keeps clients informed, assets collected,
            and your team on track.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-red-700" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/features" className="text-red-700 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1">
            View all features <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How OnRampd works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Set up once, run it for every client. Your onboarding becomes a repeatable system.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Create a project', desc: 'Pick a template or build from scratch. Add phases, tasks, and assign team members.' },
              { step: '02', title: 'Invite your client', desc: 'Send a magic link. They get a branded portal — no new account needed.' },
              { step: '03', title: 'Collect & approve', desc: 'Clients upload assets, complete tasks, and send messages — all tracked in real time.' },
              { step: '04', title: 'Launch', desc: 'Hit 100%. Log the completion, send a CSAT survey, and archive the project.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-red-700 rounded-full text-white font-bold text-sm flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Agencies love OnRampd</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.score }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                <p className="text-slate-500 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="bg-red-700 py-20 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your onboarding?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-red-800 font-semibold px-7 py-3.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              Start free trial
            </Link>
            <Link
              href="/pricing"
              className="text-blue-100 hover:text-white font-medium inline-flex items-center gap-1 transition-colors"
            >
              View pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
