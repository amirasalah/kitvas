'use client'

export function CoffeeFooter() {
  return (
    <footer className="backdrop-blur-sm bg-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center gap-4">
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_COFFEE_LINK || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <span className="text-lg">🍵</span>
            Buy me a Matcha?
          </a>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Kitvas
          </p>
        </div>
      </div>
    </footer>
  );
}
