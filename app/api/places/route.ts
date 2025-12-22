import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '3000'
  const type = searchParams.get('type') || 'restaurant'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    // API key yoksa boş döndür - sadece ORDER mekanları gösterilecek
    return NextResponse.json({ results: [] })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Google Places API error:', error)
    return NextResponse.json({ results: [] })
  }
}
