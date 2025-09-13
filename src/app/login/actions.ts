'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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

  const { error } = await supabase.auth.signInWithPassword({
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

  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
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