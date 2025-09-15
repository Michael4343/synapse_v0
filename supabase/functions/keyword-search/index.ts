import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== KEYWORD SEARCH FUNCTION STARTED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body for keywords
    let keywords = ''
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        keywords = body.keywords || ''
        console.log('Received keywords:', keywords)
      } catch (err) {
        console.log('No keywords in request body or parsing failed')
        throw new Error('Keywords are required for search')
      }
    }

    if (!keywords || !keywords.trim()) {
      throw new Error('Keywords are required for search')
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

    // Get current date for time filtering
    const currentDate = new Date()
    const todayString = currentDate.toISOString().split('T')[0]

    // Build the pure keyword search prompt - NO profile bias
    const prompt = `Find recent research content related to these keywords: "${keywords}"

TODAY'S DATE: ${todayString}

IMPORTANT: This is a pure keyword search. Do NOT consider any researcher profile or existing expertise. Focus ONLY on the provided keywords.

SEARCH FOCUS: ${keywords}

FIND recent content (past 6 months) in these categories:
1. PUBLICATIONS: Research papers, journal articles, and preprints related to "${keywords}". Include papers from journals, arxiv, research repositories.
2. PATENTS: Recently granted patents related to "${keywords}". Include patents from patent databases and offices.
3. FUNDING: Active grant opportunities with future deadlines related to "${keywords}". Only include grants that are currently open for applications.
4. NEWS: Science news, research announcements, and articles about developments in "${keywords}" (past 3 months).

Return ONLY this JSON structure:
{
  "publications": [
    {
      "title": "Paper title",
      "authors": ["Author1", "Author2"],
      "summary": "Brief summary of the paper",
      "url": "https://journal.com/articles/direct-paper-link"
    }
  ],
  "patents": [
    {
      "title": "Patent title",
      "patent_number": "US1234567",
      "inventors": ["Inventor1"],
      "summary": "Brief summary",
      "url": "https://example.com/patent"
    }
  ],
  "funding_opportunities": [
    {
      "title": "Grant title",
      "issuing_agency": "Agency name",
      "funding_amount": "$X amount",
      "deadline": "2024-MM-DD",
      "eligible_regions": "Geographic eligibility",
      "summary": "Brief summary",
      "url": "https://example.com/grant"
    }
  ],
  "trending_science_news": [
    {
      "title": "News title",
      "source": "Source name",
      "summary": "Brief summary",
      "url": "https://example.com/news"
    }
  ]
}

Return 3-4 items per category. Focus on recent, relevant content related to "${keywords}".
Do not include any explanatory text, reasoning, or other content outside of this JSON object.`

    // Call Perplexity API with structured output
    console.log('Calling Perplexity API for keyword search...')
    console.log('Model: sonar-deep-research')
    console.log('Keywords:', keywords)

    // Call Perplexity API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minute timeout

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
    const searchDataRaw = perplexityData.choices[0]?.message?.content

    if (!searchDataRaw) {
      throw new Error('No search data generated')
    }

    console.log('Raw response from Perplexity:')
    console.log(searchDataRaw)
    console.log('Response length:', searchDataRaw.length)

    // Parse the JSON response - handle <think> tokens from sonar-deep-research
    let searchData
    try {
      let jsonString = searchDataRaw.trim()

      // Remove <think> reasoning tokens if present
      if (jsonString.includes('<think>')) {
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

      searchData = JSON.parse(jsonString)
      console.log('✅ JSON parsing successful!')

    } catch (error) {
      console.error('JSON parsing failed:', error.message)
      console.error('Raw content (first 500 chars):', searchDataRaw.substring(0, 500))
      throw new Error(`Invalid JSON response from AI: ${error.message}`)
    }

    // Count total results
    const totalResults = (searchData.publications?.length || 0) +
                        (searchData.patents?.length || 0) +
                        (searchData.funding_opportunities?.length || 0) +
                        (searchData.trending_science_news?.length || 0)

    return new Response(
      JSON.stringify({
        success: true,
        keywords: keywords,
        resultsGenerated: totalResults,
        categories: {
          publications: searchData.publications?.length || 0,
          patents: searchData.patents?.length || 0,
          funding_opportunities: searchData.funding_opportunities?.length || 0,
          trending_science_news: searchData.trending_science_news?.length || 0
        },
        data: searchData,
        searchMetrics: {
          searchType: 'keyword-only',
          keywordsUsed: keywords,
          profileBiasApplied: false,
          searchDate: todayString
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== KEYWORD SEARCH ERROR ===')
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