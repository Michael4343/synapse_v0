'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { FeedSession } from '@/types/database'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'
import FeedHistoryItem from './FeedHistoryItem'

interface FeedSidebarProps {
  activeSessionId: number | null
  onSessionChange: (sessionId: number) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  showFavourites: boolean
  onFavouritesToggle: () => void
}

export default function FeedSidebar({
  activeSessionId,
  onSessionChange,
  isCollapsed,
  onToggleCollapse,
  showFavourites,
  onFavouritesToggle
}: FeedSidebarProps) {
  const [sessions, setSessions] = useState<FeedSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const tracking = usePostHogTracking()
  const supabase = createClient()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const { data: sessions, error } = await supabase
        .from('feed_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load feed sessions:', error)
        return
      }

      console.log('Loaded feed sessions:', sessions)
      setSessions(sessions || [])

      // Auto-select the latest session if no session is currently active
      if (sessions && sessions.length > 0 && activeSessionId === null) {
        const latestSession = sessions[0] // Sessions are ordered by created_at desc
        onSessionChange(latestSession.id)
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionClick = (sessionId: number) => {
    onSessionChange(sessionId)
    // Auto-close sidebar on mobile after session selection
    if (window.innerWidth < 768) {
      onToggleCollapse()
    }
  }


  const handleFavouritesClick = () => {
    onFavouritesToggle()
    tracking.trackEvent('favourites_clicked')
    // Auto-close sidebar on mobile after favourites selection
    if (window.innerWidth < 768) {
      onToggleCollapse()
    }
  }

  const handleToggleCollapse = () => {
    onToggleCollapse()
    tracking.trackEvent('sidebar_toggled', { collapsed: !isCollapsed })
  }

  if (isCollapsed) {
    return (
      <div className="hidden md:flex w-12 bg-gray-50 border-r border-gray-200 flex-col">
        <button
          onClick={handleToggleCollapse}
          className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Expand sidebar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Favourites indicator */}
        <div className="px-2 py-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400" title="Favourites"></div>
        </div>

        {sessions.slice(0, 5).map((session) => (
          <div key={session.id} className="px-2 py-1">
            <div className={`w-2 h-2 rounded-full ${
              activeSessionId === session.id ? 'bg-indigo-600' : 'bg-gray-300'
            }`} title={session.title}></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 md:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isCollapsed ? 'hidden' : 'fixed md:relative'}
        md:flex w-80 bg-gray-50 border-r border-gray-200 flex-col h-full
        ${!isCollapsed ? 'z-50' : ''}
        ${!isCollapsed && 'md:z-auto'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Feed History</h2>
            <button
              onClick={handleToggleCollapse}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Collapse sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>


        {/* Favourites */}
        <div
          onClick={handleFavouritesClick}
          className={`relative p-4 border-b border-gray-200 cursor-pointer transition-colors min-h-[60px] flex items-center ${
            showFavourites
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 ${showFavourites ? 'text-yellow-600' : 'text-yellow-500'}`}>
              <svg className="h-6 w-6" fill={showFavourites ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${
                showFavourites ? 'text-yellow-900' : 'text-gray-900'
              }`}>
                Favourites
              </h3>
              <p className="text-xs text-gray-500">Your saved items</p>
            </div>
          </div>
          {/* Active indicator */}
          {showFavourites && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-600"></div>
          )}
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin mx-auto h-6 w-6 border-2 border-gray-300 border-t-indigo-600 rounded-full mb-2" />
              Loading history...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">No feed history yet</p>
              <p className="text-xs text-gray-400 mt-1">Previous feeds will appear here</p>
            </div>
          ) : (
            <div className="bg-white">
              {sessions.map((session) => (
                <FeedHistoryItem
                  key={session.id}
                  session={session}
                  isActive={activeSessionId === session.id}
                  onClick={handleSessionClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with session count */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-500 text-center">
              {sessions.length} saved {sessions.length === 1 ? 'session' : 'sessions'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}