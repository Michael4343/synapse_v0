'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import { useProfile } from '@/hooks/useProfile'
import { useFavourites } from '@/hooks/useFavourites'
import { createClient } from '@/utils/supabase/client'
import { FeedItem as FeedItemType } from '@/types/database'
import KeywordSearchModal from '@/components/KeywordSearchModal'
import FeedItem from '@/components/FeedItem'
import RefreshFeedButton from '@/components/RefreshFeedButton'
import FeedSidebar from '@/components/FeedSidebar'
import ChangePasswordModal from '@/components/ChangePasswordModal'

interface DashboardClientProps {
  user: any
  feedItems: any[] | null
  groupedItems: Record<string, any[]>
  children: React.ReactNode
  changePassword: (newPassword: string) => Promise<void>
}

export default function DashboardClient({ user, feedItems, groupedItems, children, changePassword }: DashboardClientProps) {
  const tracking = usePostHogTracking()
  const { keywordSearch, isGeneratingFeed } = useProfile()
  const { getFavouritedItems } = useFavourites()
  const router = useRouter()
  const [showKeywordSearch, setShowKeywordSearch] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [sessionFeedItems, setSessionFeedItems] = useState<FeedItemType[]>([])
  const [sessionGroupedItems, setSessionGroupedItems] = useState<Record<string, FeedItemType[]>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showFavourites, setShowFavourites] = useState(false)
  const [favouriteFeedItems, setFavouriteFeedItems] = useState<FeedItemType[]>([])
  const [favouriteGroupedItems, setFavouriteGroupedItems] = useState<Record<string, FeedItemType[]>>({})
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [sessionLoadError, setSessionLoadError] = useState<string | null>(null)

  const supabase = createClient()

  const loadFavouriteItems = async () => {
    try {
      setIsLoadingSession(true)
      setSessionLoadError(null)

      const favouritedItems = await getFavouritedItems()
      setFavouriteFeedItems(favouritedItems)

      // Group favourite items by type
      const grouped = favouritedItems.reduce((acc, item) => {
        const type = item.item_type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(item)
        return acc
      }, {} as Record<string, FeedItemType[]>)

      setFavouriteGroupedItems(grouped)

      tracking.trackFavouritesViewed(favouritedItems.length)
    } catch (err) {
      console.error('Failed to load favourite items:', err)
      setSessionLoadError('Failed to load favourites')
      tracking.trackError('favourites_load_failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoadingSession(false)
    }
  }

  useEffect(() => {
    if (user) {
      // Track successful authentication when user lands on dashboard
      const urlParams = new URLSearchParams(window.location.search)
      const isNewLogin = urlParams.get('from') === 'login' || window.sessionStorage.getItem('just_logged_in')

      if (isNewLogin) {
        tracking.trackUserLoginSuccess(user.id, 'email')
        window.sessionStorage.removeItem('just_logged_in')
      }
    }
  }, [user])

  // Separate useEffect for feed category tracking to prevent excessive events
  useEffect(() => {
    if (user && feedItems && feedItems.length > 0) {
      Object.entries(groupedItems).forEach(([categoryType, items]) => {
        tracking.trackFeedCategoryInteraction(categoryType, items.length)
      })
    }
  }, [user, feedItems, groupedItems])

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

  const handleSessionChange = (sessionId: number) => {
    setActiveSessionId(sessionId)
    setSessionLoadError(null)
    setShowFavourites(false) // Reset favourites view when switching sessions
    loadSessionFeedItems(sessionId)
  }

  const handleFavouritesToggle = () => {
    const newShowFavourites = !showFavourites
    setShowFavourites(newShowFavourites)

    if (newShowFavourites) {
      setActiveSessionId(null) // Reset session view when viewing favourites
      loadFavouriteItems()
    } else {
      // Reset favourites view and return to latest session
      setFavouriteFeedItems([])
      setFavouriteGroupedItems({})
      setIsLoadingSession(false)
      setSessionLoadError(null)
      // Auto-load latest session when leaving favourites view
      if (!activeSessionId) {
        // Need to get latest session from the sidebar - this will be handled by the sidebar's auto-selection
      }
    }

    tracking.trackEvent('favourites_view_toggled', {
      showing_favourites: newShowFavourites
    })
  }

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleKeywordSearch = async (keywords: string, preferences?: any) => {
    try {
      const startTime = Date.now()
      const result = await keywordSearch(keywords, preferences)
      const endTime = Date.now()
      setShowKeywordSearch(false)

      tracking.trackEvent('keyword_search_completed', {
        keywords: keywords,
        results_count: result.itemsGenerated || 0,
        generation_time: endTime - startTime,
        categories_enabled: preferences?.categories ? Object.values(preferences.categories).filter(Boolean).length : 4,
        total_items: preferences?.itemsPerCategory || 4
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

  const handleAddSource = () => {
    alert('Add Source feature coming soon! This will allow you to manually add URLs of research papers, patents, or other sources you\'re interested in.')
  }

  const handlePasswordChange = async (newPassword: string) => {
    setIsChangingPassword(true)
    try {
      await changePassword(newPassword)
      // The server action will redirect to login page, so this won't be reached
    } catch (error) {
      setIsChangingPassword(false)
      throw error // Let the modal handle the error display
    }
  }

  // Add click listener for password change button
  useEffect(() => {
    const handlePasswordChangeClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-change-password-trigger]')) {
        setShowChangePassword(true)
        tracking.trackEvent('change_password_modal_opened')
      }
    }

    document.addEventListener('click', handlePasswordChangeClick)
    return () => document.removeEventListener('click', handlePasswordChangeClick)
  }, [])

  // Determine which feed data to display
  const displayFeedItems = showFavourites
    ? favouriteFeedItems
    : sessionFeedItems
  const displayGroupedItems = showFavourites
    ? favouriteGroupedItems
    : sessionGroupedItems

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <FeedSidebar
          activeSessionId={activeSessionId}
          onSessionChange={handleSessionChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          showFavourites={showFavourites}
          onFavouritesToggle={handleFavouritesToggle}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto py-3 md:py-6 px-4 sm:px-6 lg:px-8">
            <div className="md:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg">
                <div className="p-3 md:p-6">
                  {/* Header with responsive layout */}
                  <div className="mb-6">
                    {/* Mobile hamburger and title */}
                    <div className="flex items-center justify-between mb-4 md:hidden">
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                      >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                      <div className="w-10"></div> {/* Spacer for centering */}
                    </div>

                    {/* Desktop header */}
                    <div className="hidden md:flex justify-between items-center mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          Your Research Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                          Welcome, {user.email}
                        </p>
                        {showFavourites && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Viewing favourites
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Search Button */}
                        <button
                          onClick={handleKeywordSearchOpen}
                          className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search
                        </button>

                        {/* Add Button */}
                        <button
                          onClick={handleAddSource}
                          className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add
                        </button>

                        {children}
                      </div>
                    </div>

                    {/* Mobile action buttons */}
                    <div className="flex flex-col space-y-3 md:hidden">
                      {/* User info on mobile */}
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          Welcome, {user.email}
                        </p>
                        {showFavourites && (
                          <p className="text-xs text-yellow-600">
                            Viewing favourites
                          </p>
                        )}
                      </div>

                      {/* Buttons row */}
                      <div className="flex space-x-2">
                        <button
                          onClick={handleKeywordSearchOpen}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search
                        </button>

                        <button
                          onClick={handleAddSource}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add
                        </button>
                      </div>

                      {/* Refresh button on mobile */}
                      <div className="flex justify-center">
                        {children}
                      </div>
                    </div>
                  </div>

                  {/* Main feed section */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {showFavourites ? 'Favourite Items' : 'Research Feed'}
                      </h2>
                      {showFavourites && (
                        <span className="ml-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Favourites
                        </span>
                      )}
                    </div>

                    {isLoadingSession ? (
                      <div className="text-center py-12">
                        <div className="animate-spin mx-auto h-8 w-8 border-2 border-gray-300 border-t-indigo-600 rounded-full mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Loading session content...
                        </h3>
                        <p className="text-gray-500">
                          Please wait while we retrieve your previous session
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
                              <div className="grid gap-4 lg:grid-cols-2">
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
                          {showFavourites
                            ? 'No favourite items yet'
                            : 'No feed items yet'
                          }
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {showFavourites
                            ? 'Items you favourite will appear here. Click the star icon on any feed item to add it to your favourites.'
                            : 'Your personalised feed will appear here once generated.'
                          }
                        </p>
                        {!showFavourites && <RefreshFeedButton />}
                      </div>
                    )}
                  </div>


                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <KeywordSearchModal
        isOpen={showKeywordSearch}
        onClose={() => setShowKeywordSearch(false)}
        onSearch={handleKeywordSearch}
        isSearching={isGeneratingFeed}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onPasswordChange={handlePasswordChange}
        isChanging={isChangingPassword}
      />
    </>
  )
}