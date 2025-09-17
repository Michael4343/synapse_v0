'use client'

import { useState } from 'react'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import { CategoryPreferences, SearchPreferences } from '@/types/database'

interface KeywordSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (keywords: string, preferences?: SearchPreferences) => void
  isSearching?: boolean
}

export default function KeywordSearchModal({
  isOpen,
  onClose,
  onSearch,
  isSearching = false
}: KeywordSearchModalProps) {
  const tracking = usePostHogTracking()
  const [keywords, setKeywords] = useState('')
  const [searchPreferences, setSearchPreferences] = useState<SearchPreferences>({
    categories: {
      publications: true,
      patents: true,
      funding_opportunities: true,
      trending_science_news: true
    },
    itemsPerCategory: 4,
    timeRange: 'last_3_months',
    impactLevel: 'all'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keywords.trim()) return

    tracking.trackEvent('keyword_search_initiated', {
      keywords: keywords.trim(),
      keywords_length: keywords.trim().length,
      categories_enabled: Object.values(searchPreferences.categories).filter(Boolean).length,
      total_items: searchPreferences.itemsPerCategory,
      time_range: searchPreferences.timeRange,
      impact_level: searchPreferences.impactLevel
    })

    onSearch(keywords.trim(), searchPreferences)
    setKeywords('')
  }

  const handleCategoryChange = (category: keyof CategoryPreferences) => {
    setSearchPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category]
      }
    }))
  }

  const handleClose = () => {
    setKeywords('')
    onClose()
  }

  const categoryLabels = {
    publications: 'Publications',
    patents: 'Patents',
    funding_opportunities: 'Funding',
    trending_science_news: 'News'
  }

  const timeRangeOptions = [
    { value: 'last_month', label: 'Last month' },
    { value: 'last_3_months', label: 'Last 3 months' },
    { value: 'last_6_months', label: 'Last 6 months' },
    { value: 'last_year', label: 'Last year' }
  ]

  const impactLevelOptions = [
    { value: 'all', label: 'All sources' },
    { value: 'high_impact', label: 'High-impact only' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-4 sm:pt-20">
      <div className="relative p-4 sm:p-6 border w-full max-w-md sm:w-96 shadow-lg rounded-lg bg-white mx-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Search
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter search keywords..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base min-h-[48px]"
              disabled={isSearching}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Include in results:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={searchPreferences.categories[key as keyof CategoryPreferences]}
                    onChange={() => handleCategoryChange(key as keyof CategoryPreferences)}
                    disabled={isSearching}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Total items: {searchPreferences.itemsPerCategory}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={searchPreferences.itemsPerCategory}
              onChange={(e) => setSearchPreferences(prev => ({
                ...prev,
                itemsPerCategory: parseInt(e.target.value)
              }))}
              disabled={isSearching}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Distributed across selected categories
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Time range:
              </label>
              <select
                value={searchPreferences.timeRange}
                onChange={(e) => setSearchPreferences(prev => ({
                  ...prev,
                  timeRange: e.target.value
                }))}
                disabled={isSearching}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Quality level:
              </label>
              <select
                value={searchPreferences.impactLevel}
                onChange={(e) => setSearchPreferences(prev => ({
                  ...prev,
                  impactLevel: e.target.value
                }))}
                disabled={isSearching}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {impactLevelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px]"
              disabled={isSearching}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!keywords.trim() || isSearching}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}