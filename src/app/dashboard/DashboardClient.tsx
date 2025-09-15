'use client'

import { useEffect, useState } from 'react'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import { useProfile } from '@/hooks/useProfile'
import KeywordSearchModal from '@/components/KeywordSearchModal'
import SearchResultsSection from '@/components/SearchResultsSection'
import FeedItem from '@/components/FeedItem'
import RefreshFeedButton from '@/components/RefreshFeedButton'

interface DashboardClientProps {
  user: any
  feedItems: any[] | null
  groupedItems: Record<string, any[]>
  children: React.ReactNode
}

export default function DashboardClient({ user, feedItems, groupedItems, children }: DashboardClientProps) {
  const tracking = usePostHogTracking()
  const { keywordSearch, isGeneratingFeed } = useProfile()
  const [showKeywordSearch, setShowKeywordSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [lastSearchKeywords, setLastSearchKeywords] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    if (user) {
      // Track successful authentication when user lands on dashboard
      const urlParams = new URLSearchParams(window.location.search)
      const isNewLogin = urlParams.get('from') === 'login' || window.sessionStorage.getItem('just_logged_in')

      if (isNewLogin) {
        tracking.trackUserLoginSuccess(user.id, 'email')
        window.sessionStorage.removeItem('just_logged_in')
      }

      // Track feed category interactions
      if (feedItems && feedItems.length > 0) {
        Object.entries(groupedItems).forEach(([categoryType, items]) => {
          tracking.trackFeedCategoryInteraction(categoryType, items.length)
        })
      }
    }
  }, [user, feedItems, groupedItems, tracking])

  const handleKeywordSearch = async (keywords: string) => {
    try {
      setLastSearchKeywords(keywords)
      const result = await keywordSearch(keywords)
      setSearchResults(result.data)
      setShowSearchResults(true)
      setShowKeywordSearch(false)

      tracking.trackEvent('keyword_search_completed', {
        keywords: keywords,
        results_count: result.resultsGenerated || 0
      })
    } catch (error) {
      console.error('Keyword search failed:', error)
      tracking.trackEvent('keyword_search_failed', {
        keywords: keywords,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleClearSearchResults = () => {
    setSearchResults(null)
    setShowSearchResults(false)
    setLastSearchKeywords('')
  }

  const handleKeywordSearchOpen = () => {
    tracking.trackEvent('keyword_search_modal_opened')
    setShowKeywordSearch(true)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg">
              <div className="p-6">
                {/* Header with dual search options */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Your Research Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Welcome, {user.email}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Keyword Search Button */}
                    <button
                      onClick={handleKeywordSearchOpen}
                      className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Keyword Search
                    </button>
                    {children}
                  </div>
                </div>

                {/* Profile-based feed section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Your Personalized Feed
                    </h2>
                    <span className="ml-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Profile-Based
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Curated content based on your research profile and expertise
                  </p>

                  {feedItems && feedItems.length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(groupedItems).map(([itemType, items]) => {
                        const typedItems = items as any[]
                        const categoryDisplayNames: Record<string, string> = {
                          'breakthrough_publications': 'Breakthrough Publications',
                          'emerging_technologies': 'Emerging Technologies',
                          'strategic_funding': 'Strategic Funding',
                          'field_intelligence': 'Field Intelligence',
                          'trending_science_news': 'Trending Science'
                        }
                        const categoryName = categoryDisplayNames[itemType] || itemType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

                        return (
                          <div key={itemType} className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                              {categoryName} ({typedItems.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                              {typedItems.map((item) => (
                                <FeedItem key={item.id} item={item} />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No feed items yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Your personalised feed will appear here once generated.
                      </p>
                      <RefreshFeedButton />
                    </div>
                  )}
                </div>

                {/* Keyword search results section */}
                <SearchResultsSection
                  searchData={searchResults}
                  keywords={lastSearchKeywords}
                  isVisible={showSearchResults}
                  onClear={handleClearSearchResults}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Search Modal */}
      <KeywordSearchModal
        isOpen={showKeywordSearch}
        onClose={() => setShowKeywordSearch(false)}
        onSearch={handleKeywordSearch}
        isSearching={isGeneratingFeed}
      />
    </>
  )
}