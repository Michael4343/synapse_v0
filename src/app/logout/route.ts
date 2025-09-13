import { NextRequest, NextResponse } from 'next/server'

// Handle direct visits to /logout URL
export async function GET(request: NextRequest) {
  // Redirect to home page if someone visits /logout directly
  return NextResponse.redirect(new URL('/', request.url))
}

// The POST method is handled by the server action in actions.ts
export async function POST(request: NextRequest) {
  // This shouldn't be called since we use server actions,
  // but just in case, redirect to home
  return NextResponse.redirect(new URL('/', request.url))
}