import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY

// Simple in-memory cache (5 dakika)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '3000'
  const type = searchParams.get('type') || 'restaurant'
  const keyword = searchParams.get('keyword') || ''

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 })
  }

  // Cache key
  const roundedLat = Math.round(parseFloat(lat) * 100) / 100
  const roundedLng = Math.round(parseFloat(lng) * 100) / 100
  const cacheKey = `${roundedLat},${roundedLng},${radius},${type},${keyword}`

  // Cache kontrolü
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data, {
      headers: { 'X-Cache': 'HIT' }
    })
  }

  try {
    let url: string
    
    if (keyword) {
      // Text Search API - arama için
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`
    } else {
      // Nearby Search API - normal listeleme için
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`
    }
    
    const response = await fetch(url)
    const data = await response.json()

    // Cache'e kaydet
    cache.set(cacheKey, { data, timestamp: Date.now() })

    // Eski cache'leri temizle
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' }
    })
  } catch (error) {
    console.error('Google Places API error:', error)
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
