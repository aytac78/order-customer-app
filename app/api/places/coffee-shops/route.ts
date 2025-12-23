import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '3000'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 })
  }

  try {
    // Google Places API - Nearby Search for cafes
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}&radius=${radius}&type=cafe&keyword=coffee&key=${GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message)
      return NextResponse.json({ error: data.error_message || data.status }, { status: 500 })
    }

    // Calculate distance for each place
    const shops = (data.results || []).map((place: any) => {
      const placeLat = place.geometry?.location?.lat
      const placeLng = place.geometry?.location?.lng
      
      let distance_km = 0
      if (placeLat && placeLng) {
        distance_km = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          placeLat,
          placeLng
        )
      }

      return {
        ...place,
        distance_km: Math.round(distance_km * 100) / 100
      }
    })

    // Sort by distance
    shops.sort((a: any, b: any) => a.distance_km - b.distance_km)

    return NextResponse.json({ 
      shops,
      count: shops.length 
    })
  } catch (error) {
    console.error('Error fetching coffee shops:', error)
    return NextResponse.json({ error: 'Failed to fetch coffee shops' }, { status: 500 })
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
