'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

export default function RefreshFeedButton() {
  const { generateFeed, isGeneratingFeed, error } = useProfile()
  const tracking = usePostHogTracking()
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    try {
      setSuccess(false)
      tracking.trackFeedRefreshClicked()

      const startTime = Date.now()
      await generateFeed()
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
        window.location.reload()
      }, 1000)

    } catch (err) {
      console.error('Failed to refresh feed:', err)
      tracking.trackError('feed_refresh_failed', err instanceof Error ? err.message : 'Unknown feed refresh error')
    }
  }

  if (success) {
    return (
      <button
        disabled
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Success
      </button>
    )
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isGeneratingFeed}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGeneratingFeed ? (
        <>
          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          Loading
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Update
        </>
      )}
    </button>
  )
}