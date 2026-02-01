import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { CoffeeFooter } from '@/components/CoffeeFooter'

export const metadata: Metadata = {
  title: 'Kitvas - Intelligence Platform for Food Content Creators',
  description: 'Find recipe opportunities with ingredient-level intelligence',
}

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
          <CoffeeFooter />
        </Providers>
      </body>
    </html>
  )
}
