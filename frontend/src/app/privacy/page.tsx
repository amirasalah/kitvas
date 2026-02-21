import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Kitvas',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <Link href="/" className="inline-block mb-8">
          <span className="text-2xl bitcount-logo text-gray-900">Kitvas</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>When you sign in with Google, we collect:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Email address</strong> — used for account identification and email alerts</li>
              <li><strong>Display name</strong> — shown in the app interface</li>
              <li><strong>Profile picture URL</strong> — shown in the navigation bar</li>
            </ul>
            <p className="mt-2">We also collect:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Search queries</strong> — aggregated anonymously to improve ingredient intelligence</li>
              <li><strong>IP address</strong> — used for rate limiting only, not stored long-term</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authenticate your account and manage sessions</li>
              <li>Send breakout ingredient email alerts (if you opt in)</li>
              <li>Aggregate search patterns to improve content gap analysis</li>
              <li>Enforce rate limits to protect the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Data Storage</h2>
            <p>
              Your data is stored in a PostgreSQL database hosted on Supabase. Authentication tokens are encrypted using JWE (JSON Web Encryption) and never stored in plaintext.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Third-Party Services</h2>
            <p>Kitvas uses the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Google OAuth</strong> — for authentication</li>
              <li><strong>YouTube Data API</strong> — for video metadata (public data only)</li>
              <li><strong>Google Trends</strong> — for trend data (no personal data shared)</li>
              <li><strong>Resend</strong> — for sending email alerts</li>
              <li><strong>Groq</strong> — for AI-powered ingredient extraction (no personal data shared)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Email Alerts</h2>
            <p>
              Breakout ingredient alerts are opt-in only. You can subscribe or unsubscribe at any time from the app menu. We will not send marketing emails.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data Sharing</h2>
            <p>
              We do not sell, trade, or share your personal data with third parties. Aggregated, anonymized search data may be used to improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Data Deletion</h2>
            <p>
              To delete your account and all associated data, contact us. We will remove your user record, alert subscriptions, and sent alert history.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Cookies</h2>
            <p>
              Kitvas uses a single session cookie (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">authjs.session-token</code>) for authentication. No tracking cookies or third-party analytics cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be reflected on this page with an updated date.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <Link href="/" className="text-sm text-[#10B981] hover:underline">
            &larr; Back to Kitvas
          </Link>
        </div>
      </div>
    </div>
  )
}
