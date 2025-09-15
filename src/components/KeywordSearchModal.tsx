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
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Keyword Search
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Pure Exploration:</strong> This search ignores your profile completely and finds content based only on your keywords. Perfect for discovering new research areas!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                Search Keywords
              </label>
              <input
                id="keywords"
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., quantum computing, renewable energy, machine learning"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSearching}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use comma-separated keywords for broader searches
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSearching}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!keywords.trim() || isSearching}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Examples:</strong>
            <ul className="mt-1 space-y-1">
              <li>• "sustainable energy, solar panels" - Energy research</li>
              <li>• "artificial intelligence, healthcare" - AI applications</li>
              <li>• "climate change, carbon capture" - Environmental science</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}