'use client'

import { useEffect } from 'react'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface DashboardClientProps {
  user: any
  feedItems: any[] | null
  groupedItems: Record<string, any[]>
  children: React.ReactNode
}

export default function DashboardClient({ user, feedItems, groupedItems, children }: DashboardClientProps) {
  const tracking = usePostHogTracking()

  useEffect(() => {
    if (user) {
      // Track successful authentication when user lands on dashboard
      const urlParams = new URLSearchParams(window.location.search)
      const isNewLogin = urlParams.get('from') === 'login' || window.sessionStorage.getItem('just_logged_in')

      if (isNewLogin) {
        tracking.trackUserLoginSuccess(user.id, 'email')
        window.sessionStorage.removeItem('just_logged_in')
      }

      // Track feed category interactions
      if (feedItems && feedItems.length > 0) {
        Object.entries(groupedItems).forEach(([categoryType, items]) => {
          tracking.trackFeedCategoryInteraction(categoryType, items.length)
        })
      }
    }
  }, [user, feedItems, groupedItems, tracking])

  return <>{children}</>
}