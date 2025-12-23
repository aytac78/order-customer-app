'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Star, 
  Coffee, 
  Heart, 
  Navigation,
  SlidersHorizontal,
  Wifi,
  Dog,
  Laptop,
  Leaf,
  X,
  Map as MapIcon,
  List,
  Clock,
  Gift,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { useCoffeestar } from '@/lib/coffeestar-context'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface CoffeeShop {
  id: string
  place_id: string
  name: string
  address: string
  lat: number
  lng: number
  rating: number
  user_ratings_total: number
  price_level: number
  photo_url?: string
  is_open?: boolean
  distance_km?: number
  features: string[]
}

export default function CoffeestarPage() {
  const router = useRouter()
  const { stats, freeBalance, getLevelConfig } = useCoffeestar()
  
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([])
  const [filteredShops, setFilteredShops] = useState<CoffeeShop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  
  const [filters, setFilters] = useState({
    isOpen: false,
    hasWifi: false,
    minRating: 0
  })

  const levelConfig = stats ? getLevelConfig(stats.level) : null

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          })
        },
        () => {
          setUserLocation({ lat: 41.0082, lng: 28.9784 })
        }
      )
    } else {
      setUserLocation({ lat: 41.0082, lng: 28.9784 })
    }
  }, [])

  const fetchCoffeeShops = useCallback(async () => {
    if (!userLocation) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/places/coffee-shops?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000`
      )
      const data = await response.json()
      
      if (data.shops) {
        const shops: CoffeeShop[] = data.shops.map((place: any) => ({
          id: place.place_id,
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address || '',
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          rating: place.rating || 0,
          user_ratings_total: place.user_ratings_total || 0,
          price_level: place.price_level || 2,
          photo_url: place.photos?.[0]?.photo_reference 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
            : null,
          is_open: place.opening_hours?.open_now,
          distance_km: place.distance_km,
          features: detectFeatures(place)
        }))
        
        setCoffeeShops(shops)
        setFilteredShops(shops)
      }
    } catch (err) {
      console.error('Error fetching coffee shops:', err)
    } finally {
      setLoading(false)
    }
  }, [userLocation])

  const detectFeatures = (place: any): string[] => {
    const features: string[] = []
    if (Math.random() > 0.3) features.push('wifi')
    if (Math.random() > 0.6) features.push('outdoor')
    if (Math.random() > 0.7) features.push('pet_friendly')
    if (place.rating >= 4.5) features.push('specialty')
    return features
  }

  useEffect(() => {
    if (userLocation) {
      fetchCoffeeShops()
    }
  }, [userLocation, fetchCoffeeShops])

  useEffect(() => {
    let result = [...coffeeShops]
    
    if (searchQuery) {
      result = result.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (filters.isOpen) {
      result = result.filter(shop => shop.is_open)
    }
    if (filters.hasWifi) {
      result = result.filter(shop => shop.features.includes('wifi'))
    }
    if (filters.minRating > 0) {
      result = result.filter(shop => shop.rating >= filters.minRating)
    }
    
    setFilteredShops(result)
  }, [coffeeShops, searchQuery, filters])

  const toggleFavorite = (shopId: string) => {
    setFavorites(prev => 
      prev.includes(shopId) 
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    )
  }

  const coffeesUntilFree = freeBalance?.next_free_in || 10

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-transparent pb-4">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Coffeestar</h1>
                <p className="text-xs text-amber-400">☕ Kahvenin yıldızı</p>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/coffeestar/stats')}
              className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"
            >
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </button>
          </div>

          {/* Stats Banner */}
          <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-2xl p-4 border border-amber-500/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{stats?.total_coffees || 0}</p>
                  <p className="text-xs text-amber-200/60">Kahve</p>
                </div>
                <div className="w-px h-10 bg-amber-500/20" />
                <div className="text-center">
                  <p className="text-2xl">{levelConfig?.emoji || '☕'}</p>
                  <p className="text-xs text-amber-200/60">{levelConfig?.name || 'Çaylak'}</p>
                </div>
                <div className="w-px h-10 bg-amber-500/20" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{freeBalance?.available || 0}</p>
                  <p className="text-xs text-amber-200/60">Bedava</p>
                </div>
              </div>
              
              <button 
                onClick={() => router.push('/coffeestar/stats')}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 rounded-full text-amber-400 text-sm"
              >
                <Gift className="w-4 h-4" />
                <span>Detaylar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-200/60">{coffeesUntilFree} kahve daha → Bedava!</span>
                <span className="text-amber-400">{10 - coffeesUntilFree}/10</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  style={{ width: `${((10 - coffeesUntilFree) / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Coffee shop ara..."
              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setFilters(f => ({ ...f, isOpen: !f.isOpen }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filters.isOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                Açık
              </button>
              
              <button
                onClick={() => setFilters(f => ({ ...f, hasWifi: !f.hasWifi }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filters.hasWifi ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Wifi className="w-4 h-4" />
                WiFi
              </button>
              
              <button
                onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === 4 ? 0 : 4 }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filters.minRating > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Star className="w-4 h-4" />
                4+ Puan
              </button>
            </div>
            
            <div className="flex items-center bg-white/5 rounded-lg p-1 ml-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {loading ? 'Aranıyor...' : `${filteredShops.length} coffee shop bulundu`}
          </p>
          {userLocation && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Navigation className="w-3 h-3" />
              <span>Yakınında</span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-white/10 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-white/10 rounded w-3/4" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-4 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coffee Shop List */}
        {!loading && viewMode === 'list' && (
          <div className="space-y-4">
            {filteredShops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => router.push(`/coffeestar/${shop.place_id}`)}
                className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-amber-500/30 transition-all text-left group"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-amber-900/50 to-orange-900/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {shop.photo_url ? (
                      <img 
                        src={shop.photo_url} 
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Coffee className="w-8 h-8 text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate pr-2">
                        {shop.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(shop.id)
                        }}
                        className="flex-shrink-0"
                      >
                        <Heart className={`w-5 h-5 ${favorites.includes(shop.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{shop.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-400">
                        {shop.user_ratings_total} değerlendirme
                      </span>
                      {shop.is_open !== undefined && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className={`text-sm ${shop.is_open ? 'text-green-400' : 'text-red-400'}`}>
                            {shop.is_open ? 'Açık' : 'Kapalı'}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 truncate mb-2">{shop.address}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {shop.features.slice(0, 3).map((feature) => (
                        <div 
                          key={feature}
                          className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-gray-400"
                        >
                          {feature === 'wifi' && '📶 WiFi'}
                          {feature === 'outdoor' && '🌳 Açık Alan'}
                          {feature === 'pet_friendly' && '🐕 Pet'}
                          {feature === 'specialty' && '⭐ Specialty'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {shop.distance_km && (
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Navigation className="w-4 h-4" />
                      <span>{shop.distance_km < 1 ? `${Math.round(shop.distance_km * 1000)}m` : `${shop.distance_km.toFixed(1)}km`}</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredShops.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="font-semibold mb-2">Coffee shop bulunamadı</h3>
            <p className="text-sm text-gray-500">Filtreleri değiştirmeyi dene</p>
          </div>
        )}
      </div>
    </div>
  )
}
