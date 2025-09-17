'use client'

import { useCallback } from 'react'
import { usePostHog } from '@/providers/PostHogProvider'

// Helper to safely get current URL (prevents hydration issues)
const getCurrentUrl = () => typeof window !== 'undefined' ? window.location.href : ''

export function usePostHogTracking() {
  const posthog = usePostHog()

  // Safe tracking wrapper with error handling
  const safeTrack = useCallback((eventName: string, properties?: Record<string, any>) => {
    try {
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture(eventName, properties)
      } else {
        console.warn('PostHog not available for tracking:', eventName)
      }
    } catch (error) {
      console.error('PostHog tracking error:', error, { eventName, properties })
    }
  }, [posthog])

  // Authentication tracking - using useCallback to prevent object recreation
  const trackUserSignup = useCallback((method: 'email' | 'google' = 'email') => {
    safeTrack('user_signup_attempted', {
      signup_method: method,
      page_url: getCurrentUrl(),
    })
  }, [safeTrack])

  const trackUserSignupSuccess = useCallback((userId: string, method: 'email' | 'google' = 'email') => {
    try {
      posthog?.identify(userId)
      safeTrack('user_signup_completed', {
        signup_method: method,
        user_id: userId,
      })
    } catch (error) {
      console.error('PostHog identify error:', error)
    }
  }, [posthog, safeTrack])

  const trackUserLogin = useCallback((method: 'email' | 'google' = 'email') => {
    safeTrack('user_login_attempted', {
      login_method: method,
      page_url: getCurrentUrl(),
    })
  }, [safeTrack])

  const trackUserLoginSuccess = useCallback((userId: string, method: 'email' | 'google' = 'email') => {
    try {
      posthog?.identify(userId)
      safeTrack('user_login_completed', {
        login_method: method,
        user_id: userId,
      })
    } catch (error) {
      console.error('PostHog identify error:', error)
    }
  }, [posthog, safeTrack])

  const trackUserLogout = useCallback(() => {
    safeTrack('user_logout_completed')
    try {
      posthog?.reset()
    } catch (error) {
      console.error('PostHog reset error:', error)
    }
  }, [posthog, safeTrack])

  // Password reset tracking
  const trackPasswordResetRequested = useCallback((email: string) => {
    safeTrack('password_reset_requested', {
      email_domain: email.split('@')[1] || 'unknown',
      page_url: getCurrentUrl(),
    })
  }, [safeTrack])

  const trackPasswordResetSubmitted = useCallback(() => {
    safeTrack('password_reset_submitted', {
      page_url: getCurrentUrl(),
    })
  }, [safeTrack])

  const trackPasswordResetCompleted = useCallback(() => {
    safeTrack('password_reset_completed', {
      page_url: getCurrentUrl(),
    })
  }, [safeTrack])

  // Onboarding tracking - stabilized with useCallback
  const trackOnboardingStarted = useCallback(() => {
    safeTrack('onboarding_started')
  }, [safeTrack])

  const trackUrlSubmitted = useCallback((url: string, urlType: string) => {
    safeTrack('onboarding_url_submitted', {
      submitted_url: url,
      url_type: urlType,
      url_domain: new URL(url).hostname,
    })
  }, [safeTrack])

  const trackProfileGenerationStarted = useCallback(() => {
    safeTrack('profile_generation_started')
  }, [safeTrack])

  const trackProfileGenerationCompleted = useCallback((durationMs: number, profileLength: number) => {
    safeTrack('profile_generation_completed', {
      generation_duration_ms: durationMs,
      profile_text_length: profileLength,
    })
  }, [safeTrack])

  const trackOnboardingCompleted = useCallback(() => {
    safeTrack('onboarding_completed')
  }, [safeTrack])

  // Dashboard tracking - stabilized with useCallback
  const trackFeedRefreshClicked = useCallback(() => {
    safeTrack('feed_refresh_clicked')
  }, [safeTrack])

  const trackFeedRefreshCompleted = useCallback((itemCount: number, categories: string[], durationMs: number) => {
    safeTrack('feed_refresh_completed', {
      feed_item_count: itemCount,
      feed_categories: categories,
      generation_duration_ms: durationMs,
    })
  }, [safeTrack])

  const trackFeedItemClicked = useCallback((itemId: string, itemType: string, title: string, source?: string) => {
    safeTrack('feed_item_clicked', {
      item_id: itemId,
      item_type: itemType,
      item_title: title,
      item_source: source,
    })
  }, [safeTrack])

  const trackFeedItemExpanded = useCallback((itemId: string, itemType: string) => {
    safeTrack('feed_item_expanded', {
      item_id: itemId,
      item_type: itemType,
    })
  }, [safeTrack])

  const trackFeedCategoryInteraction = useCallback((categoryType: string, itemCount: number) => {
    safeTrack('feed_category_viewed', {
      category_type: categoryType,
      category_item_count: itemCount,
    })
  }, [safeTrack])

  // Research-specific tracking - stabilized with useCallback
  const trackResearchDiscovery = useCallback((discoveryType: 'breakthrough_paper' | 'funding_opportunity' | 'collaboration_lead') => {
    safeTrack('research_discovery_identified', {
      discovery_type: discoveryType,
    })
  }, [safeTrack])

  const trackContentEngagement = useCallback((engagementType: 'time_spent' | 'bookmark' | 'share', metadata?: Record<string, any>) => {
    safeTrack('content_engagement', {
      engagement_type: engagementType,
      ...metadata,
    })
  }, [safeTrack])

  // Favourites tracking - stabilized with useCallback
  const trackItemFavourited = useCallback((itemId: string, itemType: string, itemTitle: string) => {
    safeTrack('item_favourited', {
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
    })
  }, [safeTrack])

  const trackItemUnfavourited = useCallback((itemId: string, itemType: string, itemTitle: string) => {
    safeTrack('item_unfavourited', {
      item_id: itemId,
      item_type: itemType,
      item_title: itemTitle,
    })
  }, [safeTrack])

  const trackFavouritesViewed = useCallback((favouritesCount: number) => {
    safeTrack('favourites_viewed', {
      favourites_count: favouritesCount,
    })
  }, [safeTrack])

  // Error tracking - stabilized to prevent excessive calls
  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) => {
    safeTrack('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      page_url: getCurrentUrl(),
      ...context,
    })
  }, [safeTrack])

  // Generic event tracking - stabilized with useCallback
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    safeTrack(eventName, {
      page_url: getCurrentUrl(),
      ...properties,
    })
  }, [safeTrack])

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

