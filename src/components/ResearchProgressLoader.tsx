'use client'

import { useState, useEffect } from 'react'

interface ResearchProgressLoaderProps {
  className?: string
}

export default function ResearchProgressLoader({ className = '' }: ResearchProgressLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [currentDot, setCurrentDot] = useState(0)

  const researchMessages = [
    'Initialising research parameters...',
    'Connecting to scientific databases...',
    'Calibrating discovery algorithms...',
    'Preparing your personalised feed...',
    'Almost ready to discover...'
  ]

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % researchMessages.length)
    }, 1500)

    const dotInterval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 5)
    }, 300)

    return () => {
      clearInterval(messageInterval)
      clearInterval(dotInterval)
    }
  }, [])

  return (
    <main className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center ${className}`}>
      <div className="text-center space-y-8">
        {/* Scientific Equipment Animation */}
        <div className="relative w-24 h-24 mx-auto">
          {/* Microscope base */}
          <svg
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Base */}
            <rect x="20" y="80" width="56" height="8" rx="4" fill="currentColor" className="text-gray-600" />

            {/* Arm */}
            <rect x="42" y="40" width="6" height="45" rx="3" fill="currentColor" className="text-gray-600" />

            {/* Objective lenses */}
            <circle cx="30" cy="50" r="4" fill="currentColor" className="text-indigo-600 animate-pulse"
                    style={{ animationDelay: '0s' }} />
            <circle cx="30" cy="60" r="4" fill="currentColor" className="text-cyan-600 animate-pulse"
                    style={{ animationDelay: '0.5s' }} />
            <circle cx="30" cy="70" r="4" fill="currentColor" className="text-indigo-500 animate-pulse"
                    style={{ animationDelay: '1s' }} />

            {/* Eyepiece */}
            <circle cx="45" cy="25" r="6" fill="currentColor" className="text-gray-700" />
            <circle cx="45" cy="25" r="4" fill="currentColor" className="text-indigo-600 animate-ping" />

            {/* Stage */}
            <rect x="15" y="72" width="20" height="4" rx="2" fill="currentColor" className="text-gray-500" />

            {/* Sample with scanning beam */}
            <circle cx="25" cy="74" r="2" fill="currentColor" className="text-cyan-500 animate-bounce" />

            {/* Light path */}
            <line x1="25" y1="72" x2="45" y2="27" stroke="currentColor" strokeWidth="2"
                  className="text-yellow-300 animate-pulse opacity-60" />
          </svg>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentDot
                  ? 'bg-indigo-600 scale-125'
                  : index < currentDot
                  ? 'bg-cyan-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Dynamic message */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 animate-pulse">
            {researchMessages[currentMessage]}
          </p>
          <p className="text-sm text-gray-600">
            Preparing your scientific discovery experience
          </p>
        </div>

        {/* Research icons */}
        <div className="flex justify-center space-x-6">
          {/* DNA */}
          <div className="w-8 h-8 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }}>
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 2 Q12 6 8 10 Q4 14 8 18 Q12 22 8 26 M16 2 Q12 6 16 10 Q20 14 16 18 Q12 22 16 26"
                    stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="8" cy="6" r="1" fill="currentColor" />
              <circle cx="16" cy="6" r="1" fill="currentColor" />
              <circle cx="8" cy="18" r="1" fill="currentColor" />
              <circle cx="16" cy="18" r="1" fill="currentColor" />
            </svg>
          </div>

          {/* Atom */}
          <div className="w-8 h-8 text-cyan-400 animate-pulse">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1" fill="none"
                      transform="rotate(45 12 12)" />
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1" fill="none"
                      transform="rotate(-45 12 12)" />
            </svg>
          </div>

          {/* Beaker */}
          <div className="w-8 h-8 text-indigo-500 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 2v6L5 14v6a2 2 0 002 2h10a2 2 0 002-2v-6l-4-6V2H9z" stroke="currentColor"
                    strokeWidth="1" fill="none" />
              <line x1="9" y1="2" x2="15" y2="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="16" r="2" fill="currentColor" className="animate-ping" />
            </svg>
          </div>
        </div>
      </div>
    </main>
  )
}