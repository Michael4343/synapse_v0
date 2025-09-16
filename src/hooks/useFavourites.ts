'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FeedItem, UserFavourite } from '@/types/database'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

interface UseFavouritesReturn {
  favourites: Set<number>
  isLoading: boolean
  isFavourite: (itemId: number) => boolean
  toggleFavourite: (item: FeedItem) => Promise<boolean>
  loadFavourites: () => Promise<void>
  getFavouritedItems: () => Promise<FeedItem[]>
}

export function useFavourites(): UseFavouritesReturn {
  const [favourites, setFavourites] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const tracking = usePostHogTracking()

  const loadFavourites = useCallback(async () => {
    // Guard against concurrent calls to prevent infinite loops
    if (isLoading) return

    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const { data, error } = await supabase
        .from('user_favourites')
        .select('feed_item_id')
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Failed to load favourites:', error)
        tracking.trackError('favourites_load_failed', error.message)
        return
      }

      const favouriteIds = new Set(data?.map(fav => fav.feed_item_id) || [])
      setFavourites(favouriteIds)
    } catch (err) {
      console.error('Error loading favourites:', err)
      tracking.trackError('favourites_load_failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, isLoading])

  const isFavourite = useCallback((itemId: number): boolean => {
    return favourites.has(itemId)
  }, [favourites])

  const toggleFavourite = useCallback(async (item: FeedItem): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        tracking.trackError('favourite_toggle_failed', 'User not authenticated')
        return false
      }

      const isCurrentlyFavourited = favourites.has(item.id)

      // Optimistic update
      const newFavourites = new Set(favourites)
      if (isCurrentlyFavourited) {
        newFavourites.delete(item.id)
      } else {
        newFavourites.add(item.id)
      }
      setFavourites(newFavourites)

      if (isCurrentlyFavourited) {
        // Remove from favourites
        const { error } = await supabase
          .from('user_favourites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('feed_item_id', item.id)

        if (error) {
          // Rollback optimistic update
          setFavourites(favourites)
          console.error('Failed to remove favourite:', error)
          tracking.trackError('unfavourite_failed', error.message)
          return false
        }

        tracking.trackItemUnfavourited(String(item.id), item.item_type, item.title)
      } else {
        // Add to favourites
        const { error } = await supabase
          .from('user_favourites')
          .insert({
            user_id: session.user.id,
            feed_item_id: item.id
          })

        if (error) {
          // Rollback optimistic update
          setFavourites(favourites)
          console.error('Failed to add favourite:', error)
          tracking.trackError('favourite_failed', error.message)
          return false
        }

        tracking.trackItemFavourited(String(item.id), item.item_type, item.title)
      }

      return true
    } catch (err) {
      // Rollback optimistic update
      setFavourites(favourites)
      console.error('Error toggling favourite:', err)
      tracking.trackError('favourite_toggle_error', err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }, [favourites, supabase])

  const getFavouritedItems = useCallback(async (): Promise<FeedItem[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return []

      const { data, error } = await supabase
        .from('user_favourites')
        .select(`
          created_at,
          feed_items!inner (
            id,
            user_id,
            item_type,
            title,
            summary,
            url,
            metadata,
            session_id,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load favourited items:', error)
        tracking.trackError('favourited_items_load_failed', error.message)
        return []
      }

      // Extract the feed items from the joined query
      const favouritedItems = data?.map(fav => fav.feed_items).filter(Boolean) as FeedItem[] || []

      tracking.trackEvent('favourited_items_loaded', {
        count: favouritedItems.length
      })

      return favouritedItems
    } catch (err) {
      console.error('Error loading favourited items:', err)
      tracking.trackError('favourited_items_load_error', err instanceof Error ? err.message : 'Unknown error')
      return []
    }
  }, [supabase])

  // Load favourites on hook initialization
  useEffect(() => {
    loadFavourites()
  }, [loadFavourites])

  return {
    favourites,
    isLoading,
    isFavourite,
    toggleFavourite,
    loadFavourites,
    getFavouritedItems
  }
}