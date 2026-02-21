import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Kitvas',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <Link href="/" className="inline-block mb-8">
          <span className="text-2xl bitcount-logo text-gray-900">Kitvas</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Kitvas, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
            <p>
              Kitvas is an intelligence platform for food content creators. It provides search analytics, ingredient demand signals, content gap analysis, and trend data sourced from YouTube and Google Trends. The service is provided &quot;as is&quot; without warranty.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. User Accounts</h2>
            <p>
              You may sign in with Google OAuth. You are responsible for maintaining the security of your account. Kitvas stores your email address and display name for authentication purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Use automated tools to scrape or abuse the service</li>
              <li>Attempt to bypass rate limits or access controls</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Interfere with or disrupt the service infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Accuracy</h2>
            <p>
              Kitvas provides demand signals and analytics based on publicly available data from YouTube and Google Trends. These are directional indicators, not guarantees. We make no warranty about the accuracy, completeness, or timeliness of the data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Intellectual Property</h2>
            <p>
              Kitvas is open source under the MIT license. Video metadata and thumbnails displayed in the service belong to their respective creators and are sourced via the YouTube Data API.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Limitation of Liability</h2>
            <p>
              Kitvas and its maintainers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
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
