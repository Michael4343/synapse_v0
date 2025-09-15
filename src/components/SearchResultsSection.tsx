'use client'

import FeedItem from './FeedItem'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface SearchResult {
  id: number
  user_id: string
  item_type: string
  title: string
  summary: string | null
  url: string | null
  metadata: any | null
  created_at: string
}

interface SearchResultsSectionProps {
  searchData: any
  keywords: string
  isVisible: boolean
  onClear: () => void
}

export default function SearchResultsSection({
  searchData,
  keywords,
  isVisible,
  onClear
}: SearchResultsSectionProps) {
  const tracking = usePostHogTracking()

  if (!isVisible || !searchData) {
    return null
  }

  // Transform search data to feed item format
  const transformToFeedItems = (data: any): SearchResult[] => {
    const items: SearchResult[] = []
    let idCounter = 1

    // Publications
    if (data.publications) {
      data.publications.forEach((pub: any) => {
        items.push({
          id: idCounter++,
          user_id: 'search-user',
          item_type: 'publication',
          title: pub.title,
          summary: pub.summary,
          url: pub.url,
          metadata: { authors: pub.authors },
          created_at: new Date().toISOString()
        })
      })
    }

    // Patents
    if (data.patents) {
      data.patents.forEach((patent: any) => {
        items.push({
          id: idCounter++,
          user_id: 'search-user',
          item_type: 'patent',
          title: patent.title,
          summary: patent.summary,
          url: patent.url,
          metadata: {
            patent_number: patent.patent_number,
            inventors: patent.inventors
          },
          created_at: new Date().toISOString()
        })
      })
    }

    // Funding
    if (data.funding_opportunities) {
      data.funding_opportunities.forEach((funding: any) => {
        items.push({
          id: idCounter++,
          user_id: 'search-user',
          item_type: 'funding_opportunity',
          title: funding.title,
          summary: funding.summary,
          url: funding.url,
          metadata: {
            issuing_agency: funding.issuing_agency,
            funding_amount: funding.funding_amount,
            deadline: funding.deadline,
            eligible_regions: funding.eligible_regions
          },
          created_at: new Date().toISOString()
        })
      })
    }

    // News
    if (data.trending_science_news) {
      data.trending_science_news.forEach((news: any) => {
        items.push({
          id: idCounter++,
          user_id: 'search-user',
          item_type: 'trending_science_news',
          title: news.title,
          summary: news.summary,
          url: news.url,
          metadata: { source: news.source },
          created_at: new Date().toISOString()
        })
      })
    }

    return items
  }

  // Group items by type for organized display
  const allItems = transformToFeedItems(searchData)
  const groupedItems = allItems.reduce((acc, item) => {
    const type = item.item_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(item)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const handleClear = () => {
    tracking.trackEvent('keyword_search_cleared', {
      keywords: keywords,
      results_count: allItems.length
    })
    onClear()
  }

  const categoryDisplayNames: Record<string, string> = {
    'publication': 'Publications',
    'patent': 'Patents',
    'funding_opportunity': 'Funding Opportunities',
    'trending_science_news': 'Science News'
  }

  return (
    <div className="mt-8 border-t border-gray-300 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Keyword Search Results
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Pure exploration search for: <span className="font-medium text-indigo-600">"{keywords}"</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {allItems.length} results found • Profile-independent search
          </p>
        </div>
        <button
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
        >
          Clear Results
        </button>
      </div>

      {/* Search Info Banner */}
      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-indigo-800">
              Profile-Independent Search
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              These results are based purely on your keywords, with no influence from your research profile.
              This allows you to discover content in completely different fields or adjacent areas.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      {allItems.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([itemType, items]) => {
            const categoryName = categoryDisplayNames[itemType] || itemType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

            return (
              <div key={itemType} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center">
                  {categoryName} ({items.length})
                  <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                    Keyword-Based
                  </span>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <FeedItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
            No Results Found
          </h3>
          <p className="text-gray-500">
            No recent research content found for "{keywords}". Try different keywords or broader search terms.
          </p>
        </div>
      )}
    </div>
  )
}