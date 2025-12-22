// OpenStreetMap API ile gerçek mekan verisi

export interface Place {
  id: string
  name: string
  lat: number
  lon: number
  category: string
  address?: string
  distance?: number
  rating?: number
  emoji: string
  features?: string[]
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍺',
  pub: '🍻',
  fast_food: '🍔',
  nightclub: '🎵',
  beach_resort: '🏖️',
  ice_cream: '🍦',
  bakery: '🥐',
  default: '📍'
}

const categoryLabels: Record<string, string> = {
  restaurant: 'Restoran',
  cafe: 'Kafe',
  bar: 'Bar',
  pub: 'Pub',
  fast_food: 'Fast Food',
  nightclub: 'Gece Kulübü',
  beach_resort: 'Beach',
  ice_cream: 'Dondurmacı',
  bakery: 'Fırın',
  default: 'Mekan'
}

const allFeatures = ['Wi-Fi', 'Otopark', 'Açık Alan', 'Canlı Müzik', 'Deniz Manzarası', 'Pet Friendly']

// Rastgele özellik ata (demo için)
const getRandomFeatures = (): string[] => {
  const count = Math.floor(Math.random() * 4) + 1 // 1-4 özellik
  const shuffled = [...allFeatures].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Mesafe hesapla (km)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Overpass API ile mekan ara
export const searchPlaces = async (
  lat: number, 
  lon: number, 
  radius: number = 3000,
  category?: string
): Promise<Place[]> => {
  const amenities = category 
    ? [category]
    : ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'nightclub']
  
  const amenityFilter = amenities.map(a => `node["amenity"="${a}"](around:${radius},${lat},${lon});`).join('\n')
  
  const query = `
    [out:json][timeout:25];
    (
      ${amenityFilter}
    );
    out body 50;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    })
    
    const data = await response.json()
    
    const places: Place[] = data.elements
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const amenity = el.tags.amenity || 'default'
        const distance = calculateDistance(lat, lon, el.lat, el.lon)
        
        return {
          id: el.id.toString(),
          name: el.tags.name,
          lat: el.lat,
          lon: el.lon,
          category: categoryLabels[amenity] || categoryLabels.default,
          address: el.tags['addr:street'] || '',
          distance: Math.round(distance * 10) / 10,
          rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          emoji: categoryEmojis[amenity] || categoryEmojis.default,
          features: getRandomFeatures()
        }
      })
      .sort((a: Place, b: Place) => (a.distance || 0) - (b.distance || 0))
    
    return places
  } catch (error) {
    console.error('Places API error:', error)
    return []
  }
}

// Kullanıcı konumunu al
export const getUserLocation = (): Promise<{ lat: number; lon: number; address: string }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords
        
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          )
          const data = await res.json()
          const address = data.address?.suburb || data.address?.town || data.address?.city || 'Konum bulundu'
          resolve({ lat, lon, address })
        } catch {
          resolve({ lat, lon, address: 'Konum bulundu' })
        }
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}