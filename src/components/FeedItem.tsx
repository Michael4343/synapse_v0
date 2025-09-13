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
        return itemType
    }
  }

  const renderMetadata = () => {
    if (!item.metadata) return null

    switch (item.item_type) {
      case 'publication':
        return (
          <div className="text-sm text-gray-500 mt-1">
            {item.metadata.authors && (
              <p>Authors: {item.metadata.authors.join(', ')}</p>
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
              <p>Inventors: {item.metadata.inventors.join(', ')}</p>
            )}
          </div>
        )
      case 'funding_opportunity':
        return (
          <div className="text-sm text-gray-500 mt-1">
            {item.metadata.issuing_agency && (
              <p>Agency: {item.metadata.issuing_agency}</p>
            )}
            {item.metadata.deadline && (
              <p>Deadline: {new Date(item.metadata.deadline).toLocaleDateString()}</p>
            )}
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
            <span className="ml-2 text-xs text-gray-400">
              {new Date(item.created_at).toLocaleDateString()}
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