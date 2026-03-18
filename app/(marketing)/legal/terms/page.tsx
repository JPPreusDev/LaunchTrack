/**
 * Terms of service page.
 */
export default function TermsPage() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-slate-500 text-sm mb-10">Last updated: February 1, 2026</p>

      <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptance of terms</h2>
          <p className="text-slate-600">
            By accessing or using OnRampd, you agree to be bound by these Terms of Service.
            If you do not agree, do not use OnRampd.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Your account</h2>
          <p className="text-slate-600">
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account. You must notify us immediately
            of any unauthorized access.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Acceptable use</h2>
          <p className="text-slate-600 mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Use OnRampd for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
            <li>Interfere with or disrupt the integrity or performance of the service</li>
            <li>Upload content that infringes on intellectual property rights</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Subscription and billing</h2>
          <p className="text-slate-600">
            Paid plans are billed monthly or annually in advance. You may cancel at any time;
            cancellation takes effect at the end of the current billing period. We do not provide
            refunds for partial months.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Data and privacy</h2>
          <p className="text-slate-600">
            Your use of OnRampd is also governed by our{' '}
            <a href="/legal/privacy" className="text-red-700 hover:underline">Privacy Policy</a>.
            You retain ownership of all data you upload or create within OnRampd.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Service availability</h2>
          <p className="text-slate-600">
            We strive for 99.9% uptime but do not guarantee uninterrupted service. We may
            temporarily suspend the service for maintenance with advance notice where possible.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Limitation of liability</h2>
          <p className="text-slate-600">
            To the maximum extent permitted by law, OnRampd&apos;s liability for any claim
            arising from your use of the service is limited to the amount you paid in the 12
            months preceding the claim.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Changes to terms</h2>
          <p className="text-slate-600">
            We may update these terms at any time. We will notify you of material changes via
            email or in-app notification. Continued use after changes constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Contact</h2>
          <p className="text-slate-600">
            For questions about these terms, contact us at{' '}
            <a href="mailto:legal@onrampd.com" className="text-red-700 hover:underline">
              legal@onrampd.com
            </a>.
          </p>
        </div>
      </div>
    </section>
  )
}
