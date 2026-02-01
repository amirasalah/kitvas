'use client'

export function CoffeeFooter() {
  return (
    <footer className="backdrop-blur-sm bg-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Kitvas
          </p>
        </div>
      </div>
    </footer>
  )
}
