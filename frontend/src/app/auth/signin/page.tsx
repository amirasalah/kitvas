'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-4xl bitcount-logo text-gray-900">Kitvas</span>
          </Link>
          <p className="mt-2 text-gray-600">Intelligence for Food Creators</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Welcome back
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Sign in to unlock full insights and trending data
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">
                {error === 'OAuthSignin' && 'Error starting sign in flow. Please try again.'}
                {error === 'OAuthCallback' && 'Error during sign in. Please try again.'}
                {error === 'OAuthAccountNotLinked' && 'This email is already associated with another account.'}
                {error === 'Default' && 'An error occurred. Please try again.'}
                {!['OAuthSignin', 'OAuthCallback', 'OAuthAccountNotLinked', 'Default'].includes(error) && 'An error occurred. Please try again.'}
              </p>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          {/* YouTube Access Notice */}
          <div className="mt-6 p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">YouTube Channel Access</p>
                <p className="text-xs text-gray-600 mt-1">
                  We request read-only access to your YouTube channel for performance benchmarking (Pro feature).
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-8 space-y-3">
            <p className="text-sm font-medium text-gray-700">By signing in, you can:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited searches with full analytics
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ingredient gap analysis & content angles
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Trending ingredients & search insights
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-[#10B981] hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-[#10B981] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#10B981] animate-spin"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
