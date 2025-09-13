'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function submitProfileData(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Ensure user has a profile record (create if missing)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id,
      created_at: new Date().toISOString()
    })
    .select()

  if (profileError) {
    console.error('Profile creation error:', profileError)
    redirect('/onboarding?error=Failed to create user profile')
  }

  // Collect profile data from form
  const profileData = {
    linkedin: formData.get('linkedin') as string,
    scholar: formData.get('scholar') as string,
    company: formData.get('company') as string,
    website: formData.get('website') as string,
    orcid: formData.get('orcid') as string,
    keywords: formData.get('keywords') as string
  }

  // Build insert array for URLs and keywords
  const insertData = []
  
  // Add URLs with their profile types
  const urlFields = [
    { key: 'linkedin', type: 'linkedin', url: profileData.linkedin },
    { key: 'scholar', type: 'google_scholar', url: profileData.scholar },
    { key: 'company', type: 'company', url: profileData.company },
    { key: 'website', type: 'website', url: profileData.website },
    { key: 'orcid', type: 'orcid', url: profileData.orcid }
  ]

  urlFields.forEach(({ type, url }) => {
    if (url && url.trim()) {
      insertData.push({
        user_id: user.id,
        url: url.trim(),
        profile_type: type,
        keywords: null
      })
    }
  })

  // Add keywords entry if provided
  if (profileData.keywords && profileData.keywords.trim()) {
    insertData.push({
      user_id: user.id,
      url: null, // No URL for keywords-only entry
      profile_type: 'keywords',
      keywords: profileData.keywords.trim()
    })
  }

  // Ensure at least one entry
  if (insertData.length === 0) {
    redirect('/onboarding?error=Please provide at least one profile URL or keywords')
  }

  const { error: insertError } = await supabase
    .from('submitted_urls')
    .insert(insertData)

  if (insertError) {
    console.error('Database insert error:', insertError)
    console.error('Insert data that failed:', insertData)
    console.error('User ID:', user.id)
    redirect(`/onboarding?error=Failed to save profile data: ${insertError.message}`)
  }

  revalidatePath('/onboarding/processing')
  redirect('/onboarding/processing')
}