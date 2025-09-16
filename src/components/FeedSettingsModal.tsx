'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface FeedPreferences {
  keywords: string
  categories: {
    publications: boolean
    patents: boolean
    funding_opportunities: boolean
    trending_science_news: boolean
  }
}

interface FeedSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preferences: FeedPreferences) => void
  currentPreferences?: FeedPreferences
}

const defaultPreferences: FeedPreferences = {
  keywords: '',
  categories: {
    publications: true,
    patents: true,
    funding_opportunities: true,
    trending_science_news: true
  }
}

export default function FeedSettingsModal({
  isOpen,
  onClose,
  onSave,
  currentPreferences
}: FeedSettingsModalProps) {
  const [preferences, setPreferences] = useState<FeedPreferences>(
    currentPreferences || defaultPreferences
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const tracking = usePostHogTracking()

  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences)
    }
  }, [currentPreferences])

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      keywords: e.target.value
    }))
  }

  const handleCategoryChange = (category: keyof FeedPreferences['categories']) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      tracking.trackEvent('feed_settings_save_attempted', {
        keywords_length: preferences.keywords.length,
        categories_enabled: Object.values(preferences.categories).filter(Boolean).length
      })

      // Save to database
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ feed_preferences: preferences })
        .eq('id', session.user.id)

      if (updateError) {
        throw new Error('Failed to save preferences')
      }

      tracking.trackEvent('feed_settings_saved', {
        keywords_length: preferences.keywords.length,
        categories_enabled: Object.values(preferences.categories).filter(Boolean).length
      })

      onSave(preferences)
      onClose()
    } catch (err) {
      console.error('Failed to save preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      tracking.trackError('feed_settings_save_failed', err instanceof Error ? err.message : 'Unknown save error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setPreferences(currentPreferences || defaultPreferences)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  const categoryLabels = {
    publications: 'Research Publications',
    patents: 'Patents',
    funding_opportunities: 'Funding Opportunities',
    trending_science_news: 'Science News'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Feed Settings
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Keywords Input */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Keywords
            </label>
            <input
              id="keywords"
              type="text"
              placeholder="e.g., machine learning, CRISPR, quantum computing"
              value={preferences.keywords}
              onChange={handleKeywordsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              These keywords will be added to your profile to refine search results
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Categories
            </label>
            <div className="space-y-2">
              {Object.entries(categoryLabels).map(([category, label]) => (
                <label key={category} className="flex items-center py-1">
                  <input
                    type="checkbox"
                    checked={preferences.categories[category as keyof FeedPreferences['categories']]}
                    onChange={() => handleCategoryChange(category as keyof FeedPreferences['categories'])}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
          <button
            onClick={handleCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}