'use client'

import { useCallback } from 'react'
import { usePostHog } from '@/providers/PostHogProvider'

// Helper to safely get current URL (prevents hydration issues)
const getCurrentUrl = () => typeof window !== 'undefined' ? window.location.href : ''

export function usePostHogTracking() {
  const posthog = usePostHog()

  // Authentication tracking - using useCallback to prevent object recreation
  const trackUserSignup = useCallback((method: 'email' | 'google' = 'email') => {
    posthog?.capture('user_signup_attempted', {
      signup_method: method,
      page_url: getCurrentUrl(),
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
      page_url: getCurrentUrl(),
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

  // Password reset tracking
  const trackPasswordResetRequested = useCallback((email: string) => {
    posthog?.capture('password_reset_requested', {
      email_domain: email.split('@')[1] || 'unknown',
      page_url: getCurrentUrl(),
    })
  }, [posthog])

  const trackPasswordResetSubmitted = useCallback(() => {
    posthog?.capture('password_reset_submitted', {
      page_url: getCurrentUrl(),
    })
  }, [posthog])

  const trackPasswordResetCompleted = useCallback(() => {
    posthog?.capture('password_reset_completed', {
      page_url: getCurrentUrl(),
    })
  }, [posthog])

  // Onboarding tracking - stabilized with useCallback
  const trackOnboardingStarted = useCallback(() => {
    posthog?.capture('onboarding_started')
  }, [posthog])

  const trackUrlSubmitted = useCallback((url: string, urlType: string) => {
    posthog?.capture('onboarding_url_submitted', {
      submitted_url: url,
      url_type: urlType,
      url_domain: new URL(url).hostname,
    })
  }, [posthog])

  const trackProfileGenerationStarted = useCallback(() => {
    posthog?.capture('profile_generation_started')
  }, [posthog])

  const trackProfileGenerationCompleted = useCallback((durationMs: number, profileLength: number) => {
    posthog?.capture('profile_generation_completed', {
      generation_duration_ms: durationMs,
      profile_text_length: profileLength,
    })
  }, [posthog])

  const trackOnboardingCompleted = useCallback(() => {
    posthog?.capture('onboarding_completed')
  }, [posthog])

  // Dashboard tracking - stabilized with useCallback
  const trackFeedRefreshClicked = useCallback(() => {
    posthog?.capture('feed_refresh_clicked')
  }, [posthog])

  const trackFeedRefreshCompleted = useCallback((itemCount: number, categories: string[], durationMs: number) => {
    posthog?.capture('feed_refresh_completed', {
      feed_item_count: itemCount,
      feed_categories: categories,
      generation_duration_ms: durationMs,
    })
  }, [posthog])

  const trackFeedItemClicked = useCallback((itemId: string, itemType: string, title: string, source?: string) => {
    posthog?.capture('feed_item_clicked', {
      item_id: itemId,
      item_type: itemType,
      item_title: title,
      item_source: source,
    })
  }, [posthog])

  const trackFeedItemExpanded = useCallback((itemId: string, itemType: string) => {
    posthog?.capture('feed_item_expanded', {
      item_id: itemId,
      item_type: itemType,
    })
  }, [posthog])

  const trackFeedCategoryInteraction = useCallback((categoryType: string, itemCount: number) => {
    posthog?.capture('feed_category_viewed', {
      category_type: categoryType,
      category_item_count: itemCount,
    })
  }, [posthog])

  // Research-specific tracking - stabilized with useCallback
  const trackResearchDiscovery = useCallback((discoveryType: 'breakthrough_paper' | 'funding_opportunity' | 'collaboration_lead') => {
    posthog?.capture('research_discovery_identified', {
      discovery_type: discoveryType,
    })
  }, [posthog])

  const trackContentEngagement = useCallback((engagementType: 'time_spent' | 'bookmark' | 'share', metadata?: Record<string, any>) => {
    posthog?.capture('content_engagement', {
      engagement_type: engagementType,
      ...metadata,
    })
  }, [posthog])

  // Favourites tracking - stabilized with useCallback
  const trackItemFavourited = useCallback((itemId: string, itemType: string, itemTitle: string) => {
    posthog?.capture('item_favourited', {
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
    })
  }, [posthog])

  const trackItemUnfavourited = useCallback((itemId: string, itemType: string, itemTitle: string) => {
    posthog?.capture('item_unfavourited', {
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
    })
  }, [posthog])

  const trackFavouritesViewed = useCallback((favouritesCount: number) => {
    posthog?.capture('favourites_viewed', {
      favourites_count: favouritesCount,
    })
  }, [posthog])

  // Error tracking - stabilized to prevent excessive calls
  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    posthog?.capture('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      page_url: getCurrentUrl(),
      ...context,
    })
  }, [posthog])

  // Generic event tracking - stabilized with useCallback
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    posthog?.capture(eventName, {
      page_url: getCurrentUrl(),
      ...properties,
    })
  }, [posthog])

  return {
    // Authentication
    trackUserSignup,
    trackUserSignupSuccess,
    trackUserLogin,
    trackUserLoginSuccess,
    trackUserLogout,

    // Password Reset
    trackPasswordResetRequested,
    trackPasswordResetSubmitted,
    trackPasswordResetCompleted,

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

