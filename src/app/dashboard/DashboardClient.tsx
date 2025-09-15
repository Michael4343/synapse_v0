'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/utils/supabase/client'
import { FeedItem as FeedItemType } from '@/types/database'
import KeywordSearchModal from '@/components/KeywordSearchModal'
import FeedItem from '@/components/FeedItem'
import RefreshFeedButton from '@/components/RefreshFeedButton'
import FeedSidebar from '@/components/FeedSidebar'

interface DashboardClientProps {
  user: any
  feedItems: any[] | null
  groupedItems: Record<string, any[]>
  children: React.ReactNode
}

export default function DashboardClient({ user, feedItems, groupedItems, children }: DashboardClientProps) {
  const tracking = usePostHogTracking()
  const { keywordSearch, isGeneratingFeed } = useProfile()
  const router = useRouter()
  const [showKeywordSearch, setShowKeywordSearch] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [sessionFeedItems, setSessionFeedItems] = useState<FeedItemType[]>([])
  const [sessionGroupedItems, setSessionGroupedItems] = useState<Record<string, FeedItemType[]>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null)

  const supabase = createClient()

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

  const loadSessionFeedItems = async (sessionId: number) => {
    try {
      setIsLoadingSession(true)
      setSessionLoadError(null)

      // Debug: Check what items exist for this session
      const { data: items, error } = await supabase
        .from('feed_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      console.log(`Loading session ${sessionId}: found ${items?.length || 0} items`, items)

      if (error) {
        console.error('Failed to load session feed items:', error)
        setSessionLoadError('Failed to load session content')
        return
      }

      // Debug: Also check if there are any unlinked items we could show
      const { data: allItems } = await supabase
        .from('feed_items')
        .select('id, created_at, session_id, title')
        .order('created_at', { ascending: false })
        .limit(10)

      console.log('Recent feed items (with session_id):', allItems)

      const typedItems = items as FeedItemType[]

      // If no items found for this session, check if there are unlinked items we could show
      if (typedItems.length === 0) {
        console.log('No items found for session, checking for unlinked items created around session time')

        // Get session details to find items created around the same time
        const { data: sessionInfo } = await supabase
          .from('feed_sessions')
          .select('created_at')
          .eq('id', sessionId)
          .single()

        if (sessionInfo) {
          const sessionDate = new Date(sessionInfo.created_at)
          const timeBefore = new Date(sessionDate.getTime() - 10 * 60 * 1000) // 10 minutes before
          const timeAfter = new Date(sessionDate.getTime() + 30 * 60 * 1000)  // 30 minutes after

          const { data: nearbyItems } = await supabase
            .from('feed_items')
            .select('*')
            .is('session_id', null)
            .gte('created_at', timeBefore.toISOString())
            .lte('created_at', timeAfter.toISOString())
            .order('created_at', { ascending: false })

          if (nearbyItems && nearbyItems.length > 0) {
            console.log(`Found ${nearbyItems.length} unlinked items created around session time, linking them`)

            // Link these items to this session
            await supabase
              .from('feed_items')
              .update({ session_id: sessionId })
              .in('id', nearbyItems.map(item => item.id))

            // Use these items for display
            setSessionFeedItems(nearbyItems as FeedItemType[])

            // Group the nearby items
            const nearbyGrouped = (nearbyItems as FeedItemType[]).reduce((acc, item) => {
              const type = item.item_type
              if (!acc[type]) {
                acc[type] = []
              }
              acc[type].push(item)
              return acc
            }, {} as Record<string, FeedItemType[]>)

            setSessionGroupedItems(nearbyGrouped)
            return
          }
        }
      }

      setSessionFeedItems(typedItems)

      // Group items by type
      const grouped = typedItems.reduce((acc, item) => {
        const type = item.item_type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(item)
        return acc
      }, {} as Record<string, FeedItemType[]>)

      setSessionGroupedItems(grouped)

      tracking.trackEvent('feed_session_loaded_success', {
        session_id: sessionId,
        items_count: typedItems.length
      })
    } catch (err) {
      console.error('Failed to load session items:', err)
      setSessionLoadError('An error occurred while loading session content')
      tracking.trackError('feed_session_load_failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoadingSession(false)
    }
  }

  const handleSessionChange = (sessionId: number | null) => {
    setActiveSessionId(sessionId)
    setSessionLoadError(null)
    if (sessionId) {
      loadSessionFeedItems(sessionId)
    } else {
      // Reset to current feed
      setSessionFeedItems([])
      setSessionGroupedItems({})
      setIsLoadingSession(false)
    }
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleKeywordSearch = async (keywords: string) => {
    try {
      const startTime = Date.now()
      const result = await keywordSearch(keywords)
      const endTime = Date.now()
      setShowKeywordSearch(false)

      tracking.trackEvent('keyword_search_completed', {
        keywords: keywords,
        results_count: result.itemsGenerated || 0,
        generation_time: endTime - startTime
      })

      // Refresh the page to show the new feed that replaces the current one
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Keyword search failed:', error)
      tracking.trackEvent('keyword_search_failed', {
        keywords: keywords,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleKeywordSearchOpen = () => {
    tracking.trackEvent('keyword_search_modal_opened')
    setShowKeywordSearch(true)
  }

  // Determine which feed data to display
  const displayFeedItems = activeSessionId ? sessionFeedItems : (feedItems || [])
  const displayGroupedItems = activeSessionId ? sessionGroupedItems : groupedItems

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <FeedSidebar
          activeSessionId={activeSessionId}
          onSessionChange={handleSessionChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
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
                      {activeSessionId && (
                        <p className="text-xs text-indigo-600 mt-1">
                          Viewing historical feed
                        </p>
                      )}
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

                  {/* Main feed section */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {activeSessionId ? 'Historical Feed' : 'Latest Research Feed'}
                      </h2>
                      <span className="ml-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {activeSessionId ? 'Archived' : 'Current'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      {activeSessionId
                        ? 'Previously generated content from your feed history'
                        : 'Your most recent feed generation - either from profile refresh or keyword search'
                      }
                    </p>

                    {isLoadingSession ? (
                      <div className="text-center py-12">
                        <div className="animate-spin mx-auto h-8 w-8 border-2 border-gray-300 border-t-indigo-600 rounded-full mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Loading session content...
                        </h3>
                        <p className="text-gray-500">
                          Please wait while we retrieve your historical feed
                        </p>
                      </div>
                    ) : sessionLoadError ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Failed to load session
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {sessionLoadError}
                        </p>
                        <button
                          onClick={() => activeSessionId && loadSessionFeedItems(activeSessionId)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Try again
                        </button>
                      </div>
                    ) : displayFeedItems && displayFeedItems.length > 0 ? (
                      <div className="space-y-8">
                        {Object.entries(displayGroupedItems).map(([itemType, items]) => {
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
                          {activeSessionId ? 'No items in this session' : 'No feed items yet'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {activeSessionId
                            ? 'This historical feed appears to be empty.'
                            : 'Your personalised feed will appear here once generated.'
                          }
                        </p>
                        {!activeSessionId && <RefreshFeedButton />}
                      </div>
                    )}
                  </div>


                </div>
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