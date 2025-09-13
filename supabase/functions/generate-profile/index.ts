import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProfileGenerationRequest {
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const debugLog: any[] = []
  const log = (stage: string, data: any) => {
    const entry = { stage, timestamp: new Date().toISOString(), data }
    debugLog.push(entry)
    console.log(`[${stage}]`, data)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    log('init', { userId: user.id, message: 'Starting profile generation' })

    // Check Perplexity API key
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured')
    }

    log('env-check', { hasPerplexity: true })

    // Get user's submitted URLs and keywords
    const { data: profileData, error: dataError } = await supabaseClient
      .from('submitted_urls')
      .select('url, keywords, profile_type')
      .eq('user_id', user.id)

    if (dataError) {
      throw new Error('Failed to fetch user profile data')
    }

    if (!profileData || profileData.length === 0) {
      throw new Error('No profile data found for user')
    }

    log('data-fetch', { items: profileData.length, types: profileData.map(p => p.profile_type) })

    // Organize URLs by type
    const urls = profileData.filter(item => item.url && item.url.trim()).map(item => ({
      url: item.url,
      type: item.profile_type
    }))

    const keywordsData = profileData.find(item => item.profile_type === 'keywords')
    const keywords = keywordsData?.keywords

    if (urls.length === 0 && !keywords) {
      throw new Error('No URLs or keywords found for profile generation')
    }

    log('data-organized', { urls: urls.length, hasKeywords: !!keywords })

    // Build comprehensive Perplexity prompt
    let prompt = `You are a world-class professional analyst tasked with creating a detailed profile of a leading expert in their field.

🔍 CRITICAL INSTRUCTIONS - URL-SPECIFIC ANALYSIS ONLY:

I will provide you with specific URLs associated with this professional. Your task is to extract and analyze information ONLY from the content available at these provided URLs.`

    if (urls.length > 0) {
      const urlsByType = urls.reduce((acc, item) => {
        const type = item.type || 'other'
        if (!acc[type]) acc[type] = []
        acc[type].push(item.url)
        return acc
      }, {} as Record<string, string[]>)

      prompt += `\n\nURLS TO ANALYZE:\n\n`

      if (urlsByType.linkedin) {
        prompt += `LinkedIn Profile:\n${urlsByType.linkedin.map(url => `- ${url}`).join('\n')}\n\n`
      }
      if (urlsByType.google_scholar) {
        prompt += `Google Scholar:\n${urlsByType.google_scholar.map(url => `- ${url}`).join('\n')}\n\n`
      }
      if (urlsByType.company) {
        prompt += `Company/Institution:\n${urlsByType.company.map(url => `- ${url}`).join('\n')}\n\n`
      }
      if (urlsByType.website) {
        prompt += `Personal Website:\n${urlsByType.website.map(url => `- ${url}`).join('\n')}\n\n`
      }
      if (urlsByType.orcid) {
        prompt += `ORCID Profile:\n${urlsByType.orcid.map(url => `- ${url}`).join('\n')}\n\n`
      }
      if (urlsByType.other) {
        prompt += `Other Professional Profiles:\n${urlsByType.other.map(url => `- ${url}`).join('\n')}\n\n`
      }

      prompt += `⚠️  MANDATORY CONSTRAINTS:
- ONLY analyze information available at the specific URLs listed above
- DO NOT perform general web searches using the person's name
- DO NOT mix information from different people with similar names
- FOCUS exclusively on the content found at the provided URLs
- If any URL content is not accessible, clearly state that rather than searching elsewhere
- Base your analysis ONLY on what you can extract from these specific URLs\n\n`
    }

    if (keywords) {
      prompt += `🎯 FOCUS AREAS AND KEYWORDS:
The professional is particularly interested in these areas: ${keywords}

Use these keywords to guide what aspects of their profile to emphasize when analyzing the URL content.\n\n`
    }

    prompt += `📝 PROFILE GENERATION REQUIREMENTS:

Extract and analyze information from the provided URLs to create a comprehensive technical profile that includes:

1. **Current Professional Focus**: What specific problems, technologies, or research areas are they working on right now?
2. **Technical Expertise**: Specific tools, frameworks, methodologies, programming languages, or laboratory techniques
3. **Research Interests**: Detailed sub-fields, emerging areas, interdisciplinary connections
4. **Academic/Professional Background**: Education, current position, career progression as found in URLs
5. **Publications & Output**: Research papers, patents, projects mentioned in their profiles
6. **Industry Applications**: How their work translates to real-world applications or commercial potential
7. **Professional Network**: Collaborations, affiliations, or connections mentioned in their profiles

Generate a comprehensive professional profile of 500-700 words. Focus heavily on their current and recent work rather than just career history. Use specific technical terminology and include details that would help identify relevant recent publications, patents, funding opportunities, and industry news in their field.

Write this as a detailed research profile suitable for curating a personalized professional feed, not a general biography. Be specific about their expertise areas and current focus based on what you can extract from their URL content.`

    log('prompt-built', { length: prompt.length, urls: urls.length, hasKeywords: !!keywords })

    // Call Perplexity API
    log('api-call', { message: 'Calling Perplexity sonar-deep-research' })

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text()
      log('perplexity-error', { status: perplexityResponse.status, error: errorText })
      throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`)
    }

    const perplexityData = await perplexityResponse.json()
    const profileTextRaw = perplexityData.choices[0]?.message?.content

    if (!profileTextRaw) {
      throw new Error('No profile text generated by Perplexity')
    }

    log('perplexity-response', { originalLength: profileTextRaw.length })

    // Clean up response - remove reasoning tokens if present
    let profileText = profileTextRaw.trim()
    if (profileText.includes('<think>')) {
      const thinkEnd = profileText.indexOf('</think>') + '</think>'.length;
      if (thinkEnd > 0) {
        profileText = profileText.substring(thinkEnd).trim();
      }
    }

    log('text-cleaned', { cleanedLength: profileText.length })

    // Validate URL-specific analysis (detect generic searches)
    const hasGeneralSearchIndicators = [
      'multiple individuals named',
      'different people with the same name',
      'another person named',
      'various professionals named',
      'several people named',
      'different individuals with this name'
    ].some(indicator => profileText.toLowerCase().includes(indicator.toLowerCase()))

    const hasURLSpecificContent = urls.some(url => {
      const domain = url.url.includes('linkedin.com') ? 'linkedin' :
                    url.url.includes('scholar.google') ? 'scholar' :
                    url.url.includes('orcid.org') ? 'orcid' :
                    url.url.includes('github.com') ? 'github' : null

      return domain && profileText.toLowerCase().includes(domain)
    })

    if (hasGeneralSearchIndicators && !hasURLSpecificContent) {
      log('validation-warning', {
        message: 'Profile may be based on general search rather than URL analysis',
        hasGeneralIndicators: hasGeneralSearchIndicators,
        hasURLContent: hasURLSpecificContent,
        urls: urls.map(u => u.url)
      })
    } else {
      log('validation-success', { message: 'Profile appears to be URL-specific' })
    }

    // Update user's profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        profile_text: profileText,
        last_feed_generated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`)
    }

    log('profile-updated', { success: true, profileLength: profileText.length })

    return new Response(
      JSON.stringify({
        success: true,
        profileText: profileText,
        debug: debugLog
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Profile generation error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    debugLog.push({
      stage: 'error',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      stack: errorStack
    })

    return new Response(
      JSON.stringify({
        error: errorMessage,
        debug: debugLog
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})