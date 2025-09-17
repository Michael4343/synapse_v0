'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'


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

  const generateFeed = useCallback(async () => {
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

      // Create feed session record
      const sessionTitle = `Feed Refresh - ${new Date().toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`

      const { data: sessionData, error: sessionError } = await supabase
        .from('feed_sessions')
        .insert({
          user_id: session.user.id,
          title: sessionTitle,
          search_type: 'refresh',
          preferences: null
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Failed to create feed session:', sessionError)
        throw new Error('Failed to create feed session')
      }

      console.log('Calling generate-feed with sessionId:', sessionData.id)

      const response = await supabase.functions.invoke('generate-feed', {
        body: {
          sessionId: sessionData.id
        },
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
      return {
        ...response.data,
        sessionId: sessionData.id
      }
    } catch (err) {
      console.error('Feed generation failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate feed')
      throw err
    } finally {
      setIsGeneratingFeed(false)
    }
  }, [isGeneratingFeed, supabase])

  const keywordSearch = useCallback(async (keywords: string, categories?: any) => {
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

      console.log('Starting keyword search for user:', session.user.id, 'Keywords:', keywords, 'Categories:', categories)

      // Create feed session record for keyword search
      const enabledCategoryCount = categories ? Object.values(categories).filter(Boolean).length : 4
      const sessionTitle = `Keyword Search: "${keywords.slice(0, 30)}${keywords.length > 30 ? '...' : ''}" (${enabledCategoryCount} categories) - ${new Date().toLocaleDateString('en-AU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`

      const { data: sessionData, error: sessionError } = await supabase
        .from('feed_sessions')
        .insert({
          user_id: session.user.id,
          title: sessionTitle,
          search_type: 'keyword_search',
          preferences: { keywords, categories: categories || {} }
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Failed to create keyword search session:', sessionError)
        throw new Error('Failed to create keyword search session')
      }

      console.log('Calling generate-feed with keyword search parameters and sessionId:', sessionData.id)

      // Use unified generate-feed function with keyword-only search
      const response = await supabase.functions.invoke('generate-feed', {
        body: {
          preferences: { keywords, categories },
          sessionId: sessionData.id,
          searchType: 'keyword-search',
          keywordOnlySearch: true
        },
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
      return {
        ...response.data,
        sessionId: sessionData.id
      }
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