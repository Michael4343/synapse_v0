'use client'

import { useState } from 'react'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface KeywordSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (keywords: string) => void
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keywords.trim()) return

    tracking.trackEvent('keyword_search_initiated', {
      keywords: keywords.trim(),
      keywords_length: keywords.trim().length
    })

    onSearch(keywords.trim())
    setKeywords('')
  }

  const handleClose = () => {
    setKeywords('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-6 border w-full max-w-md sm:w-96 shadow-lg rounded-lg bg-white m-4 sm:m-0">
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