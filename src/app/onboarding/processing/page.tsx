'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'

export default function ProcessingPage() {
  const { generateProfile, generateFeed, isGeneratingProfile, isGeneratingFeed, error } = useProfile()
  const [step, setStep] = useState<'profile' | 'feed' | 'complete'>('profile')
  const [profileGenerated, setProfileGenerated] = useState(false)
  const router = useRouter()
  const hasStarted = useRef(false)

  useEffect(() => {
    // Prevent multiple executions
    if (hasStarted.current) {
      console.log('Processing already started, skipping...')
      return
    }

    const process = async () => {
      hasStarted.current = true
      console.log('Starting onboarding processing...')
      
      try {
        // Step 1: Generate profile
        console.log('Step 1: Starting profile generation')
        setStep('profile')
        await generateProfile()
        setProfileGenerated(true)
        console.log('Step 1: Profile generation completed')
        
        // Step 2: Generate feed (start immediately, no artificial delay)
        console.log('Step 2: Starting feed generation')
        setStep('feed')
        await generateFeed()
        console.log('Step 2: Feed generation completed')
        
        // Complete
        setStep('complete')
        console.log('Processing completed successfully')
        
        // Redirect to dashboard after a brief moment
        setTimeout(() => {
          router.push('/dashboard?message=Profile and feed generated successfully')
        }, 1500)
        
      } catch (err) {
        console.error('Processing failed:', err)
        hasStarted.current = false // Reset on error to allow retry
      }
    }

    process()
  }, [generateProfile, generateFeed, router])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Processing Failed
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Setting Up Your Feed
          </h2>
          
          <div className="space-y-6">
            {/* Profile Generation Step */}
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'profile' ? 'bg-indigo-600 text-white' :
                profileGenerated ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-400'
              }`}>
                {profileGenerated ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step === 'profile' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '1'
                )}
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Analyzing Your Profile</h3>
                <p className="text-sm text-gray-500">
                  {step === 'profile' ? 'Reading your URLs and generating profile...' : 
                   profileGenerated ? 'Profile analysis complete' : 
                   'Waiting to start...'}
                </p>
              </div>
            </div>

            {/* Feed Generation Step */}
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'feed' ? 'bg-indigo-600 text-white' :
                step === 'complete' ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-400'
              }`}>
                {step === 'complete' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step === 'feed' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '2'
                )}
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Curating Your Feed</h3>
                <p className="text-sm text-gray-500">
                  {step === 'feed' ? 'Finding relevant publications, patents, and news...' : 
                   step === 'complete' ? 'Feed curation complete' : 
                   'Waiting for profile completion...'}
                </p>
              </div>
            </div>
          </div>

          {step === 'complete' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                All Set!
              </h3>
              <p className="text-gray-500">
                Redirecting to your personalised feed...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}