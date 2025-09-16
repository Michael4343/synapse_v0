'use client'

import { FeedItem as FeedItemType } from '@/types/database'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface FeedItemProps {
  item: FeedItemType
}

export default function FeedItem({ item }: FeedItemProps) {
  const tracking = usePostHogTracking()

  // Filter out funding opportunities with past deadlines
  if (item.item_type === 'funding_opportunity' && item.metadata?.deadline) {
    const deadlineDate = new Date(item.metadata.deadline)
    const today = new Date()
    if (deadlineDate <= today) {
      return null // Don't render expired funding opportunities
    }
  }

  const handleItemClick = () => {
    tracking.trackFeedItemClicked(
      String(item.id),
      item.item_type,
      item.title,
      getSourceFromUrl(item.url)
    )
  }

  const handleComingSoonAction = (action: string) => {
    alert(`${action} feature coming soon!`)
  }
  const getBadgeColor = (itemType: string) => {
    switch (itemType) {
      case 'publication':
        return 'bg-blue-100 text-blue-800'
      case 'patent':
        return 'bg-green-100 text-green-800'
      case 'funding_opportunity':
        return 'bg-purple-100 text-purple-800'
      case 'trending_science_news':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'publication':
        return 'Publication'
      case 'patent':
        return 'Patent'
      case 'funding_opportunity':
        return 'Funding'
      case 'trending_science_news':
        return 'News'
      default:
        return itemType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getImpactIcon = (impactScore: string) => {
    switch (impactScore) {
      case 'H':
        return '🔥' // High impact
      case 'M':
        return '⭐' // Medium impact
      case 'L':
        return '💡' // Low impact
      default:
        return ''
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'H':
        return '🚨' // High urgency
      case 'M':
        return '⏰' // Medium urgency
      case 'L':
        return '📅' // Low urgency
      default:
        return ''
    }
  }

  const formatAuthors = (authors: string[]) => {
    if (!authors || authors.length === 0) return ''
    if (authors.length <= 3) {
      return authors.join(', ')
    }
    return `${authors.slice(0, 3).join(', ')} et al.`
  }

  const getSourceFromUrl = (url: string | null | undefined) => {
    if (!url) return 'Unknown Source'

    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return domain
    } catch {
      return 'Unknown Source'
    }
  }


  const renderMetadata = () => {
    if (!item.metadata) return null

    switch (item.item_type) {
      case 'publication':
        return (
          <div className="text-sm text-gray-500 mt-1">
            <p>Source: {getSourceFromUrl(item.url)}</p>
            {item.metadata.authors && (
              <p className="text-gray-400">By: {formatAuthors(item.metadata.authors)}</p>
            )}
          </div>
        )
      case 'patent':
        return (
          <div className="text-sm text-gray-500 mt-1">
            <p>Source: {getSourceFromUrl(item.url)}</p>
            {item.metadata.patent_number && (
              <p>Patent No: {item.metadata.patent_number}</p>
            )}
            {item.metadata.inventors && (
              <p className="text-gray-400">Inventors: {formatAuthors(item.metadata.inventors)}</p>
            )}
          </div>
        )
      case 'funding_opportunity':
        return (
          <div className="space-y-2 mt-1">
            <div className="text-sm text-gray-500">
              {item.metadata.funding_amount && (
                <div className="mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                    {item.metadata.funding_amount}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <span>Source: {getSourceFromUrl(item.url)}</span>
                  {item.metadata.issuing_agency && (
                    <span>Agency: {item.metadata.issuing_agency}</span>
                  )}
                  {item.metadata.deadline && (
                    <span className="text-red-600 font-medium">
                      ⏰ Due: {new Date(item.metadata.deadline).toLocaleDateString('en-AU')}
                    </span>
                  )}
                </div>
                {item.metadata.eligible_regions && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">🌍 Eligible:</span>
                    <span className="text-green-700 font-medium">{item.metadata.eligible_regions}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      case 'trending_science_news':
        return (
          <div className="text-sm text-gray-500 mt-1">
            <p>Source: {getSourceFromUrl(item.url)}</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(item.item_type)}`}>
              {getItemTypeLabel(item.item_type)}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
            {item.title}
          </h3>
          
          {item.summary && (
            <p className="text-gray-600 mb-3 leading-relaxed">
              {item.summary}
            </p>
          )}
          
          {renderMetadata()}
          
          {item.url && (
            <div className="mt-4">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleItemClick}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                Read more
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleComingSoonAction('Share')}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>

                <button
                  onClick={() => handleComingSoonAction('Compile Similar Work')}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Similar Work
                </button>
              </div>

              <button
                onClick={() => handleComingSoonAction('Favourite')}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Favourite
              </button>
            </div>

            {/* Mobile layout */}
            <div className="flex sm:hidden flex-col space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleComingSoonAction('Share')}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>

                <button
                  onClick={() => handleComingSoonAction('Favourite')}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors min-h-[44px]"
                >
                  <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Favourite
                </button>
              </div>

              <button
                onClick={() => handleComingSoonAction('Compile Similar Work')}
                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors min-h-[44px]"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Similar Work
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}