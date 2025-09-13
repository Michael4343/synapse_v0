import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    // If there's an error, redirect to home with error message
    redirect('/?error=' + encodeURIComponent('Failed to sign out'))
  }

  // Successful logout - redirect to home page
  redirect('/')
}