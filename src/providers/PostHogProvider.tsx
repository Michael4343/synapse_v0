'use client'

import { createContext, useContext, useEffect, ReactNode, useMemo } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

interface PostHogContextType {
  posthog: typeof posthog
}

const PostHogContext = createContext<PostHogContextType | undefined>(undefined)

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

      if (posthogKey && posthogHost) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          capture_pageview: false, // Disable automatic pageview - we'll handle manually
          capture_pageleave: true, // Keep page leave tracking
          session_recording: {
            maskAllInputs: false, // Full recording for prototype insights
            recordCrossOriginIframes: true,
          },
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('PostHog loaded successfully')
            }
          },
          persistence: 'localStorage+cookie',
          autocapture: {
            dom_event_allowlist: ['click', 'change', 'submit'], // Capture key interactions
            url_allowlist: [window.location.origin], // Only track our domain
            element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea'],
          },
        })

        // Enable session recording for all users in prototype
        posthog.startSessionRecording()
      } else {
        console.warn('PostHog environment variables not configured')
      }
    }
  }, [])

  // Memoize the context value to prevent recreation on every render
  const contextValue = useMemo(() => ({ posthog }), [])

  return (
    <PostHogContext.Provider value={contextValue}>
      <PHProvider client={posthog}>
        {children}
      </PHProvider>
    </PostHogContext.Provider>
  )
}

export function usePostHog() {
  const context = useContext(PostHogContext)
  if (context === undefined) {
    throw new Error('usePostHog must be used within a PostHogProvider')
  }
  return context.posthog
}