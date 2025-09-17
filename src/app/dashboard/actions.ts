'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function changePassword(newPassword: string) {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to change your password')
  }

  // Basic validation
  if (!newPassword) {
    throw new Error('Password is required')
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }

  // Update the user's password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    // Provide user-friendly error messages
    if (error.message.includes('Password should be at least')) {
      throw new Error('Password must be at least 6 characters long')
    } else if (error.message.includes('Unable to validate')) {
      throw new Error('Session expired. Please sign in again')
    } else {
      throw new Error(error.message || 'Failed to update password')
    }
  }

  // Sign out the user after successful password change
  // This is a security best practice - force re-authentication with new password
  await supabase.auth.signOut()

  // Redirect to login page with success message
  redirect('/?message=' + encodeURIComponent('Password changed successfully! Please sign in with your new password.'))
}