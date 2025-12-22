'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Star, X, SlidersHorizontal, List, Map as MapIcon, Navigation, Loader2, Package } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ipobkbhcrkrqgbohdeea.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwb2JrYmhjcmtycWdib2hkZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzE1MjgsImV4cCI6MjA4MDAwNzUyOH0.QaUkRsv_B3Msc9qYmE366k1x_sTe8j5GxLUO3oKKg3w'
)

interface Place {
  id: string
  name: string
  category: string
  emoji: string
  lat: number
  lon: number
  address?: string
  district?: string
  rating?: number
  priceLevel?: number
  distance?: number
  isOrderEnabled: boolean
  venueId?: string
}

const categories = [
  { id: 'all', label: 'Tümü', emoji: '🍽️' },
  { id: 'restaurant', label: 'Restoran', emoji: '🍽️' },
  { id: 'cafe', label: 'Kafe', emoji: '☕' },
  { id: 'bar', label: 'Bar', emoji: '🍸' },
  { id: 'beach_club', label: 'Beach Club', emoji: '🏖️' },
  { id: 'fast_food', label: 'Fast Food', emoji: '🍔' },
  { id: 'nightclub', label: 'Gece Kulübü', emoji: '🎉' },
]

const typeToEmoji: Record<string, string> = {
  restaurant: '🍽️', cafe: '☕', bar: '🍸', night_club: '🎉', meal_takeaway: '🍔', 
  bakery: '🥐', meal_delivery: '🚴', beach_club: '🏖️', fast_food: '🍔', nightclub: '🎉'
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10
}

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // 'takeaway' or null
  
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address: string}>({ 
    lat: 40.9662, lng: 29.0751, address: 'Konum alınıyor...' 
  })
  const [maxDistance, setMaxDistance] = useState<number>(5)
  const [showFilters, setShowFilters] = useState(false)

  // Mode'u localStorage'a kaydet
  useEffect(() => {
    if (mode === 'takeaway') {
      localStorage.setItem('order_mode', 'takeaway')
    }
  }, [mode])

  useEffect(() => {
    getLocation()
  }, [])

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setUserLocation(prev => ({ ...prev, lat, lng }))
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            const data = await res.json()
            setUserLocation(prev => ({ 
              ...prev, 
              address: data.address?.neighbourhood || data.address?.suburb || data.address?.district || 'Konum alındı' 
            }))
          } catch {
            setUserLocation(prev => ({ ...prev, address: 'Konum alındı' }))
          }
          
          loadPlaces(lat, lng)
        },
        () => {
          setUserLocation(prev => ({ ...prev, address: 'Varsayılan konum' }))
          loadPlaces(40.9662, 29.0751)
        },
        { timeout: 5000 }
      )
    } else {
      loadPlaces(40.9662, 29.0751)
    }
  }

  const loadPlaces = async (lat: number, lng: number) => {
    setLoading(true)

    try {
      // 1. ORDER mekanları (Supabase)
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
      
      if (error) {
        console.error('Venues error:', error)
      }
      
      const orderPlaces: Place[] = (venues || []).map(v => ({
        id: `order-${v.id}`,
        venueId: v.id,
        name: v.name,
        category: v.category || 'restaurant',
        emoji: typeToEmoji[v.category] || '🍽️',
        lat: parseFloat(String(v.lat)) || lat,
        lon: parseFloat(String(v.lon)) || lng,
        address: v.address,
        district: v.district,
        rating: v.rating,
        priceLevel: v.price_level,
        distance: v.lat && v.lon ? calculateDistance(lat, lng, parseFloat(String(v.lat)), parseFloat(String(v.lon))) : 0,
        isOrderEnabled: true
      }))

      // 2. Google Places API (varsa)
      let googlePlaces: Place[] = []
      const googleTypes = ['restaurant', 'cafe', 'bar', 'meal_takeaway', 'night_club']
      
      for (const type of googleTypes) {
        try {
          const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=3000&type=${type}`)
          const data = await res.json()
          
          if (data.results && data.results.length > 0) {
            const typePlaces = data.results.map((p: any) => ({
              id: `google-${p.place_id}`,
              name: p.name,
              category: type === 'meal_takeaway' ? 'fast_food' : type === 'night_club' ? 'nightclub' : type,
              emoji: typeToEmoji[type] || '🍽️',
              lat: p.geometry.location.lat,
              lon: p.geometry.location.lng,
              address: p.vicinity,
              rating: p.rating,
              priceLevel: p.price_level,
              distance: calculateDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
              isOrderEnabled: false
            }))
            googlePlaces = [...googlePlaces, ...typePlaces]
          }
        } catch (err) {
          console.log('Google Places fetch error for type:', type)
        }
      }
      
      // Duplikasyonları kaldır
      const seen = new Set<string>()
      googlePlaces = googlePlaces.filter(p => {
        const key = `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // ORDER mekanları ile çakışanları kaldır
      const orderCoords = new Set(orderPlaces.map(v => `${v.lat.toFixed(3)},${v.lon.toFixed(3)}`))
      const filteredGoogle = googlePlaces.filter(p => !orderCoords.has(`${p.lat.toFixed(3)},${p.lon.toFixed(3)}`))

      // ORDER mekanları önce, sonra mesafeye göre sırala
      const allPlaces = [
        ...orderPlaces.sort((a, b) => (a.distance || 999) - (b.distance || 999)),
        ...filteredGoogle.sort((a, b) => (a.distance || 999) - (b.distance || 999))
      ]
      
      setPlaces(allPlaces)
    } catch (err) {
      console.error('Load places error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlaces = places.filter(p => {
    // Mesafe filtresi
    if (maxDistance && (p.distance || 0) > maxDistance) return false
    
    // Arama filtresi  
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    // Kategori filtresi
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'beach_club') {
        return p.category === 'beach_club' || p.name.toLowerCase().includes('beach')
      }
      if (selectedCategory === 'fast_food') {
        return p.category === 'fast_food' || p.category === 'meal_takeaway'
      }
      if (selectedCategory === 'nightclub') {
        return p.category === 'nightclub' || p.category === 'night_club'
      }
      return p.category === selectedCategory
    }
    
    return true
  })

  const handlePlaceClick = (place: Place) => {
    if (place.isOrderEnabled && place.venueId) {
      router.push(`/venue/${place.venueId}`)
    } else {
      // ORDER olmayan mekanlar için Google Maps'e yönlendir
      window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>{userLocation.address}</span>
          </div>
          {mode === 'takeaway' && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Paket Sipariş</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Mekan veya yemek ara..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500" 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${showFilters ? 'bg-orange-500' : 'bg-[#1a1a1a]'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Kategoriler */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-[#111] border-b border-white/5">
          <label className="text-sm text-gray-400 mb-2 block">Mesafe: {maxDistance} km</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={maxDistance} 
            onChange={(e) => setMaxDistance(parseInt(e.target.value))} 
            className="w-full accent-orange-500" 
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-400">Mekanlar yükleniyor...</p>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Mekan bulunamadı'}
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-orange-500 text-sm">
                Aramayı temizle
              </button>
            )}
          </div>
        ) : (
          <>
            {mode === 'takeaway' && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                <p className="text-purple-300 text-sm text-center">
                  📦 Paket sipariş modu aktif - ORDER etiketli mekanlardan sipariş verebilirsiniz
                </p>
              </div>
            )}
            
            {filteredPlaces.map(place => (
              <button 
                key={place.id} 
                onClick={() => handlePlaceClick(place)} 
                className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left hover:bg-[#222] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{place.name}</h3>
                      {place.isOrderEnabled && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs rounded-full">ORDER</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {place.address || place.district || `${place.distance} km uzakta`}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {place.rating && (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {place.rating}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{place.distance} km</span>
                      {place.priceLevel && (
                        <span className="text-sm text-gray-500">{'₺'.repeat(place.priceLevel)}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#242424] rounded-lg flex items-center justify-center text-2xl ml-3">
                    {place.emoji}
                  </div>
                </div>
              </button>
            ))}
            
            <p className="text-center text-sm text-gray-500 pt-2">
              <span className="text-orange-500">{filteredPlaces.filter(p => p.isOrderEnabled).length}</span> ORDER mekan
              {filteredPlaces.filter(p => !p.isOrderEnabled).length > 0 && (
                <> + <span className="text-gray-300">{filteredPlaces.filter(p => !p.isOrderEnabled).length}</span> çevredeki mekan</>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
