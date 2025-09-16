'use client'

import { useEffect, useCallback } from 'react'
import { usePostHog } from '@/providers/PostHogProvider'
import { usePathname } from 'next/navigation'

export function usePostHogTracking() {
  const posthog = usePostHog()
  const pathname = usePathname()

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_type: getPageType(pathname),
      })
    }
  }, [pathname, posthog])

  // Authentication tracking - using useCallback to prevent object recreation
  const trackUserSignup = useCallback((method: 'email' | 'google' = 'email') => {
    posthog?.capture('user_signup_attempted', {
      signup_method: method,
      page_url: window.location.href,
    })
  }, [posthog])

  const trackUserSignupSuccess = useCallback((userId: string, method: 'email' | 'google' = 'email') => {
    posthog?.identify(userId)
    posthog?.capture('user_signup_completed', {
      signup_method: method,
      user_id: userId,
    })
  }, [posthog])

  const trackUserLogin = useCallback((method: 'email' | 'google' = 'email') => {
    posthog?.capture('user_login_attempted', {
      login_method: method,
      page_url: window.location.href,
    })
  }, [posthog])

  const trackUserLoginSuccess = useCallback((userId: string, method: 'email' | 'google' = 'email') => {
    posthog?.identify(userId)
    posthog?.capture('user_login_completed', {
      login_method: method,
      user_id: userId,
    })
  }, [posthog])

  const trackUserLogout = useCallback(() => {
    posthog?.capture('user_logout_completed')
    posthog?.reset()
  }, [posthog])

  // Onboarding tracking
  const trackOnboardingStarted = () => {
    posthog?.capture('onboarding_started')
  }

  const trackUrlSubmitted = (url: string, urlType: string) => {
    posthog?.capture('onboarding_url_submitted', {
      submitted_url: url,
      url_type: urlType,
      url_domain: new URL(url).hostname,
    })
  }

  const trackProfileGenerationStarted = () => {
    posthog?.capture('profile_generation_started')
  }

  const trackProfileGenerationCompleted = (durationMs: number, profileLength: number) => {
    posthog?.capture('profile_generation_completed', {
      generation_duration_ms: durationMs,
      profile_text_length: profileLength,
    })
  }

  const trackOnboardingCompleted = () => {
    posthog?.capture('onboarding_completed')
  }

  // Dashboard tracking
  const trackFeedRefreshClicked = () => {
    posthog?.capture('feed_refresh_clicked')
  }

  const trackFeedRefreshCompleted = (itemCount: number, categories: string[], durationMs: number) => {
    posthog?.capture('feed_refresh_completed', {
      feed_item_count: itemCount,
      feed_categories: categories,
      generation_duration_ms: durationMs,
    })
  }

  const trackFeedItemClicked = (itemId: string, itemType: string, title: string, source?: string) => {
    posthog?.capture('feed_item_clicked', {
      item_id: itemId,
      item_type: itemType,
      item_title: title,
      item_source: source,
    })
  }

  const trackFeedItemExpanded = (itemId: string, itemType: string) => {
    posthog?.capture('feed_item_expanded', {
      item_id: itemId,
      item_type: itemType,
    })
  }

  const trackFeedCategoryInteraction = useCallback((categoryType: string, itemCount: number) => {
    posthog?.capture('feed_category_viewed', {
      category_type: categoryType,
      category_item_count: itemCount,
    })
  }, [posthog])

  // Research-specific tracking
  const trackResearchDiscovery = (discoveryType: 'breakthrough_paper' | 'funding_opportunity' | 'collaboration_lead') => {
    posthog?.capture('research_discovery_identified', {
      discovery_type: discoveryType,
    })
  }

  const trackContentEngagement = (engagementType: 'time_spent' | 'bookmark' | 'share', metadata?: Record<string, any>) => {
    posthog?.capture('content_engagement', {
      engagement_type: engagementType,
      ...metadata,
    })
  }

  // Favourites tracking
  const trackItemFavourited = (itemId: string, itemType: string, itemTitle: string) => {
    posthog?.capture('item_favourited', {
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
    })
  }

  const trackItemUnfavourited = (itemId: string, itemType: string, itemTitle: string) => {
    posthog?.capture('item_unfavourited', {
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
    })
  }

  const trackFavouritesViewed = (favouritesCount: number) => {
    posthog?.capture('favourites_viewed', {
      favourites_count: favouritesCount,
    })
  }

  // Error tracking - stabilized to prevent excessive calls
  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    posthog?.capture('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      page_url: window.location.href,
      ...context,
    })
  }, [posthog])

  // Generic event tracking
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    posthog?.capture(eventName, {
      page_url: window.location.href,
      ...properties,
    })
  }

  return {
    // Authentication
    trackUserSignup,
    trackUserSignupSuccess,
    trackUserLogin,
    trackUserLoginSuccess,
    trackUserLogout,

    // Onboarding
    trackOnboardingStarted,
    trackUrlSubmitted,
    trackProfileGenerationStarted,
    trackProfileGenerationCompleted,
    trackOnboardingCompleted,

    // Dashboard
    trackFeedRefreshClicked,
    trackFeedRefreshCompleted,
    trackFeedItemClicked,
    trackFeedItemExpanded,
    trackFeedCategoryInteraction,

    // Research
    trackResearchDiscovery,
    trackContentEngagement,

    // Favourites
    trackItemFavourited,
    trackItemUnfavourited,
    trackFavouritesViewed,

    // Errors
    trackError,

    // Generic
    trackEvent,
  }
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