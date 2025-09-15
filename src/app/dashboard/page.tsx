import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RefreshFeedButton from '@/components/RefreshFeedButton'
import FeedItem from '@/components/FeedItem'
import { logout } from '@/app/logout/actions'
import DashboardClient from './DashboardClient'

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

  // Fetch user's current feed items (not associated with any session)
  const { data: feedItems } = await supabase
    .from('feed_items')
    .select('*')
    .eq('user_id', user.id)
    .is('session_id', null)
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
    <DashboardClient user={user} feedItems={feedItems} groupedItems={groupedItems}>
      <RefreshFeedButton />
      <form action={logout}>
        <button
          type="submit"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sign Out
        </button>
      </form>
    </DashboardClient>
  )
}