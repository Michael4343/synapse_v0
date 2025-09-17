'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { login, signup, resetPassword, signInWithGoogle } from './login/actions'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

export default function Home() {
  const router = useRouter()
  const tracking = usePostHogTracking()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signup')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [error, setError] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Debug log to track message state changes
  useEffect(() => {
    if (message) {
      console.log('Message state updated:', message)
    }
  }, [message])

  // Handle URL parameters (error/message) after auth check completes
  useEffect(() => {
    // Only process URL parameters after auth check is complete and UI is visible
    if (isCheckingAuth) return

    // Ensure we're on the client side before accessing window
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    const messageParam = urlParams.get('message')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      console.log('Setting error message from URL:', decodeURIComponent(errorParam))
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }

    if (messageParam) {
      const decodedMessage = decodeURIComponent(messageParam)
      console.log('Setting success message from URL:', decodedMessage)
      setMessage(decodedMessage)
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [isCheckingAuth]) // Dependency on isCheckingAuth ensures this runs when loading completes

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth check:', {
          hasUser: !!user,
          currentPath: window.location.pathname,
          searchParams: window.location.search,
        })
      }

      // Redirect authenticated users to dashboard (prototype - no email confirmation required)
      if (user) {
        router.push('/dashboard')
      } else {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('') // Clear any previous errors

    if (activeTab === 'signup') {
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirmPassword') as string

      if (password !== confirmPassword) {
        setPasswordMatch(false)
        setIsLoading(false)
        return
      }
      setPasswordMatch(true)

      // Track signup attempt
      tracking.trackUserSignup('email')

      try {
        const result = await signup(formData)

        if (result.success) {
          // Show success modal instead of redirecting
          setShowSuccessModal(true)
          // Clear form and switch to sign in tab for next step
          setActiveTab('signin')
          // Clear any existing errors
          setError('')
          tracking.trackUserSignup('email')
        } else {
          // Show error message
          setError(result.error || 'An unexpected error occurred')
          tracking.trackError('signup_failed', result.error || 'Unknown signup error')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown signup error'
        setError(errorMessage)
        tracking.trackError('signup_failed', errorMessage)
      }
    } else if (activeTab === 'signin') {
      // Track login attempt
      tracking.trackUserLogin('email')

      try {
        console.log('Starting login process...')
        const result = await login(formData)
        console.log('Login result:', result)

        if (result.success) {
          console.log('Login successful, redirecting to dashboard...')
          // Track successful login
          tracking.trackUserLogin('email')
          // Client-side redirect to dashboard
          router.push('/dashboard')
        } else {
          console.log('Login failed:', result.error)
          // Show error message
          setError(result.error || 'An unexpected error occurred')
          tracking.trackError('login_failed', result.error || 'Unknown login error')
        }
      } catch (error) {
        console.error('Login error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown login error'
        setError(errorMessage)
        tracking.trackError('login_failed', errorMessage)
      }
    } else if (activeTab === 'forgot') {
      // Track password reset attempt
      const email = formData.get('email') as string
      tracking.trackPasswordResetRequested(email)

      try {
        // Server action will handle redirect and success message
        await resetPassword(formData)
      } catch (error) {
        tracking.trackError('password_reset_failed', error instanceof Error ? error.message : 'Unknown reset error')
      }
    }

    setIsLoading(false)
  }

  const handleModalClose = () => {
    setShowSuccessModal(false)
    // Reset form to help user see they're now on the sign in tab
    const form = document.querySelector('form') as HTMLFormElement
    if (form) {
      form.reset()
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Track Google auth attempt
      tracking.trackUserLogin('google')
      await signInWithGoogle()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate with Google'
      setError(errorMessage)
      tracking.trackError('google_auth_failed', errorMessage)
      setIsLoading(false)
    }
  }

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Hero Content */}
          <div className="space-y-8 lg:sticky lg:top-16">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Synapse
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-700 mb-6">
                Your personalised professional feed powered by AI research
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Discover relevant publications, patents, funding opportunities, and science news
                tailoured to your expertise. Get AI-curated insights from your professional network
                and research interests.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-gray-700">AI-Powered Curation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700">Research Publications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-gray-700">Funding Opportunities</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <span className="text-gray-700">Patent Intelligence</span>
              </div>
            </div>
          </div>

          {/* Authentication Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[600px] flex flex-col">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {activeTab === 'signin' ? 'Welcome back' :
                   activeTab === 'forgot' ? 'Reset Password' : 'Get started today'}
                </h2>
                <p className="text-gray-600">
                  {activeTab === 'signin'
                    ? 'Sign in to your account'
                    : activeTab === 'forgot'
                    ? 'Enter your email to receive a reset link'
                    : 'Create your personalised research feed'
                  }
                </p>
              </div>

              {/* Tab Navigation */}
              {activeTab !== 'forgot' && (
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'signup'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'signin'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Back button for forgot password */}
              {activeTab === 'forgot' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Sign In
                  </button>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {!passwordMatch && activeTab === 'signup' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">Passwords do not match</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Google Sign In - Only show for signin and signup tabs */}
              {activeTab !== 'forgot' && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Continue with Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={activeTab === 'forgot' ? 'Enter your email address' : 'Enter your email'}
                  />
                </div>

                {activeTab !== 'forgot' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      {activeTab === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('forgot')}
                          className="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={activeTab === 'signin' ? 'Enter your password' : 'Create a password (min 6 characters)'}
                    />
                  </div>
                )}

                {activeTab === 'signup' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Confirm your password"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {activeTab === 'signin' ? 'Sign In' :
                   activeTab === 'forgot' ? 'Send Reset Link' : 'Create Account'}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-xl p-8 m-4 max-w-md w-full">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Success Message */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Account Created Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Please check your email for a verification link to complete your account setup.
              </p>

              {/* Got It Button */}
              <button
                onClick={handleModalClose}
                className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}