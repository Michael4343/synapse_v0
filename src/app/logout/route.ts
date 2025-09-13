import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 400 }
    )
  }

  // Get the origin from the request to build the redirect URL
  const origin = new URL(request.url).origin
  return NextResponse.redirect(new URL('/', origin))
}