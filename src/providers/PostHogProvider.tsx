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
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

      console.log('PostHog initialization:', {
        hasKey: !!posthogKey,
        host: posthogHost,
        environment: process.env.NODE_ENV,
        origin: window.location.origin
      })

      if (posthogKey) {
        try {
          posthog.init(posthogKey, {
            api_host: posthogHost,
            capture_pageview: false, // Disable automatic pageview - we'll handle manually
            capture_pageleave: true, // Keep page leave tracking
            session_recording: {
              maskAllInputs: false, // Full recording for prototype insights
              recordCrossOriginIframes: true,
            },
            loaded: (posthog) => {
              console.log('PostHog loaded successfully in', process.env.NODE_ENV)
              // Enable session recording for all users in prototype
              posthog.startSessionRecording()
            },
            persistence: 'localStorage+cookie',
            autocapture: {
              dom_event_allowlist: ['click', 'change', 'submit'], // Capture key interactions
              // Removed domain restrictions for production compatibility
              element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea'],
            },
            // Add error handling
            on_xhr_error: (failedRequest) => {
              console.warn('PostHog XHR error:', failedRequest)
            },
          })
        } catch (error) {
          console.error('PostHog initialization failed:', error)
        }
      } else {
        console.warn('PostHog API key not found in environment variables')
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