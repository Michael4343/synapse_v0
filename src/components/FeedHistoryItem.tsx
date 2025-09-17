'use client'

import type { FeedSession } from '@/types/database'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface FeedHistoryItemProps {
  session: FeedSession
  isActive: boolean
  onClick: (sessionId: number) => void
}

export default function FeedHistoryItem({ session, isActive, onClick }: FeedHistoryItemProps) {
  const tracking = usePostHogTracking()

  const handleClick = () => {
    if (!isActive) {
      onClick(session.id)
      tracking.trackEvent('feed_session_switched', {
        session_id: session.id,
        search_type: session.search_type,
        created_at: session.created_at
      })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSearchTypeIcon = () => {
    switch (session.search_type) {
      case 'keyword_search':
        return (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      case 'refresh':
      default:
        return (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative p-3 border-b border-gray-200 cursor-pointer transition-colors ${
        isActive
          ? 'bg-indigo-50 border-indigo-200'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
              {getSearchTypeIcon()}
            </div>
            <h3 className={`text-sm font-medium truncate ${
              isActive ? 'text-indigo-900' : 'text-gray-900'
            }`}>
              {session.title}
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            {formatDate(session.created_at)}
          </p>
        </div>

      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
      )}
    </div>
  )
}