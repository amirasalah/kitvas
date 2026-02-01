'use client'

import { useEffect, useState } from 'react'

// Food illustration paths - add your illustration files to /public/illustrations/
const foodIllustrations = [
  '/illustrations/burger.svg',
  '/illustrations/pizza.svg',
  '/illustrations/sushi.svg',
  '/illustrations/cupcake.svg',
  '/illustrations/taco.svg',
  '/illustrations/ramen.svg',
  '/illustrations/avocado.svg',
  '/illustrations/croissant.svg',
  '/illustrations/ice-cream.svg',
  '/illustrations/donut.svg',
  '/illustrations/sandwich.svg',
  '/illustrations/cake.svg',
]

interface FloatingFoodProps {
  count?: number
  className?: string
}

export function FloatingFood({ count = 6, className = '' }: FloatingFoodProps) {
  const [positions, setPositions] = useState<Array<{
    x: number
    y: number
    rotation: number
    scale: number
    image: string
    delay: number
  }>>([])

  useEffect(() => {
    // Generate random positions for food illustrations
    const newPositions = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 30 - 15,
      scale: 0.5 + Math.random() * 0.5,
      image: foodIllustrations[i % foodIllustrations.length],
      delay: i * 0.2,
    }))
    setPositions(newPositions)
  }, [count])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute opacity-[0.15] animate-float"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `rotate(${pos.rotation}deg) scale(${pos.scale})`,
            animationDelay: `${pos.delay}s`,
          }}
        >
          <img
            src={pos.image}
            alt=""
            className="w-16 h-16 object-contain"
            onError={(e) => {
              // Hide if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      ))}
    </div>
  )
}

// Static decorative illustrations for specific positions
interface FoodDecorationProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  illustration?: string
  className?: string
}

export function FoodDecoration({ position, illustration, className = '' }: FoodDecorationProps) {
  const positionClasses = {
    'top-left': '-top-4 -left-4 rotate-[-15deg]',
    'top-right': '-top-4 -right-4 rotate-[15deg]',
    'bottom-left': '-bottom-4 -left-4 rotate-[15deg]',
    'bottom-right': '-bottom-4 -right-4 rotate-[-15deg]',
  }

  return (
    <div
      className={`absolute w-20 h-20 opacity-20 ${positionClasses[position]} ${className}`}
    >
      <img
        src={illustration || foodIllustrations[0]}
        alt=""
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}

// Inline SVG food icons for guaranteed display (fallback when images aren't available)
export function BurgerIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28C8 28 10 16 32 16C54 16 56 28 56 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 32H58" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="32" cy="40" rx="26" ry="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 44C8 44 10 52 32 52C54 52 56 44 56 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="24" r="2" fill="currentColor"/>
      <circle cx="28" cy="22" r="2" fill="currentColor"/>
      <circle cx="40" cy="24" r="2" fill="currentColor"/>
      <circle cx="48" cy="26" r="2" fill="currentColor"/>
    </svg>
  )
}

export function PizzaIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L8 56H56L32 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="36" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="36" cy="44" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="28" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 52C12 52 22 48 32 48C42 48 52 52 52 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function CupcakeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 32C16 32 14 24 20 20C26 16 28 20 32 18C36 16 38 14 44 18C50 22 48 32 48 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 32H50L46 56H18L14 32Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M20 40H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 48H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="32" cy="14" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

export function RamenIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="24" rx="24" ry="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 24C8 24 8 48 32 56C56 48 56 24 56 24" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 28C16 28 16 36 20 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 28C28 28 28 40 32 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40 28C40 28 42 36 48 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="24" cy="20" rx="4" ry="2" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="40" cy="20" rx="4" ry="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

export function AvocadoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8C18 8 8 24 8 40C8 52 18 60 32 60C46 60 56 52 56 40C56 24 46 8 32 8Z" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="32" cy="44" rx="10" ry="12" stroke="currentColor" strokeWidth="2"/>
      <ellipse cx="32" cy="44" rx="5" ry="6" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  )
}

export function TacoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40C8 40 8 24 32 24C56 24 56 40 56 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 40C8 52 18 56 32 56C46 56 56 52 56 40" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 32C16 32 24 28 32 30C40 32 48 28 48 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="36" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="32" cy="38" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="44" cy="36" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

// Hero section with floating food decorations
export function HeroFoodDecorations() {
  return (
    <>
      {/* Top left area */}
      <div className="absolute top-4 left-4 lg:top-8 lg:left-12 opacity-60 text-amber-500 animate-float hidden md:block" style={{ animationDelay: '0s' }}>
        <BurgerIcon className="w-20 h-20 lg:w-28 lg:h-28" />
      </div>
      <div className="absolute top-28 left-28 lg:top-36 lg:left-40 opacity-50 text-rose-500 animate-float-reverse hidden lg:block" style={{ animationDelay: '1.2s' }}>
        <CupcakeIcon className="w-16 h-16 lg:w-20 lg:h-20" />
      </div>

      {/* Top right area */}
      <div className="absolute top-6 right-6 lg:top-10 lg:right-16 opacity-60 text-orange-500 animate-float hidden md:block" style={{ animationDelay: '0.8s' }}>
        <PizzaIcon className="w-20 h-20 lg:w-24 lg:h-24" />
      </div>
      <div className="absolute top-32 right-32 lg:top-40 lg:right-44 opacity-50 text-yellow-500 animate-float-slow hidden lg:block" style={{ animationDelay: '2s' }}>
        <TacoIcon className="w-14 h-14 lg:w-18 lg:h-18" />
      </div>

      {/* Bottom left area */}
      <div className="absolute bottom-8 left-8 lg:bottom-12 lg:left-20 opacity-55 text-red-500 animate-float-reverse hidden md:block" style={{ animationDelay: '1.5s' }}>
        <RamenIcon className="w-18 h-18 lg:w-24 lg:h-24" />
      </div>

      {/* Bottom right area */}
      <div className="absolute bottom-6 right-8 lg:bottom-10 lg:right-24 opacity-60 text-lime-500 animate-float hidden md:block" style={{ animationDelay: '0.5s' }}>
        <AvocadoIcon className="w-16 h-16 lg:w-22 lg:h-22" />
      </div>

      {/* Extra decorations for larger screens */}
      <div className="absolute top-1/2 left-4 opacity-40 text-purple-400 animate-float-slow hidden xl:block" style={{ animationDelay: '2.5s' }}>
        <CupcakeIcon className="w-16 h-16" />
      </div>
      <div className="absolute top-1/2 right-6 opacity-45 text-cyan-500 animate-float-reverse hidden xl:block" style={{ animationDelay: '1.8s' }}>
        <TacoIcon className="w-14 h-14" />
      </div>
    </>
  )
}

// Empty state illustration
export function EmptyStateIllustration({ type = 'search' }: { type?: 'search' | 'opportunities' | 'videos' }) {
  const icons = {
    search: (
      <div className="relative animate-float-slow">
        <RamenIcon className="w-32 h-32 text-red-300" />
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
          <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    ),
    opportunities: (
      <div className="relative animate-float-slow">
        <CupcakeIcon className="w-32 h-32 text-rose-300" />
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
          <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    ),
    videos: (
      <div className="relative animate-float-slow">
        <PizzaIcon className="w-32 h-32 text-orange-300" />
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
          <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    ),
  }

  return icons[type]
}
