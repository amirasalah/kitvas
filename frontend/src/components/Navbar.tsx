'use client'

import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl bitcount-logo text-gray-900">Kitvas</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/label"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/opportunities"
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Opportunities
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_COFFEE_LINK || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <span className="text-lg">☕</span>
              Buy me a coffee
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
