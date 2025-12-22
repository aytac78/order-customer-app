import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient(
      'https://ipobkbhcrkrqgbohdeea.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwb2JrYmhjcmtycWdib2hkZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzE1MjgsImV4cCI6MjA4MDAwNzUyOH0.QaUkRsv_B3Msc9qYmE366k1x_sTe8j5GxLUO3oKKg3w'
    )
    
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home page after login
  return NextResponse.redirect(`${origin}/`)
}
