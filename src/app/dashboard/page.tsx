import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import RefreshFeedButton from '@/components/RefreshFeedButton'
import FeedItem from '@/components/FeedItem'
import { logout } from '@/app/logout/actions'
import { changePassword } from './actions'
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
    <DashboardClient user={user} feedItems={feedItems} groupedItems={groupedItems} changePassword={changePassword}>
      <RefreshFeedButton />
      <div className="flex space-x-3">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-change-password-trigger
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m-2 1a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2M9 7V6a2 2 0 012-2h2a2 2 0 012 2v1" />
          </svg>
          Change Password
        </button>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </form>
      </div>
    </DashboardClient>
  )
}