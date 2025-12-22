import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ipobkbhcrkrqgbohdeea.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwb2JrYmhjcmtycWdib2hkZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzE1MjgsImV4cCI6MjA4MDAwNzUyOH0.QaUkRsv_B3Msc9qYmE366k1x_sTe8j5GxLUO3oKKg3w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
})
