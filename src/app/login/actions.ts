'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

async function getSiteUrl() {
  // Always prioritize environment variable for production deployments
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Fallback to constructing from request headers (development only)
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')

  return `${protocol}://${host}`
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Basic validation
  if (!email || !password) {
    redirect(`/?error=${encodeURIComponent('Email and password are required')}`)
  }

  if (!email.includes('@')) {
    redirect(`/?error=${encodeURIComponent('Please enter a valid email address')}`)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password,
  })

  if (error) {
    let errorMessage = error.message

    // Provide more user-friendly error messages
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please check your credentials and try again.'
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Please check your email and click the confirmation link before signing in.'
    }

    redirect(`/?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Basic validation
  if (!email || !password) {
    redirect(`/?error=${encodeURIComponent('Email and password are required')}`)
  }

  if (!email.includes('@')) {
    redirect(`/?error=${encodeURIComponent('Please enter a valid email address')}`)
  }

  if (password.length < 6) {
    redirect(`/?error=${encodeURIComponent('Password must be at least 6 characters long')}`)
  }

  const siteUrl = await getSiteUrl()

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
    options: {
      emailRedirectTo: `${siteUrl}/dashboard`
    }
  })

  if (error) {
    let errorMessage = error.message

    // Provide more user-friendly error messages
    if (error.message.includes('User already registered')) {
      errorMessage = 'An account with this email already exists. Please sign in instead.'
    } else if (error.message.includes('Password should be at least')) {
      errorMessage = 'Password must be at least 6 characters long.'
    }

    redirect(`/?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/', 'layout')
  redirect(`/?message=${encodeURIComponent('Account created successfully! Please check your email for a verification link.')}`)
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  // Basic validation
  if (!email) {
    redirect(`/?error=${encodeURIComponent('Email address is required')}`)
  }

  if (!email.includes('@')) {
    redirect(`/?error=${encodeURIComponent('Please enter a valid email address')}`)
  }

  const siteUrl = await getSiteUrl()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/dashboard`
  })

  if (error) {
    let errorMessage = error.message

    // Provide more user-friendly error messages
    if (error.message.includes('For security purposes')) {
      errorMessage = 'If an account with that email exists, we\'ve sent you a password reset link.'
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Too many reset requests. Please wait a few minutes before trying again.'
    }

    redirect(`/?error=${encodeURIComponent(errorMessage)}`)
  }

  revalidatePath('/', 'layout')
  redirect(`/?message=${encodeURIComponent('If an account with that email exists, we\'ve sent you a password reset link. Please check your email.')}`)
}

