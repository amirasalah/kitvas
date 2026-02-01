'use client'

interface CoffeeFooterProps {
  stripeLink?: string
}

export function CoffeeFooter({ stripeLink = '#' }: CoffeeFooterProps) {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Kitvas
          </p>

          <a
            href={stripeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <span>&#9749;</span>
            Buy me a coffee
          </a>
        </div>
      </div>
    </footer>
  )
}
