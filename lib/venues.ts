import { supabase } from './supabase'


export interface Place {
  id: string
  name: string
  category: string
  emoji: string
  lat: number
  lon: number
  address?: string
  district?: string
  neighborhood?: string
  rating?: number
  priceLevel?: number
  distance?: number
  features?: string[]
  isOrderEnabled: boolean
  venueId?: string
}

export interface SearchFilters {
  query?: string
  category?: string
  priceLevel?: number[]
  minRating?: number
  district?: string
  maxDistance?: number
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍸',
  beach: '🏖️',
  fast_food: '🍔',
  nightclub: '🎉',
  pub: '🍺'
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Math.round(R * c * 10) / 10
}

export const fetchOrderVenues = async (lat: number, lon: number, filters: SearchFilters = {}): Promise<Place[]> => {
  console.log('📡 Supabase sorgusu başlıyor...')
  
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, district, neighborhood, category, cuisine_type, lat, lon, rating, price_level, features, address')
    .eq('is_active', true)

  console.log('📡 Supabase sonuç:', { dataLength: data?.length, error })

  if (error || !data) {
    console.error('Supabase error:', error)
    return []
  }

  let venues: Place[] = data.map(v => ({
    id: `order-${v.id}`,
    venueId: v.id,
    name: v.name,
    category: v.cuisine_type || v.category || 'restaurant',
    emoji: categoryEmojis[v.category] || '🍽️',
    lat: parseFloat(String(v.lat)) || 0,
    lon: parseFloat(String(v.lon)) || 0,
    address: v.address,
    district: v.district,
    neighborhood: v.neighborhood,
    rating: v.rating,
    priceLevel: v.price_level,
    distance: calculateDistance(lat, lon, parseFloat(String(v.lat)) || 0, parseFloat(String(v.lon)) || 0),
    features: v.features || [],
    isOrderEnabled: true
  }))

  // Filters
  if (filters.query) {
    const q = filters.query.toLowerCase()
    venues = venues.filter(v => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q))
  }
  if (filters.district) venues = venues.filter(v => v.district === filters.district)
  if (filters.category) venues = venues.filter(v => v.category === filters.category)
  if (filters.minRating) venues = venues.filter(v => (v.rating || 0) >= filters.minRating!)
  if (filters.maxDistance) venues = venues.filter(v => (v.distance || 999) <= filters.maxDistance!)

  return venues.sort((a, b) => (a.distance || 999) - (b.distance || 999))
}

export const fetchNearbyPlaces = async (lat: number, lon: number, radius: number = 3000, category?: string): Promise<Place[]> => {
  try {
    const types = category ? [category] : ['restaurant', 'cafe', 'bar', 'fast_food']
    const amenityQuery = types.map(t => `node["amenity"="${t}"](around:${radius},${lat},${lon});`).join('')
    const query = `[out:json][timeout:8];(${amenityQuery});out body 30;`

    const controller = new AbortController()
    setTimeout(() => controller.abort(), 6000)

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: controller.signal
    })

    if (!res.ok) return []
    const data = await res.json()
    if (!data.elements) return []

    return data.elements
      .filter((el: any) => el.tags?.name)
      .slice(0, 30)
      .map((el: any) => ({
        id: `osm-${el.id}`,
        name: el.tags.name,
        category: el.tags.amenity || 'restaurant',
        emoji: categoryEmojis[el.tags.amenity] || '🍽️',
        lat: el.lat,
        lon: el.lon,
        district: el.tags['addr:district'],
        rating: +(Math.random() * 1.5 + 3.5).toFixed(1),
        priceLevel: Math.floor(Math.random() * 3) + 1,
        distance: calculateDistance(lat, lon, el.lat, el.lon),
        isOrderEnabled: false
      }))
  } catch {
    console.log('⚠️ OSM timeout')
    return []
  }
}

export const searchPlaces = async (lat: number, lon: number, filters: SearchFilters = {}): Promise<Place[]> => {
  console.log('🔍 searchPlaces:', { lat, lon })
  
  const radius = (filters.maxDistance || 5) * 1000
  
  const orderVenues = await fetchOrderVenues(lat, lon, filters)
  console.log('✅ ORDER:', orderVenues.length)

  let nearbyPlaces: Place[] = []
  if (!filters.query && !filters.district) {
    nearbyPlaces = await fetchNearbyPlaces(lat, lon, radius, filters.category)
    console.log('✅ OSM:', nearbyPlaces.length)
  }

  const orderCoords = new Set(orderVenues.map(v => `${v.lat.toFixed(3)},${v.lon.toFixed(3)}`))
  const filtered = nearbyPlaces.filter(p => !orderCoords.has(`${p.lat.toFixed(3)},${p.lon.toFixed(3)}`))

  return [...orderVenues, ...filtered]
}

export const getUserLocation = (): Promise<{lat: number, lon: number, address: string}> => {
  return new Promise((resolve) => {
    const defaultLocation = { lat: 40.9662, lon: 29.0287, address: 'Kadıköy' }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(defaultLocation)
      return
    }

    const timeout = setTimeout(() => resolve(defaultLocation), 5000)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timeout)
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          const data = await res.json()
          resolve({ lat, lon, address: data.address?.neighbourhood || data.address?.suburb || 'Konum' })
        } catch {
          resolve({ lat, lon, address: 'Konum' })
        }
      },
      () => { clearTimeout(timeout); resolve(defaultLocation) },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
    )
  })
}

export const istanbulDistricts = [
  'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
  'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
  'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
  'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
  'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
  'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
  'Ümraniye', 'Üsküdar', 'Zeytinburnu'
]
