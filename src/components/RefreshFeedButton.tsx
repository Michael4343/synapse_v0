'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import { createClient } from '@/utils/supabase/client'
import FeedSettingsModal from './FeedSettingsModal'

interface FeedPreferences {
  keywords: string
  categories: {
    publications: boolean
    patents: boolean
    funding_opportunities: boolean
    trending_science_news: boolean
  }
}

export default function RefreshFeedButton() {
  const { generateFeed, isGeneratingFeed, error } = useProfile()
  const tracking = usePostHogTracking()
  const [success, setSuccess] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [preferences, setPreferences] = useState<FeedPreferences | null>(null)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load user preferences on component mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setIsLoadingPreferences(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('feed_preferences')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.warn('Feed preferences column may not exist yet:', error)
        // Set default preferences if column doesn't exist
        const defaultPrefs: FeedPreferences = {
          keywords: '',
          categories: {
            publications: true,
            patents: true,
            funding_opportunities: true,
            trending_science_news: true
          }
        }
        setPreferences(defaultPrefs)
        return
      }

      if (profile?.feed_preferences) {
        setPreferences(profile.feed_preferences as FeedPreferences)
      } else {
        // Set default preferences
        const defaultPrefs: FeedPreferences = {
          keywords: '',
          categories: {
            publications: true,
            patents: true,
            funding_opportunities: true,
            trending_science_news: true
          }
        }
        setPreferences(defaultPrefs)
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
      // Set default preferences on any error
      const defaultPrefs: FeedPreferences = {
        keywords: '',
        categories: {
          publications: true,
          patents: true,
          funding_opportunities: true,
          trending_science_news: true
        }
      }
      setPreferences(defaultPrefs)
    } finally {
      setIsLoadingPreferences(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setSuccess(false)
      tracking.trackFeedRefreshClicked()

      const startTime = Date.now()
      await generateFeed(preferences || undefined)
      const endTime = Date.now()

      setSuccess(true)

      // Track feed refresh completion (we'll get more details from the page refresh)
      tracking.trackFeedRefreshCompleted(
        0, // We don't have item count here
        [], // We don't have categories here
        endTime - startTime
      )

      // Refresh the page to show new items and reset success state
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 1000)

    } catch (err) {
      console.error('Failed to refresh feed:', err)
      tracking.trackError('feed_refresh_failed', err instanceof Error ? err.message : 'Unknown feed refresh error')
    }
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true)
    tracking.trackEvent('feed_settings_opened')
  }

  const handleSettingsSave = (newPreferences: FeedPreferences) => {
    setPreferences(newPreferences)
    tracking.trackEvent('feed_settings_updated', {
      keywords_length: newPreferences.keywords.length,
      categories_enabled: Object.values(newPreferences.categories).filter(Boolean).length
    })
  }

  if (success) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">Feed updated successfully!</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleRefresh}
          disabled={isGeneratingFeed || isLoadingPreferences}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingFeed ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Refreshing...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Feed
            </>
          )}
        </button>

        <button
          onClick={handleSettingsClick}
          disabled={isLoadingPreferences}
          className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          title="Feed Settings"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <FeedSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        currentPreferences={preferences || undefined}
      />
    </>
  )
}