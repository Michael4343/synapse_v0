'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { submitProfileData } from './actions'
import { usePostHogTracking } from '@/hooks/usePostHogTracking'

export default function Onboarding() {
  const tracking = usePostHogTracking()
  const [linkedin, setLinkedin] = useState('')
  const [scholar, setScholar] = useState('')
  const [company, setCompany] = useState('')
  const [website, setWebsite] = useState('')
  const [orcid, setOrcid] = useState('')
  const [keywords, setKeywords] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    tracking.trackOnboardingStarted()
  }, [tracking])

  const calculateProgress = () => {
    const fields = [linkedin, scholar, company, website, orcid, keywords]
    const filledFields = fields.filter(field => field.trim()).length
    return Math.round((filledFields / 6) * 100)
  }

  const hasAnyInput = () => {
    return [linkedin, scholar, company, website, orcid, keywords].some(field => field.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasAnyInput()) return

    setIsSubmitting(true)

    // Track URL submissions
    const urls = [linkedin, scholar, company, website, orcid].filter(url => url.trim())
    urls.forEach(url => {
      let urlType = 'other'
      if (url.includes('linkedin.com')) urlType = 'linkedin'
      else if (url.includes('scholar.google.com')) urlType = 'google_scholar'
      else if (url.includes('orcid.org')) urlType = 'orcid'

      tracking.trackUrlSubmitted(url, urlType)
    })

    // Track profile generation start
    tracking.trackProfileGenerationStarted()

    const formData = new FormData()
    formData.append('linkedin', linkedin)
    formData.append('scholar', scholar)
    formData.append('company', company)
    formData.append('website', website)
    formData.append('orcid', orcid)
    formData.append('keywords', keywords)

    await submitProfileData(formData)
  }

  const progress = calculateProgress()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Let's Get Started
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Add any profile links or keywords to get started. More info = better results!
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="linkedin" className="block text-xs font-medium text-gray-700">
                LinkedIn
              </label>
              <input
                id="linkedin"
                name="linkedin"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label htmlFor="scholar" className="block text-xs font-medium text-gray-700">
                Google Scholar
              </label>
              <input
                id="scholar"
                name="scholar"
                type="url"
                value={scholar}
                onChange={(e) => setScholar(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://scholar.google.com/citations?user=..."
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-medium text-gray-700">
                Company/Institution
              </label>
              <input
                id="company"
                name="company"
                type="url"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://company.com/team/yourname"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-xs font-medium text-gray-700">
                Personal Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label htmlFor="orcid" className="block text-xs font-medium text-gray-700">
                ORCID Profile
              </label>
              <input
                id="orcid"
                name="orcid"
                type="url"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://orcid.org/0000-0000-0000-0000"
              />
            </div>

            <div>
              <label htmlFor="keywords" className="block text-xs font-medium text-gray-700">
                Keywords & Interests
              </label>
              <textarea
                id="keywords"
                name="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="machine learning, biotechnology, renewable energy..."
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Completeness (optional - submit anytime!)</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {progress < 50 ? 'More info = better results!' : progress < 100 ? 'Great! Even more data = even better feed' : 'Perfect! Maximum personalization'}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={!hasAnyInput() || isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                !hasAnyInput() || isSubmitting
                  ? 'text-gray-400 bg-gray-300 cursor-not-allowed'
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              }`}
            >
              {isSubmitting ? 'Creating your profile...' : 'Continue to Dashboard'}
            </button>
            {!hasAnyInput() && (
              <p className="mt-2 text-xs text-red-600 text-center">
                Add at least one URL or keyword to continue
              </p>
            )}
            <div className="text-xs text-gray-500 text-center mt-2">
              We'll create your personalised feed (takes ~2 minutes)
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}