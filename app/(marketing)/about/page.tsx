/**
 * About page — mission, team, values.
 */
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

const VALUES = [
  {
    title: 'Agencies first',
    description:
      'Every feature we build is designed for the people managing onboarding, not just for the clients experiencing it. We understand the agency workflow.',
  },
  {
    title: 'Invisible technology',
    description:
      'The best tool is one your clients never know is there. Rampify hides behind your brand, so you get the credit for a seamless experience.',
  },
  {
    title: 'Simplicity over complexity',
    description:
      'We say no to feature bloat. Every addition to Rampify must make onboarding simpler — for you or for your clients.',
  },
  {
    title: 'Transparency',
    description:
      'We share our roadmap, pricing, and changes openly. No surprise price hikes, no hidden limits.',
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-5">
            We built the tool we always wanted
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            Rampify started because client onboarding was broken. Projects stalled waiting on
            assets. Clients didn't know what to do next. Teams sent the same follow-up emails every
            week. Everyone was frustrated.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            We built Rampify to give agencies a repeatable, professional system — and to give
            clients a clear, branded window into their project.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Today, hundreds of agencies use Rampify to cut their average onboarding time,
            improve client satisfaction scores, and stop losing time to admin work.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">What we believe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: '500+', label: 'Agencies' },
            { number: '12,000+', label: 'Projects managed' },
            { number: '4.8/5', label: 'Average CSAT' },
            { number: '3 weeks', label: 'Average time saved per project' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-extrabold text-red-700 mb-2">{stat.number}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Join 500+ agencies</h2>
          <p className="text-slate-400 mb-8">
            Start your 14-day free trial. Set up your first project in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Contact us →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
