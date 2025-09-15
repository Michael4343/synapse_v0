import { FeedItem as FeedItemType } from '@/types/database'

interface FeedItemProps {
  item: FeedItemType
}

export default function FeedItem({ item }: FeedItemProps) {
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


  const renderMetadata = () => {
    if (!item.metadata) return null

    switch (item.item_type) {
      case 'publication':
        return (
          <div className="text-sm text-gray-500 mt-1">
            {item.metadata.authors && (
              <p>Authors: {formatAuthors(item.metadata.authors)}</p>
            )}
          </div>
        )
      case 'patent':
        return (
          <div className="text-sm text-gray-500 mt-1">
            {item.metadata.patent_number && (
              <p>Patent No: {item.metadata.patent_number}</p>
            )}
            {item.metadata.inventors && (
              <p>Inventors: {formatAuthors(item.metadata.inventors)}</p>
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
                  {item.metadata.issuing_agency && (
                    <span>Agency: {item.metadata.issuing_agency}</span>
                  )}
                  {item.metadata.deadline && (
                    <span className="text-red-600 font-medium">
                      ⏰ Due: {new Date(item.metadata.deadline).toLocaleDateString()}
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
            {item.metadata.source && (
              <p>Source: {item.metadata.source}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                className="inline-flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                Read more
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}