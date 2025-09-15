import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RefreshFeedButton from '@/components/RefreshFeedButton'
import FeedItem from '@/components/FeedItem'
import { logout } from '@/app/logout/actions'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_text')
    .eq('id', user.id)
    .single()

  if (!profile?.profile_text) {
    redirect('/onboarding')
  }

  // Fetch user's feed items
  const { data: feedItems } = await supabase
    .from('feed_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Group items by type
  const groupedItems = feedItems?.reduce((acc, item) => {
    const type = item.item_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(item)
    return acc
  }, {} as Record<string, any[]>) || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Your Professional Feed
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Welcome, {user.email}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <RefreshFeedButton />
                  <form action={logout}>
                    <button
                      type="submit"
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>

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
                        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          {categoryName} ({typedItems.length})
                        </h2>
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
          </div>
        </div>
      </div>
    </div>
  )
}