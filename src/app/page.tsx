'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { login, signup } from './login/actions'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

export default function Home() {
  const router = useRouter()
  const tracking = usePostHogTracking()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordMatch, setPasswordMatch] = useState(true)
  const [error, setError] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check if user is already authenticated and handle query params
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.push('/dashboard')
      } else {
        setIsCheckingAuth(false)

        // Handle error/message query parameters
        const urlParams = new URLSearchParams(window.location.search)
        const errorParam = urlParams.get('error')
        const messageParam = urlParams.get('message')

        if (errorParam) {
          setError(decodeURIComponent(errorParam))
          // Clean up URL
          const url = new URL(window.location.href)
          url.searchParams.delete('error')
          window.history.replaceState({}, '', url.toString())
        }

        if (messageParam) {
          setMessage(decodeURIComponent(messageParam))
          // Clean up URL
          const url = new URL(window.location.href)
          url.searchParams.delete('message')
          window.history.replaceState({}, '', url.toString())
        }
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    setMessage('')

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
        // Server action will handle redirect, no need for try/catch
        await signup(formData)
        // Track success (will happen on redirect to dashboard)
      } catch (error) {
        tracking.trackError('signup_failed', error instanceof Error ? error.message : 'Unknown signup error')
      }
    } else {
      // Track login attempt
      tracking.trackUserLogin('email')

      try {
        // Server action will handle redirect, no need for try/catch
        await login(formData)
        // Track success (will happen on redirect to dashboard)
      } catch (error) {
        tracking.trackError('login_failed', error instanceof Error ? error.message : 'Unknown login error')
      }
    }

    setIsLoading(false)
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
                  {activeTab === 'signin' ? 'Welcome back' : 'Get started today'}
                </h2>
                <p className="text-gray-600">
                  {activeTab === 'signin'
                    ? 'Sign in to your account'
                    : 'Create your personalised research feed'
                  }
                </p>
              </div>

              {/* Tab Navigation */}
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

              {/* Form */}
              <form action={handleSubmit} className="space-y-5">
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
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
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
                  {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}