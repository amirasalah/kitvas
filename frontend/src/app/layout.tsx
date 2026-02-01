import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { CoffeeFooter } from '@/components/CoffeeFooter'

export const metadata: Metadata = {
  title: 'Kitvas - Intelligence Platform for Food Content Creators',
  description: 'Find recipe opportunities with ingredient-level intelligence',
}

// Replace with your Stripe Payment Link
const STRIPE_COFFEE_LINK = process.env.NEXT_PUBLIC_STRIPE_COFFEE_LINK || '#'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col gradient-hero">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <CoffeeFooter stripeLink={STRIPE_COFFEE_LINK} />
        </Providers>
      </body>
    </html>
  )
}
