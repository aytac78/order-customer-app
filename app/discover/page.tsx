'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Search, MapPin, Star, X, Loader2, Package, RefreshCw, SlidersHorizontal,
  Check, Wine, Beer, UtensilsCrossed, Leaf, Baby, Car, Music, Radio,
  Waves, Sun, Calendar, DollarSign, Sparkles, Coffee, Users, Wallet
} from 'lucide-react'
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
  price_level?: number
  avg_price_per_person?: number
  has_gluten_free?: boolean
  has_vegan?: boolean
  has_vegetarian?: boolean
  has_pool?: boolean
  has_beach_access?: boolean
  has_dj?: boolean
  has_live_music?: boolean
  has_kids_area?: boolean
  has_parking?: boolean
  has_valet?: boolean
  has_reservation?: boolean
  reservation_available_today?: boolean
}

interface Filters {
  categories: string[]
  priceLevel: number[]
  budgetRange: { min: number; max: number } | null
  features: string[]
  dietary: string[]
  entertainment: string[]
  reservationToday: boolean
  searchQuery: string
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

const priceLevels = [
  { level: 1, label: '₺', desc: 'Ekonomik' },
  { level: 2, label: '₺₺', desc: 'Orta' },
  { level: 3, label: '₺₺₺', desc: 'Pahalı' },
  { level: 4, label: '₺₺₺₺', desc: 'Lüks' },
]

const budgetRanges = [
  { id: 'budget', label: '0 - 300₺', min: 0, max: 300, desc: 'Ekonomik', color: 'bg-green-500' },
  { id: 'mid', label: '300 - 600₺', min: 300, max: 600, desc: 'Orta Segment', color: 'bg-blue-500' },
  { id: 'high', label: '600 - 1000₺', min: 600, max: 1000, desc: 'Üst Segment', color: 'bg-purple-500' },
  { id: 'premium', label: '1000₺+', min: 1000, max: 99999, desc: 'Premium', color: 'bg-amber-500' },
]

const featureOptions = [
  { id: 'has_pool', label: 'Havuz', icon: Waves },
  { id: 'has_beach_access', label: 'Plaj', icon: Sun },
  { id: 'has_parking', label: 'Otopark', icon: Car },
  { id: 'has_valet', label: 'Vale', icon: Car },
  { id: 'has_kids_area', label: 'Çocuk Alanı', icon: Baby },
  { id: 'has_reservation', label: 'Rezervasyon', icon: Calendar },
]

const dietaryOptions = [
  { id: 'has_gluten_free', label: 'Glutensiz', icon: Leaf },
  { id: 'has_vegan', label: 'Vegan', icon: Leaf },
  { id: 'has_vegetarian', label: 'Vejetaryen', icon: Leaf },
]

const entertainmentOptions = [
  { id: 'has_live_music', label: 'Canlı Müzik', icon: Music },
  { id: 'has_dj', label: 'DJ', icon: Radio },
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

const estimateAvgPrice = (priceLevel?: number): number => {
  switch(priceLevel) {
    case 1: return 200
    case 2: return 450
    case 3: return 800
    case 4: return 1500
    default: return 500
  }
}

function DiscoverContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  
  const [allPlaces, setAllPlaces] = useState<Place[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address: string}>({ 
    lat: 40.9662, lng: 29.0751, address: 'Konum alınıyor...' 
  })
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const [filters, setFilters] = useState<Filters>({
    categories: [],
    priceLevel: [],
    budgetRange: null,
    features: [],
    dietary: [],
    entertainment: [],
    reservationToday: false,
    searchQuery: ''
  })

  useEffect(() => {
    if (mode === 'takeaway') localStorage.setItem('order_mode', 'takeaway')
  }, [mode])

  useEffect(() => { getLocation() }, [])

  useEffect(() => {
    applyFilters()
    countActiveFilters()
  }, [filters, allPlaces])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!filters.searchQuery || filters.searchQuery.length < 2) { applyFilters(); return }
    searchTimeoutRef.current = setTimeout(() => searchPlaces(filters.searchQuery), 500)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [filters.searchQuery])

  const countActiveFilters = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.priceLevel.length > 0) count++
    if (filters.budgetRange) count++
    if (filters.features.length > 0) count++
    if (filters.dietary.length > 0) count++
    if (filters.entertainment.length > 0) count++
    if (filters.reservationToday) count++
    setActiveFilterCount(count)
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude, lng = pos.coords.longitude
          setUserLocation(prev => ({ ...prev, lat, lng }))
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            .then(res => res.json())
            .then(data => setUserLocation(prev => ({ ...prev, address: data.address?.neighbourhood || data.address?.suburb || 'Konum alındı' })))
            .catch(() => {})
          loadPlaces(lat, lng)
        },
        () => { setUserLocation(prev => ({ ...prev, address: 'Varsayılan konum' })); loadPlaces(40.9662, 29.0751) },
        { timeout: 5000 }
      )
    } else { loadPlaces(40.9662, 29.0751) }
  }

  const loadPlaces = async (lat: number, lng: number) => {
    setLoading(true)
    const { data: venues } = await supabase.from('venues').select('*').eq('is_active', true)
    const orderPlaces: Place[] = (venues || []).map(v => ({
      id: `order-${v.id}`, name: v.name, category: v.category || 'restaurant', emoji: categoryToEmoji[v.category] || '🍽️',
      lat: parseFloat(String(v.lat)) || lat, lon: parseFloat(String(v.lon)) || lng, address: v.address, rating: v.rating,
      distance: v.lat && v.lon ? calculateDistance(lat, lng, parseFloat(String(v.lat)), parseFloat(String(v.lon))) : 0,
      isOrderEnabled: true, price_level: v.price_level,
      avg_price_per_person: v.avg_price_per_person || estimateAvgPrice(v.price_level),
      has_gluten_free: v.has_gluten_free, has_vegan: v.has_vegan, has_vegetarian: v.has_vegetarian, has_pool: v.has_pool,
      has_beach_access: v.has_beach_access, has_dj: v.has_dj, has_live_music: v.has_live_music, has_kids_area: v.has_kids_area,
      has_parking: v.has_parking, has_valet: v.has_valet, has_reservation: v.has_reservation,
      reservation_available_today: v.reservation_available_today,
    }))
    setAllPlaces(orderPlaces.sort((a, b) => (a.distance || 999) - (b.distance || 999)))
    setPlaces(orderPlaces.sort((a, b) => (a.distance || 999) - (b.distance || 999)))
    setLoading(false)

    setLoadingGoogle(true)
    try {
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=3000&type=restaurant`)
      const data = await res.json()
      if (data.results) {
        const orderCoords = new Set(orderPlaces.map(v => `${v.lat.toFixed(3)},${v.lon.toFixed(3)}`))
        const googlePlaces: Place[] = data.results.filter((p: any) => !orderCoords.has(`${p.geometry.location.lat.toFixed(3)},${p.geometry.location.lng.toFixed(3)}`))
          .slice(0, 20).map((p: any) => ({
            id: `google-${p.place_id}`, name: p.name, category: 'restaurant', emoji: '🍽️',
            lat: p.geometry.location.lat, lon: p.geometry.location.lng, address: p.vicinity, rating: p.rating,
            distance: calculateDistance(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
            isOrderEnabled: false, isOpen: p.opening_hours?.open_now,
            price_level: p.price_level,
            avg_price_per_person: estimateAvgPrice(p.price_level),
          }))
        const combined = [...orderPlaces, ...googlePlaces].sort((a, b) => {
          if (a.isOrderEnabled && !b.isOrderEnabled) return -1
          if (!a.isOrderEnabled && b.isOrderEnabled) return 1
          return (a.distance || 999) - (b.distance || 999)
        })
        setAllPlaces(combined)
        setPlaces(combined)
      }
    } catch (err) { console.error('Google Places error:', err) }
    setLoadingGoogle(false)
  }

  const searchPlaces = async (query: string) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5000&type=restaurant&keyword=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.results && data.results.length > 0) {
        const googlePlaces: Place[] = data.results.map((p: any) => ({
          id: `google-${p.place_id}`, name: p.name, category: 'restaurant', emoji: '🍽️',
          lat: p.geometry.location.lat, lon: p.geometry.location.lng, address: p.formatted_address || p.vicinity, rating: p.rating,
          distance: calculateDistance(userLocation.lat, userLocation.lng, p.geometry.location.lat, p.geometry.location.lng),
          isOrderEnabled: false, isOpen: p.opening_hours?.open_now,
          price_level: p.price_level,
          avg_price_per_person: estimateAvgPrice(p.price_level),
        }))
        const orderMatches = allPlaces.filter(p => p.isOrderEnabled && p.name.toLowerCase().includes(query.toLowerCase()))
        const combined = [...orderMatches, ...googlePlaces].sort((a, b) => {
          if (a.isOrderEnabled && !b.isOrderEnabled) return -1
          if (!a.isOrderEnabled && b.isOrderEnabled) return 1
          return (a.distance || 999) - (b.distance || 999)
        })
        setPlaces(combined)
      } else { setPlaces(allPlaces.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))) }
    } catch (err) { setPlaces(allPlaces.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))) }
    setSearching(false)
  }

  const applyFilters = () => {
    let result = [...allPlaces]
    if (filters.searchQuery && filters.searchQuery.length >= 2) return
    
    // Kategori filtresi - OR mantığı (Kafe VEYA Restoran)
    if (filters.categories.length > 0) {
      result = result.filter(p => {
        // ORDER mekanları için category alanını kontrol et
        if (p.isOrderEnabled) {
          return filters.categories.includes(p.category)
        }
        // Google mekanları için - restaurant kategorisi seçiliyse göster
        return filters.categories.includes('restaurant') || filters.categories.includes('cafe')
      })
    }
    
    // Fiyat seviyesi filtresi
    if (filters.priceLevel.length > 0) {
      result = result.filter(p => p.price_level && filters.priceLevel.includes(p.price_level))
    }
    
    // Bütçe filtresi
    if (filters.budgetRange) {
      result = result.filter(p => {
        const avgPrice = p.avg_price_per_person || estimateAvgPrice(p.price_level)
        return avgPrice >= filters.budgetRange!.min && avgPrice <= filters.budgetRange!.max
      })
    }
    
    // Dietary filtresi - sadece ORDER mekanlara uygula, Google mekanlarını dahil etme
    if (filters.dietary.length > 0) {
      result = result.filter(p => {
        // Google mekanlarında bu bilgi yok, onları hariç tut
        if (!p.isOrderEnabled) return false
        // ORDER mekanlarında en az biri true olmalı (OR mantığı)
        return filters.dietary.some(d => (p as any)[d] === true)
      })
    }
    
    // Features filtresi - sadece ORDER mekanlara uygula
    if (filters.features.length > 0) {
      result = result.filter(p => {
        if (!p.isOrderEnabled) return false
        return filters.features.every(f => (p as any)[f] === true)
      })
    }
    
    // Entertainment filtresi - sadece ORDER mekanlara uygula
    if (filters.entertainment.length > 0) {
      result = result.filter(p => {
        if (!p.isOrderEnabled) return false
        return filters.entertainment.some(e => (p as any)[e] === true)
      })
    }
    
    // Rezervasyon filtresi
    if (filters.reservationToday) {
      result = result.filter(p => {
        if (!p.isOrderEnabled) return false
        return p.reservation_available_today === true
      })
    }
    
    setPlaces(result)
  }

  const toggleArrayFilter = (category: 'categories' | 'priceLevel' | 'features' | 'dietary' | 'entertainment', value: string | number) => {
    setFilters(prev => {
      const arr = prev[category] as any[]
      if (arr.includes(value)) return { ...prev, [category]: arr.filter(v => v !== value) }
      return { ...prev, [category]: [...arr, value] }
    })
  }

  const setBudgetRange = (range: { min: number; max: number } | null) => {
    setFilters(prev => ({ ...prev, budgetRange: range }))
  }

  const clearFilters = () => {
    setFilters({ categories: [], priceLevel: [], budgetRange: null, features: [], dietary: [], entertainment: [], reservationToday: false, searchQuery: '' })
  }

  const handlePlaceClick = (place: Place) => {
    if (place.isOrderEnabled) router.push(`/venue/${place.id.replace('order-', '')}`)
    else window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`, '_blank')
  }

  // Aktif özel filtrelerin sayısını hesapla (dietary, features, entertainment, reservation)
  const hasOrderOnlyFilters = filters.dietary.length > 0 || filters.features.length > 0 || filters.entertainment.length > 0 || filters.reservationToday

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
            <button type="button" onClick={() => setShowFilterModal(true)} className="relative p-2 hover:bg-white/10 rounded-full">
              <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>}
            </button>
            <button type="button" onClick={() => loadPlaces(userLocation.lat, userLocation.lng)} disabled={loading} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Döner, pizza, cafe ara..." value={filters.searchQuery} onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500" />
          {(filters.searchQuery || searching) && (
            <button type="button" onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2">
              {searching ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> : <X className="w-4 h-4 text-gray-500" />}
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button type="button" key={cat.id} onClick={() => { if (cat.id === 'all') setFilters(prev => ({ ...prev, categories: [] })); else toggleArrayFilter('categories', cat.id) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${(cat.id === 'all' && filters.categories.length === 0) || filters.categories.includes(cat.id) ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}>
              <span>{cat.emoji}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aktif Filtreler */}
      {activeFilterCount > 0 && (
        <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-b border-white/5">
          <span className="text-xs text-gray-400">Filtreler:</span>
          {filters.categories.map(c => (
            <span key={c} className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs flex items-center gap-1">
              {categories.find(cat => cat.id === c)?.label}<button type="button" onClick={() => toggleArrayFilter('categories', c)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.budgetRange && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
              {budgetRanges.find(b => b.min === filters.budgetRange?.min)?.label}
              <button type="button" onClick={() => setBudgetRange(null)}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.dietary.map(d => (
            <span key={d} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs flex items-center gap-1">
              {dietaryOptions.find(opt => opt.id === d)?.label}<button type="button" onClick={() => toggleArrayFilter('dietary', d)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.entertainment.map(e => (
            <span key={e} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
              {entertainmentOptions.find(opt => opt.id === e)?.label}<button type="button" onClick={() => toggleArrayFilter('entertainment', e)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.features.map(f => (
            <span key={f} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
              {featureOptions.find(opt => opt.id === f)?.label}<button type="button" onClick={() => toggleArrayFilter('features', f)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.reservationToday && (
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs flex items-center gap-1">
              Bugün Müsait<button type="button" onClick={() => setFilters(prev => ({ ...prev, reservationToday: false }))}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button type="button" onClick={clearFilters} className="text-xs text-red-400 underline ml-2">Temizle</button>
        </div>
      )}

      {/* ORDER Only Filter Info */}
      {hasOrderOnlyFilters && (
        <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20">
          <p className="text-xs text-orange-400">
            ℹ️ Seçili filtreler sadece ORDER üyesi mekanlarda geçerlidir
          </p>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-20"><Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" /><p className="text-gray-400">Mekanlar yükleniyor...</p></div>
        ) : places.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-2">{filters.searchQuery ? `"${filters.searchQuery}" için sonuç bulunamadı` : 'Bu filtrelere uygun mekan bulunamadı'}</p>
            {hasOrderOnlyFilters && <p className="text-xs text-gray-500 mb-3">Seçili özellikler sadece ORDER üyesi mekanlarda aranıyor</p>}
            <button type="button" onClick={clearFilters} className="text-orange-500 text-sm">Filtreleri temizle</button>
          </div>
        ) : (
          <>
            {filters.searchQuery && <p className="text-sm text-gray-400 mb-2">"{filters.searchQuery}" için <span className="text-orange-500 font-medium">{places.length}</span> sonuç</p>}
            {places.map(place => (
              <button type="button" key={place.id} onClick={() => handlePlaceClick(place)} className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left hover:bg-[#222] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{place.name}</h3>
                      {place.isOrderEnabled && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs rounded-full font-medium">ORDER</span>}
                      {place.isOpen !== undefined && <span className={`px-2 py-0.5 text-xs rounded-full ${place.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{place.isOpen ? 'Açık' : 'Kapalı'}</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{place.address || `${place.distance} km`}</p>
                    {place.isOrderEnabled && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {place.has_gluten_free && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Glutensiz</span>}
                        {place.has_vegan && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Vegan</span>}
                        {place.has_vegetarian && <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Vejetaryen</span>}
                        {place.has_live_music && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Canlı Müzik</span>}
                        {place.has_dj && <span className="text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">DJ</span>}
                        {place.has_pool && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Havuz</span>}
                        {place.reservation_available_today && <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">Bugün Müsait</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {place.rating && <span className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{place.rating.toFixed(1)}</span>}
                      <span className="text-sm text-gray-500">{place.distance} km</span>
                      {place.price_level && <span className="text-sm text-gray-500">{'₺'.repeat(place.price_level)}</span>}
                      {place.avg_price_per_person && <span className="text-sm text-gray-500">~{place.avg_price_per_person}₺/kişi</span>}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#242424] rounded-lg flex items-center justify-center text-2xl ml-3">{place.emoji}</div>
                </div>
              </button>
            ))}
            {loadingGoogle && (
              <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 text-orange-500 animate-spin mr-2" /><span className="text-sm text-gray-400">Daha fazla mekan yükleniyor...</span></div>
            )}
            {!filters.searchQuery && (
              <p className="text-center text-sm text-gray-500 pt-2">
                <span className="text-orange-500 font-medium">{places.filter(p => p.isOrderEnabled).length}</span> ORDER
                {places.filter(p => !p.isOrderEnabled).length > 0 && <> • <span className="text-gray-300">{places.filter(p => !p.isOrderEnabled).length}</span> çevredeki</>}
              </p>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <div className="absolute inset-x-0 bottom-0 bg-[#1a1a1a] rounded-t-3xl flex flex-col" style={{ height: '60vh', marginBottom: '80px' }}>
            <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold">Filtreler</h2>
              <button type="button" onClick={() => setShowFilterModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Kategori */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-orange-500" />Kategori</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <button type="button" key={cat.id} onClick={() => toggleArrayFilter('categories', cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${filters.categories.includes(cat.id) ? 'bg-orange-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                      <span>{cat.emoji}</span>{cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kişi Başı Bütçe */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-orange-500" />Kişi Başı Bütçe</h3>
                <div className="grid grid-cols-2 gap-2">
                  {budgetRanges.map(range => (
                    <button type="button" key={range.id} onClick={() => setBudgetRange(filters.budgetRange?.min === range.min ? null : { min: range.min, max: range.max })}
                      className={`px-4 py-3 rounded-xl text-sm text-left ${filters.budgetRange?.min === range.min ? `${range.color} text-white` : 'bg-[#242424] text-gray-300'}`}>
                      <p className="font-medium">{range.label}</p>
                      <p className="text-xs opacity-70">{range.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fiyat Seviyesi */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-orange-500" />Fiyat Seviyesi</h3>
                <div className="flex flex-wrap gap-2">
                  {priceLevels.map(p => (
                    <button type="button" key={p.level} onClick={() => toggleArrayFilter('priceLevel', p.level)}
                      className={`px-4 py-2 rounded-xl text-sm ${filters.priceLevel.includes(p.level) ? 'bg-amber-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                      {p.label} <span className="text-xs opacity-70">({p.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ORDER Üyesi Filtreler */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-orange-400 mb-4">🏷️ Aşağıdaki filtreler sadece ORDER üyesi mekanlarda geçerlidir</p>
                
                {/* Diyet Seçenekleri */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Leaf className="w-4 h-4 text-orange-500" />Diyet Seçenekleri</h3>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map(opt => (
                      <button type="button" key={opt.id} onClick={() => toggleArrayFilter('dietary', opt.id)}
                        className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${filters.dietary.includes(opt.id) ? 'bg-emerald-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                        <opt.icon className="w-4 h-4" />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eğlence */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-orange-500" />Eğlence</h3>
                  <div className="flex flex-wrap gap-2">
                    {entertainmentOptions.map(opt => (
                      <button type="button" key={opt.id} onClick={() => toggleArrayFilter('entertainment', opt.id)}
                        className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${filters.entertainment.includes(opt.id) ? 'bg-purple-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                        <opt.icon className="w-4 h-4" />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Özellikler */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-500" />Özellikler</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {featureOptions.map(opt => (
                      <button type="button" key={opt.id} onClick={() => toggleArrayFilter('features', opt.id)}
                        className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${filters.features.includes(opt.id) ? 'bg-blue-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                        <opt.icon className="w-4 h-4" />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bugün Rezervasyon */}
                <div className="pb-2">
                  <button type="button" onClick={() => setFilters(prev => ({ ...prev, reservationToday: !prev.reservationToday }))}
                    className={`w-full px-4 py-4 rounded-xl text-sm flex items-center justify-between ${filters.reservationToday ? 'bg-cyan-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                    <span className="flex items-center gap-3"><Calendar className="w-5 h-5" /><span>Bugün Rezervasyon Müsait</span></span>
                    {filters.reservationToday && <Check className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 py-4 border-t border-white/10 flex gap-3 flex-shrink-0 bg-[#1a1a1a]">
              <button type="button" onClick={clearFilters} className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium">Temizle</button>
              <button type="button" onClick={() => setShowFilterModal(false)} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium">{places.length} Sonuç Göster</button>
            </div>
          </div>
        </div>
      )}
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