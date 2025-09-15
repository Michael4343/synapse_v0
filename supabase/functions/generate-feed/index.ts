import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}


serve(async (req) => {
  console.log('=== GENERATE FEED FUNCTION STARTED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body for preferences and session ID
    let preferences = null
    let sessionId = null
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        preferences = body.preferences
        sessionId = body.sessionId
        console.log('Received preferences:', preferences)
        console.log('Received sessionId:', sessionId)
      } catch (err) {
        console.log('No preferences in request body or parsing failed')
      }
    }
    console.log('Creating Supabase client...')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Getting authorization header...')
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('No authorization header')
    }

    console.log('Verifying user...')
    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid authorization')
    }
    
    console.log('User verified:', user.id)

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('profile_text')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.profile_text) {
      throw new Error('User profile not found. Please complete profile generation first.')
    }

    // Extract researcher information for exclusion filtering
    console.log('Extracting researcher identity from profile...')
    const profileText = profile.profile_text

    // Extract researcher name and institution patterns for exclusion
    const nameMatches = profileText.match(/(?:Name|Called|Known as):\s*([^\n]+)/i) ||
                       profileText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m) ||
                       profileText.match(/Dr\.?\s+([A-Z][a-z]+ [A-Z][a-z]+)/i)

    const institutionMatches = profileText.match(/(?:University|Institute|Research|Laboratory|Lab|College|School):\s*([^\n]+)/i) ||
                              profileText.match(/(University of [^,\n]+)/i) ||
                              profileText.match(/([A-Z][a-z]+ University)/i) ||
                              profileText.match(/(CSIRO|RMIT|MIT|Stanford|Harvard|Oxford|Cambridge)/i)

    const researcherName = nameMatches ? nameMatches[1].trim() : ''
    const institution = institutionMatches ? institutionMatches[1].trim() : ''

    // Extract geographic location for eligibility filtering
    const countryMatches = profileText.match(/(?:Country|Location|Based in|Located in):\s*([^\n]+)/i) ||
                          profileText.match(/(Australia|United States|Canada|United Kingdom|Germany|France|Japan|Singapore|New Zealand)/i) ||
                          profileText.match(/(Australian|American|Canadian|British|German|French|Japanese|Singaporean)/i)

    const cityMatches = profileText.match(/(?:City|Location):\s*([^\n,]+)/i) ||
                       profileText.match(/(Melbourne|Sydney|Brisbane|Perth|Adelaide|Canberra|Auckland|Wellington)/i) ||
                       profileText.match(/(London|Boston|New York|San Francisco|Berlin|Paris|Tokyo|Singapore)/i)

    // Determine geographic region for funding eligibility
    let eligibleRegions = ['International'] // Always include international opportunities

    if (countryMatches) {
      const country = countryMatches[1].toLowerCase()
      if (country.includes('australia') || country.includes('australian')) {
        eligibleRegions.push('Australia', 'Asia-Pacific', 'Commonwealth')
      } else if (country.includes('united states') || country.includes('american')) {
        eligibleRegions.push('United States', 'North America', 'Americas')
      } else if (country.includes('canada') || country.includes('canadian')) {
        eligibleRegions.push('Canada', 'North America', 'Commonwealth', 'Americas')
      } else if (country.includes('united kingdom') || country.includes('british')) {
        eligibleRegions.push('United Kingdom', 'Europe', 'Commonwealth', 'EU')
      } else if (country.includes('germany') || country.includes('german')) {
        eligibleRegions.push('Germany', 'Europe', 'EU')
      } else if (country.includes('singapore') || country.includes('singaporean')) {
        eligibleRegions.push('Singapore', 'Asia-Pacific', 'ASEAN')
      }
    }

    // Try to infer from institution if country not explicit
    if (institution && eligibleRegions.length === 1) {
      const institutionLower = institution.toLowerCase()
      if (institutionLower.includes('csiro') || institutionLower.includes('university of melbourne') ||
          institutionLower.includes('university of sydney') || institutionLower.includes('rmit') ||
          institutionLower.includes('anu') || institutionLower.includes('unsw') || institutionLower.includes('uq')) {
        eligibleRegions.push('Australia', 'Asia-Pacific', 'Commonwealth')
      } else if (institutionLower.includes('mit') || institutionLower.includes('harvard') ||
                institutionLower.includes('stanford') || institutionLower.includes('caltech')) {
        eligibleRegions.push('United States', 'North America', 'Americas')
      } else if (institutionLower.includes('oxford') || institutionLower.includes('cambridge') ||
                institutionLower.includes('imperial college') || institutionLower.includes('ucl')) {
        eligibleRegions.push('United Kingdom', 'Europe', 'Commonwealth', 'EU')
      }
    }

    const geographicRegions = eligibleRegions.join(', ')

    console.log('Extracted researcher identity:', { researcherName, institution, eligibleRegions })

    // Get current date for time filtering and grant validation
    const currentDate = new Date()
    const cutoffDate = new Date(currentDate.getFullYear() - 1.5, currentDate.getMonth(), currentDate.getDate())
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]
    const todayString = currentDate.toISOString().split('T')[0]

    // Build search keywords from profile and user preferences
    const searchKeywords = []
    if (preferences?.keywords && preferences.keywords.trim()) {
      searchKeywords.push(preferences.keywords.trim())
    }

    // Extract research areas from profile for additional context
    const profileKeywords = profileText.match(/(?:research|field|area|focus|interest):\s*([^\n,]+)/gi)
    if (profileKeywords) {
      profileKeywords.forEach(match => {
        const keyword = match.replace(/(?:research|field|area|focus|interest):\s*/gi, '').trim()
        if (keyword) searchKeywords.push(keyword)
      })
    }

    const keywordContext = searchKeywords.length > 0
      ? `\n\nADDITIONAL SEARCH KEYWORDS: ${searchKeywords.join(', ')}`
      : ''

    // Determine which categories to include based on preferences
    const defaultCategories = {
      publications: true,
      patents: true,
      funding_opportunities: true,
      trending_science_news: true
    }

    const enabledCategories = preferences?.categories || defaultCategories

    // Build category sections dynamically
    const categoryInstructions = []
    const jsonStructure = {}

    if (enabledCategories.publications) {
      categoryInstructions.push('1. PUBLICATIONS (past 6 months): Research papers, journal articles, and preprints. Include papers from journals, arxiv, research repositories.')
      jsonStructure['publications'] = [
        {
          "title": "Paper title",
          "authors": ["Author1", "Author2"],
          "summary": "Brief summary of the paper",
          "url": "https://journal.com/articles/direct-paper-link"
        }
      ]
    }

    if (enabledCategories.patents) {
      categoryInstructions.push('2. PATENTS (past 6 months): Recently granted patents. Include patents from patent databases and offices.')
      jsonStructure['patents'] = [
        {
          "title": "Patent title",
          "patent_number": "US1234567",
          "inventors": ["Inventor1"],
          "summary": "Brief summary",
          "url": "https://example.com/patent"
        }
      ]
    }

    if (enabledCategories.funding_opportunities) {
      categoryInstructions.push(`3. FUNDING (active with future deadlines): Grant opportunities with application deadlines AFTER ${todayString}. Only include grants that researchers can still apply for. Geographic eligibility: ${geographicRegions}`)
      jsonStructure['funding_opportunities'] = [
        {
          "title": "Grant title",
          "issuing_agency": "Agency name",
          "funding_amount": "$X amount",
          "deadline": "2024-MM-DD",
          "eligible_regions": "Regions (must match researcher eligibility)",
          "summary": "Brief summary",
          "url": "https://example.com/grant"
        }
      ]
    }

    if (enabledCategories.trending_science_news) {
      categoryInstructions.push('4. NEWS (past 3 months): Science news, research announcements, university press releases, and articles about research developments.')
      jsonStructure['trending_science_news'] = [
        {
          "title": "News title",
          "source": "Source name",
          "summary": "Brief summary",
          "url": "https://example.com/news"
        }
      ]
    }

    // Prepare the prompt for enabled categories only
    const prompt = `Find recent research content for this researcher. Return 3-4 items per category.

TODAY'S DATE: ${todayString}

RESEARCHER: ${profile.profile_text}${keywordContext}

EXCLUDE: ${researcherName ? `Content by "${researcherName}". ` : ''}${institution ? `Content from "${institution}". ` : ''}Content older than 6 months.

FIND (recent content only):
${categoryInstructions.join('\n')}

Return ONLY this JSON structure:
${JSON.stringify(jsonStructure, null, 2)}

Do not include any explanatory text, reasoning, or other content outside of this JSON object.`

    // Call Perplexity API with structured output
    console.log('Calling Perplexity API...')
    console.log('Model: sonar-deep-research')
    console.log('Profile text length:', profile.profile_text.length)

    // Call Perplexity API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout for complex discovery
    
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
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
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text()
      console.error('Perplexity API error details:', errorText)
      throw new Error(`Perplexity API error: ${perplexityResponse.statusText} - ${errorText}`)
    }

    const perplexityData = await perplexityResponse.json()
    const feedDataRaw = perplexityData.choices[0]?.message?.content

    if (!feedDataRaw) {
      throw new Error('No feed data generated')
    }

    console.log('Raw response from Perplexity:')
    console.log(feedDataRaw)
    console.log('Response length:', feedDataRaw.length)

    // Parse the JSON response - handle <think> tokens from sonar-deep-research
    let feedData
    try {
      let jsonString = feedDataRaw.trim()
      
      // Remove <think> reasoning tokens if present
      if (jsonString.includes('<think>')) {
        // Find the end of the thinking section
        const thinkEnd = jsonString.indexOf('</think>') + '</think>'.length;
        if (thinkEnd > 0) {
          jsonString = jsonString.substring(thinkEnd).trim();
        }
      }
      
      // Look for JSON within code blocks or markdown
      if (jsonString.includes('```json')) {
        const jsonStart = jsonString.indexOf('```json') + '```json'.length;
        const jsonEnd = jsonString.indexOf('```', jsonStart);
        if (jsonEnd > jsonStart) {
          jsonString = jsonString.substring(jsonStart, jsonEnd).trim();
        }
      } else if (jsonString.includes('```')) {
        // Handle generic code blocks
        const codeStart = jsonString.indexOf('```') + 3;
        const codeEnd = jsonString.indexOf('```', codeStart);
        if (codeEnd > codeStart) {
          jsonString = jsonString.substring(codeStart, codeEnd).trim();
        }
      }
      
      // Extract JSON object if it's embedded in text
      if (jsonString.includes('{') && jsonString.includes('}')) {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }
      }
      
      console.log('Attempting to parse JSON:')
      console.log(jsonString.substring(0, 500) + (jsonString.length > 500 ? '...' : ''))
      
      feedData = JSON.parse(jsonString)
      console.log('✅ JSON parsing successful!')
      
    } catch (error) {
      console.error('JSON parsing failed:', error.message)
      console.error('Raw content (first 500 chars):', feedDataRaw.substring(0, 500))
      throw new Error(`Invalid JSON response from AI: ${error.message}`)
    }

    // Delete existing feed items for user (only current feed, not sessions)
    const { error: deleteError } = await supabaseClient
      .from('feed_items')
      .delete()
      .eq('user_id', user.id)
      .is('session_id', null)

    if (deleteError) {
      throw new Error('Failed to clear existing feed items')
    }

    // Prepare feed items for insertion
    const feedItems = []

    // Process publications (only if enabled)
    if (enabledCategories.publications && feedData.publications) {
      for (const pub of feedData.publications) {
        feedItems.push({
          user_id: user.id,
          item_type: 'publication',
          title: pub.title,
          summary: pub.summary,
          url: pub.url,
          session_id: sessionId,
          metadata: { authors: pub.authors }
        })
      }
    }

    // Process patents (only if enabled)
    if (enabledCategories.patents && feedData.patents) {
      for (const patent of feedData.patents) {
        feedItems.push({
          user_id: user.id,
          item_type: 'patent',
          title: patent.title,
          summary: patent.summary,
          url: patent.url,
          session_id: sessionId,
          metadata: {
            patent_number: patent.patent_number,
            inventors: patent.inventors
          }
        })
      }
    }

    // Process funding opportunities (only if enabled)
    if (enabledCategories.funding_opportunities && feedData.funding_opportunities) {
      for (const funding of feedData.funding_opportunities) {
        feedItems.push({
          user_id: user.id,
          item_type: 'funding_opportunity',
          title: funding.title,
          summary: funding.summary,
          url: funding.url,
          session_id: sessionId,
          metadata: {
            issuing_agency: funding.issuing_agency,
            funding_amount: funding.funding_amount,
            deadline: funding.deadline,
            eligible_regions: funding.eligible_regions
          }
        })
      }
    }

    // Process trending science news (only if enabled)
    if (enabledCategories.trending_science_news && feedData.trending_science_news) {
      for (const news of feedData.trending_science_news) {
        feedItems.push({
          user_id: user.id,
          item_type: 'trending_science_news',
          title: news.title,
          summary: news.summary,
          url: news.url,
          session_id: sessionId,
          metadata: { source: news.source }
        })
      }
    }

    // Insert new feed items
    if (feedItems.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('feed_items')
        .insert(feedItems)

      if (insertError) {
        throw new Error('Failed to insert feed items')
      }
    }

    // Update last_feed_generated_at timestamp
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ last_feed_generated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      throw new Error('Failed to update last feed generation timestamp')
    }

    return new Response(
      JSON.stringify({
        success: true,
        itemsGenerated: feedItems.length,
        categories: {
          publications: feedData.publications?.length || 0,
          patents: feedData.patents?.length || 0,
          funding_opportunities: feedData.funding_opportunities?.length || 0,
          trending_science_news: feedData.trending_science_news?.length || 0
        },
        discoveryMetrics: {
          researcherName: researcherName || 'Unknown',
          institution: institution || 'Unknown',
          eligibleRegions: eligibleRegions,
          contentCutoffDate: cutoffDateString,
          exclusionFiltersApplied: !!(researcherName || institution),
          geographicFilteringApplied: eligibleRegions.length > 1
        },
        preferences: {
          keywordsUsed: preferences?.keywords || '',
          enabledCategories: enabledCategories,
          searchKeywordsCount: searchKeywords.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== GENERATE FEED ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})