'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Star, X, Loader2, Package, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Place {
  id: string
  name: string
  category: string
  emoji: string
  lat: number
  lon: number
  address?: string
  rating?: number
  distance?: number
  isOrderEnabled: boolean
  isOpen?: boolean
}

const categories = [
  { id: 'all', label: 'Tümü', emoji: '🍽️' },
  { id: 'restaurant', label: 'Restoran', emoji: '🍽️' },
  { id: 'cafe', label: 'Kafe', emoji: '☕' },
  { id: 'bar', label: 'Bar', emoji: '🍸' },
  { id: 'fast_food', label: 'Fast Food', emoji: '🍔' },
  { id: 'beach_club', label: 'Beach Club', emoji: '🏖️' },
  { id: 'night_club', label: 'Gece Kulübü', emoji: '🎉' },
]

const categoryToEmoji: Record<string, string> = {
  restaurant: '🍽️', cafe: '☕', bar: '🍸', night_club: '🎉',
  fast_food: '🍔', bakery: '🥐', beach_club: '🏖️',
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10
}

function DiscoverContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  
  const [allPlaces, setAllPlaces] = useState<Place[]>([]) // Tüm ORDER mekanları
  const [places, setPlaces] = useState<Place[]>([]) // Gösterilen mekanlar
  const [loading, setLoading] = useState(true)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address: string}>({ 
    lat: 40.9662, lng: 29.0751, address: 'Konum alınıyor...' 
  })
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (mode === 'takeaway') localStorage.setItem('order_mode', 'takeaway')
  }, [mode])

  useEffect(() => {
    getLocation()
  }, [])

  // Debounced search - arama terimi değiştiğinde
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchTerm || searchTerm.length < 2) {
      // Arama boşsa normal listeye dön
      applyFilters(allPlaces, '', selectedCategory)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(searchTerm)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Kategori değiştiğinde filtrele
  useEffect(() => {
    applyFilters(allPlaces, searchTerm, selectedCategory)
  }, [selectedCategory])

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setUserLocation(prev => ({ ...prev, lat, lng }))
          
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(res => res.json())
            .then(data => setUserLocation(prev => ({ ...prev, address: data.address?.neighbourhood || data.address?.suburb || 'Konum alındı' })))
            .catch(() => {})
          
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
    
    // 1. ORDER mekanları
    const { data: venues } = await supabase.from('venues').select('*').eq('is_active', true)
    
    const orderPlaces: Place[] = (venues || []).map(v => ({
      id: `order-${v.id}`,
      name: v.name,
      category: v.category || 'restaurant',
      emoji: categoryToEmoji[v.category] || '🍽️',
      lat: parseFloat(String(v.lat)) || lat,
      lon: parseFloat(String(v.lon)) || lng,
      address: v.address,
      rating: v.rating,
      distance: v.lat && v.lon ? calculateDistance(lat, lng, parseFloat(String(v.lat)), parseFloat(String(v.lon))) : 0,
      isOrderEnabled: true,
    }))

    setAllPlaces(orderPlaces)
    setPlaces(orderPlaces.sort((a, b) => (a.distance || 999) - (b.distance || 999)))
    setLoading(false)

    // 2. Google Places - arka planda
    setLoadingGoogle(true)
    try {
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=3000&type=restaurant`)
      const data = await res.json()
      
      if (data.results) {
        const orderCoords = new Set(orderPlaces.map(v => `${v.lat.toFixed(3)},${v.lon.toFixed(3)}`))
        
        const googlePlaces: Place[] = data.results
          .filter((p: any) => !orderCoords.has(`${p.geometry.location.lat.toFixed(3)},${p.geometry.location.lng.toFixed(3)}`))
          .slice(0, 20)
          .map((p: any) => ({
            id: `google-${p.place_id}`,
            name: p.name,
            category: 'restaurant',
            emoji: '🍽️',
            lat: p.geometry.location.lat,
            lon: p.geometry.location.lng,
            address: p.vicinity,
            rating: p.rating,
            distance: calculateDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
            isOrderEnabled: false,
            isOpen: p.opening_hours?.open_now
          }))

        const combined = [...orderPlaces, ...googlePlaces].sort((a, b) => {
          if (a.isOrderEnabled && !b.isOrderEnabled) return -1
          if (!a.isOrderEnabled && b.isOrderEnabled) return 1
          return (a.distance || 999) - (b.distance || 999)
        })
        
        setAllPlaces(combined)
        setPlaces(combined)
      }
    } catch (err) {
      console.error('Google Places error:', err)
    }
    setLoadingGoogle(false)
  }

  // Google API ile arama
  const searchPlaces = async (query: string) => {
    setSearching(true)
    
    try {
      const res = await fetch(`/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000&type=restaurant&keyword=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      if (data.results && data.results.length > 0) {
        const googlePlaces: Place[] = data.results.map((p: any) => ({
          id: `google-${p.place_id}`,
          name: p.name,
          category: 'restaurant',
          emoji: '🍽️',
          lat: p.geometry.location.lat,
          lon: p.geometry.location.lng,
          address: p.formatted_address || p.vicinity,
          rating: p.rating,
          distance: calculateDistance(userLocation.lat, userLocation.lng, p.geometry.location.lat, p.geometry.location.lng),
          isOrderEnabled: false,
          isOpen: p.opening_hours?.open_now
        }))
        
        // ORDER mekanlarından eşleşenler
        const orderMatches = allPlaces.filter(p => 
          p.isOrderEnabled && p.name.toLowerCase().includes(query.toLowerCase())
        )
        
        // Birleştir ve sırala
        const combined = [...orderMatches, ...googlePlaces].sort((a, b) => {
          if (a.isOrderEnabled && !b.isOrderEnabled) return -1
          if (!a.isOrderEnabled && b.isOrderEnabled) return 1
          return (a.distance || 999) - (b.distance || 999)
        })
        
        setPlaces(combined)
      } else {
        // Google sonuç bulamadıysa sadece local'de ara
        const localMatches = allPlaces.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase())
        )
        setPlaces(localMatches)
      }
    } catch (err) {
      console.error('Search error:', err)
      // Hata durumunda local'de ara
      const localMatches = allPlaces.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
      )
      setPlaces(localMatches)
    }
    
    setSearching(false)
  }

  // Filtre uygula
  const applyFilters = (placesToFilter: Place[], search: string, category: string) => {
    let filtered = placesToFilter
    
    if (search && search.length >= 2) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    
    if (category !== 'all') {
      if (category === 'beach_club') {
        filtered = filtered.filter(p => p.category === 'beach_club' || p.name.toLowerCase().includes('beach'))
      } else {
        filtered = filtered.filter(p => p.category === category)
      }
    }
    
    setPlaces(filtered)
  }

  const handlePlaceClick = (place: Place) => {
    if (place.isOrderEnabled) {
      const venueId = place.id.replace('order-', '')
      router.push(`/venue/${venueId}`)
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`, '_blank')
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    applyFilters(allPlaces, '', 'all')
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
          <div className="flex items-center gap-2">
            {mode === 'takeaway' && (
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">Paket</span>
              </div>
            )}
            <button 
              onClick={() => loadPlaces(userLocation.lat, userLocation.lng)}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-full disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Döner, pizza, cafe ara..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500" 
          />
          {(searchTerm || searching) && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              ) : (
                <X className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-400">Mekanlar yükleniyor...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-2">
              {searchTerm ? `"${searchTerm}" için sonuç bulunamadı` : 'Mekan bulunamadı'}
            </p>
            <button onClick={clearSearch} className="text-orange-500 text-sm">
              Filtreleri temizle
            </button>
          </div>
        ) : (
          <>
            {searchTerm && (
              <p className="text-sm text-gray-400 mb-2">
                "{searchTerm}" için <span className="text-orange-500 font-medium">{places.length}</span> sonuç
              </p>
            )}
            
            {places.map(place => (
              <button 
                key={place.id} 
                onClick={() => handlePlaceClick(place)} 
                className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left hover:bg-[#222] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{place.name}</h3>
                      {place.isOrderEnabled && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs rounded-full font-medium">ORDER</span>
                      )}
                      {place.isOpen !== undefined && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${place.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {place.isOpen ? 'Açık' : 'Kapalı'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{place.address || `${place.distance} km`}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {place.rating && (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{place.distance} km</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#242424] rounded-lg flex items-center justify-center text-2xl ml-3">
                    {place.emoji}
                  </div>
                </div>
              </button>
            ))}
            
            {loadingGoogle && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin mr-2" />
                <span className="text-sm text-gray-400">Daha fazla mekan yükleniyor...</span>
              </div>
            )}
            
            {!searchTerm && (
              <p className="text-center text-sm text-gray-500 pt-2">
                <span className="text-orange-500 font-medium">{places.filter(p => p.isOrderEnabled).length}</span> ORDER
                {places.filter(p => !p.isOrderEnabled).length > 0 && (
                  <> • <span className="text-gray-300">{places.filter(p => !p.isOrderEnabled).length}</span> çevredeki</>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <DiscoverContent />
    </Suspense>
  )
}
