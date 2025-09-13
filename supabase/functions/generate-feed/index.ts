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

    // Prepare the prompt for Perplexity API
    const prompt = `You are a hyper-specialized research assistant for a leading expert. Your task is to find the most recent and highly relevant professional information for this expert based on their detailed profile provided below. You must find content across four specific categories: academic publications, patents, funding opportunities, and trending science news. Your response must be a single, valid JSON object that strictly adheres to the provided JSON Schema.

Expert Profile:
${profile.profile_text}

Based on this profile, find:
1. Recent academic publications (papers, research articles) relevant to their field
2. Patents recently granted or published in their area of expertise
3. Funding opportunities (grants, RFPs) that align with their research interests
4. Trending science news and developments in their industry

Return your response as a single, valid JSON object with the following exact structure:
{
  "publications": [
    {
      "title": "Paper title",
      "authors": ["Author 1", "Author 2"],
      "summary": "Brief summary of the paper",
      "url": "https://example.com/paper"
    }
  ],
  "patents": [
    {
      "title": "Patent title",
      "patent_number": "US1234567",
      "inventors": ["Inventor 1"],
      "summary": "Brief summary",
      "url": "https://example.com/patent"
    }
  ],
  "funding_opportunities": [
    {
      "title": "Grant title",
      "issuing_agency": "Agency name",
      "summary": "Brief summary",
      "deadline": "2024-12-31",
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

Do not include any explanatory text, reasoning, or other content outside of this JSON object.`

    // Call Perplexity API with structured output
    console.log('Calling Perplexity API...')
    console.log('Model: sonar-deep-research')
    console.log('Profile text length:', profile.profile_text.length)
    
    // Call Perplexity API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout
    
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

    // Delete existing feed items for user
    const { error: deleteError } = await supabaseClient
      .from('feed_items')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error('Failed to clear existing feed items')
    }

    // Prepare feed items for insertion
    const feedItems = []

    // Process publications
    if (feedData.publications) {
      for (const pub of feedData.publications) {
        feedItems.push({
          user_id: user.id,
          item_type: 'publication',
          title: pub.title,
          summary: pub.summary,
          url: pub.url,
          metadata: { authors: pub.authors }
        })
      }
    }

    // Process patents
    if (feedData.patents) {
      for (const patent of feedData.patents) {
        feedItems.push({
          user_id: user.id,
          item_type: 'patent',
          title: patent.title,
          summary: patent.summary,
          url: patent.url,
          metadata: { 
            patent_number: patent.patent_number,
            inventors: patent.inventors 
          }
        })
      }
    }

    // Process funding opportunities
    if (feedData.funding_opportunities) {
      for (const funding of feedData.funding_opportunities) {
        feedItems.push({
          user_id: user.id,
          item_type: 'funding_opportunity',
          title: funding.title,
          summary: funding.summary,
          url: funding.url,
          metadata: { 
            issuing_agency: funding.issuing_agency,
            deadline: funding.deadline 
          }
        })
      }
    }

    // Process trending science news
    if (feedData.trending_science_news) {
      for (const news of feedData.trending_science_news) {
        feedItems.push({
          user_id: user.id,
          item_type: 'trending_science_news',
          title: news.title,
          summary: news.summary,
          url: news.url,
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