'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { usePostHog } from '@/providers/PostHogProvider'

export function PageviewTracker() {
  const pathname = usePathname()
  const posthog = usePostHog()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (pathname && posthog && pathname !== lastTrackedPath.current) {
      // Capture pageview with page type information
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_type: getPageType(pathname),
      })
      lastTrackedPath.current = pathname
    }
  }, [pathname, posthog])

  return null // This component doesn't render anything
}

// Helper function to determine page type from pathname
function getPageType(pathname: string): string {
  if (pathname === '/') return 'landing'
  if (pathname === '/login') return 'authentication'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/onboarding')) {
    if (pathname.includes('processing')) return 'onboarding_processing'
    return 'onboarding'
  }
  return 'unknown'
}