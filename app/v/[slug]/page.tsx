'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Loader2, UtensilsCrossed, AlertCircle } from 'lucide-react'

const SUPABASE_URL = 'https://ipobkbhcrkrqgbohdeea.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwb2JrYmhjcmtycWdib2hkZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzE1MjgsImV4cCI6MjA4MDAwNzUyOH0.QaUkRsv_B3Msc9qYmE366k1x_sTe8j5GxLUO3oKKg3w'

export default function QREntryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const hasRun = useRef(false)

  const slug = params.slug as string
  const tableNumber = searchParams.get('t') || searchParams.get('table')

  useEffect(() => {
    if (slug && !hasRun.current) {
      hasRun.current = true
      handleQREntry()
    }
  }, [slug])

  const handleQREntry = async () => {
    console.log('QR Entry for:', slug)
    
    try {
      const isUUID = slug.includes('-') && slug.length > 30
      const filter = isUUID ? `id=eq.${slug}` : `slug=eq.${slug}`
      
      console.log('Fetching with filter:', filter)
      
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/venues?select=id,name,slug&${filter}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      )
      
      const data = await res.json()
      console.log('API Response:', data)
      
      if (!data || data.length === 0) {
        setError('Mekan bulunamadı')
        setLoading(false)
        return
      }

      const venue = data[0]
      console.log('Found:', venue.name)

      localStorage.setItem('current_venue_id', venue.id)
      if (tableNumber) localStorage.setItem('current_table', tableNumber)
      
      router.replace(`/venue/${venue.id}${tableNumber ? `?table=${tableNumber}` : ''}`)
    } catch (err: any) {
      console.error('Error:', err)
      setError('Hata: ' + err.message)
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Hata</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-orange-500 text-white rounded-xl">
            Ana Sayfa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <UtensilsCrossed className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-white">Menü yükleniyor...</p>
        {tableNumber && <p className="text-gray-400 text-sm mt-2">Masa {tableNumber}</p>}
      </div>
    </div>
  )
}
