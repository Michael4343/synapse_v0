'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface FeedPreferences {
  keywords: string
  categories: {
    publications: boolean
    patents: boolean
    funding_opportunities: boolean
    trending_science_news: boolean
  }
}

export function useProfile() {
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false)
  const [isGeneratingFeed, setIsGeneratingFeed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const generateProfile = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isGeneratingProfile) {
      console.log('Profile generation already in progress, skipping...')
      return
    }

    setIsGeneratingProfile(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      console.log('Starting profile generation for user:', session.user.id)

      const response = await supabase.functions.invoke('generate-profile', {
        body: { userId: session.user.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.error) {
        console.error('Edge Function Error:', response.error)
        console.error('Response data:', response.data)
        throw new Error(`Edge Function Error: ${response.error.message}${response.data?.error ? ` - ${response.data.error}` : ''}`)
      }

      console.log('Profile generation completed successfully')
      return response.data
    } catch (err) {
      console.error('Profile generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate profile')
      throw err
    } finally {
      setIsGeneratingProfile(false)
    }
  }, [isGeneratingProfile, supabase])

  const generateFeed = useCallback(async (preferences?: FeedPreferences) => {
    // Prevent multiple simultaneous calls
    if (isGeneratingFeed) {
      console.log('Feed generation already in progress, skipping...')
      return
    }

    setIsGeneratingFeed(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      console.log('Starting feed generation for user:', session.user.id)

      const response = await supabase.functions.invoke('generate-feed', {
        body: preferences ? { preferences } : {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.error) {
        console.error('Generate Feed Error:', response.error)
        console.error('Response data:', response.data)
        throw new Error(`Generate Feed Error: ${response.error.message}${response.data?.error ? ` - ${response.data.error}` : ''}`)
      }

      console.log('Feed generation completed successfully')
      return response.data
    } catch (err) {
      console.error('Feed generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate feed')
      throw err
    } finally {
      setIsGeneratingFeed(false)
    }
  }, [isGeneratingFeed, supabase])

  const keywordSearch = useCallback(async (keywords: string) => {
    // Prevent multiple simultaneous calls
    if (isGeneratingFeed) {
      console.log('Keyword search already in progress, skipping...')
      return
    }

    setIsGeneratingFeed(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session')
      }

      console.log('Starting keyword search for user:', session.user.id, 'Keywords:', keywords)

      const response = await supabase.functions.invoke('keyword-search', {
        body: { keywords },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.error) {
        console.error('Keyword Search Error:', response.error)
        console.error('Response data:', response.data)
        throw new Error(`Keyword Search Error: ${response.error.message}${response.data?.error ? ` - ${response.data.error}` : ''}`)
      }

      console.log('Keyword search completed successfully')
      return response.data
    } catch (err) {
      console.error('Keyword search failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to perform keyword search')
      throw err
    } finally {
      setIsGeneratingFeed(false)
    }
  }, [isGeneratingFeed, supabase])

  return {
    generateProfile,
    generateFeed,
    keywordSearch,
    isGeneratingProfile,
    isGeneratingFeed,
    error,
  }
}