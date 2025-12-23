'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Search, MapPin, Star, X, Loader2, Package, RefreshCw, SlidersHorizontal,
  Check, Wine, Beer, UtensilsCrossed, Leaf, Baby, Car, Music, Radio,
  Waves, Sun, Calendar, DollarSign, Filter, Sparkles, Users, Heart, Coffee, ChevronDown, Pizza, Fish, Beef, Salad
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
  beer_price_max?: number
  cocktail_price_max?: number
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
  features?: string[]
  cuisine_type?: string
}

interface DrinkFilter {
  type: string
  maxPrice: number
}

interface FoodFilter {
  type: string
  maxPrice: number
}

interface Filters {
  categories: string[]
  priceLevel: number[]
  drinkFilter: DrinkFilter | null
  foodFilter: FoodFilter | null
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

const foodTypes = [
  { id: 'kebap', label: 'Kebap', icon: Beef, examples: 'Adana, Urfa, İskender', defaultMax: 500 },
  { id: 'doner', label: 'Döner', icon: Beef, examples: 'Et döner, Tavuk döner', defaultMax: 200 },
  { id: 'pizza', label: 'Pizza', icon: Pizza, examples: 'Margarita, Karışık', defaultMax: 300 },
  { id: 'burger', label: 'Burger', icon: Beef, examples: 'Cheese, Double', defaultMax: 350 },
  { id: 'balik', label: 'Balık', icon: Fish, examples: 'Levrek, Çupra, Somon', defaultMax: 600 },
  { id: 'deniz', label: 'Deniz Ürünleri', icon: Fish, examples: 'Karides, Kalamar, Midye', defaultMax: 500 },
  { id: 'kofte', label: 'Köfte', icon: Beef, examples: 'Izgara, Kasap', defaultMax: 300 },
  { id: 'steak', label: 'Steak', icon: Beef, examples: 'Bonfile, Antrikot', defaultMax: 1000 },
  { id: 'salata', label: 'Salata', icon: Salad, examples: 'Sezar, Akdeniz', defaultMax: 200 },
  { id: 'makarna', label: 'Makarna', icon: UtensilsCrossed, examples: 'Penne, Spagetti', defaultMax: 250 },
  { id: 'kahvalti', label: 'Kahvaltı', icon: Coffee, examples: 'Serpme, Sahanda', defaultMax: 400 },
  { id: 'tatli', label: 'Tatlı', icon: UtensilsCrossed, examples: 'Künefe, Baklava', defaultMax: 200 },
]

const drinkTypes = [
  { id: 'beer', label: 'Bira', icon: Beer, examples: 'Efes, Tuborg, Corona', defaultMax: 300 },
  { id: 'cocktail', label: 'Kokteyl', icon: Wine, examples: 'Mojito, Margarita', defaultMax: 500 },
  { id: 'wine_glass', label: 'Şarap (Kadeh)', icon: Wine, examples: '', defaultMax: 200 },
  { id: 'wine_bottle', label: 'Şarap (Şişe)', icon: Wine, examples: '', defaultMax: 1500 },
  { id: 'raki', label: 'Rakı', icon: Wine, examples: 'Yeni Rakı, Efe', defaultMax: 2000 },
  { id: 'whiskey', label: 'Viski', icon: Wine, examples: 'JD, Chivas', defaultMax: 3000 },
  { id: 'vodka_shot', label: 'Votka (Shot)', icon: Wine, examples: 'Smirnoff', defaultMax: 200 },
  { id: 'vodka_bottle', label: 'Votka (Şişe)', icon: Wine, examples: 'Smirnoff, Belvedere', defaultMax: 3000 },
  { id: 'soft_drink', label: 'Meşrubat', icon: Coffee, examples: 'Kola, Soda', defaultMax: 100 },
  { id: 'coffee', label: 'Kahve', icon: Coffee, examples: 'Latte, Americano', defaultMax: 200 },
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
  const [showDrinkModal, setShowDrinkModal] = useState(false)
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, address: string}>({ 
    lat: 40.9662, lng: 29.0751, address: 'Konum alınıyor...' 
  })
  
  const [selectedDrinkType, setSelectedDrinkType] = useState<string>('')
  const [drinkMaxPrice, setDrinkMaxPrice] = useState<string>('')
  const [selectedFoodType, setSelectedFoodType] = useState<string>('')
  const [foodMaxPrice, setFoodMaxPrice] = useState<string>('')
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const [filters, setFilters] = useState<Filters>({
    categories: [],
    priceLevel: [],
    drinkFilter: null,
    foodFilter: null,
    features: [],
    dietary: [],
    entertainment: [],
    reservationToday: false,
    searchQuery: ''
  })

  useEffect(() => {
    if (mode === 'takeaway') localStorage.setItem('order_mode', 'takeaway')
  }, [mode])

  useEffect(() => {
    getLocation()
  }, [])

  useEffect(() => {
    applyFilters()
    countActiveFilters()
  }, [filters, allPlaces])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!filters.searchQuery || filters.searchQuery.length < 2) {
      applyFilters()
      return
    }
    searchTimeoutRef.current = setTimeout(() => searchPlaces(filters.searchQuery), 500)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [filters.searchQuery])

  const countActiveFilters = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.priceLevel.length > 0) count++
    if (filters.drinkFilter) count++
    if (filters.foodFilter) count++
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
      price_level: v.price_level,
      beer_price_max: v.beer_price_max,
      cocktail_price_max: v.cocktail_price_max,
      has_gluten_free: v.has_gluten_free,
      has_vegan: v.has_vegan,
      has_vegetarian: v.has_vegetarian,
      has_pool: v.has_pool,
      has_beach_access: v.has_beach_access,
      has_dj: v.has_dj,
      has_live_music: v.has_live_music,
      has_kids_area: v.has_kids_area,
      has_parking: v.has_parking,
      has_valet: v.has_valet,
      has_reservation: v.has_reservation,
      reservation_available_today: v.reservation_available_today,
      features: v.features,
      cuisine_type: v.cuisine_type,
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
        const orderMatches = allPlaces.filter(p => p.isOrderEnabled && p.name.toLowerCase().includes(query.toLowerCase()))
        const combined = [...orderMatches, ...googlePlaces].sort((a, b) => {
          if (a.isOrderEnabled && !b.isOrderEnabled) return -1
          if (!a.isOrderEnabled && b.isOrderEnabled) return 1
          return (a.distance || 999) - (b.distance || 999)
        })
        setPlaces(combined)
      } else {
        setPlaces(allPlaces.filter(p => p.name.toLowerCase().includes(query.toLowerCase())))
      }
    } catch (err) {
      setPlaces(allPlaces.filter(p => p.name.toLowerCase().includes(query.toLowerCase())))
    }
    setSearching(false)
  }

  const applyFilters = () => {
    let result = [...allPlaces]
    if (filters.searchQuery && filters.searchQuery.length >= 2) return
    if (filters.categories.length > 0) result = result.filter(p => filters.categories.includes(p.category))
    if (filters.priceLevel.length > 0) result = result.filter(p => p.price_level && filters.priceLevel.includes(p.price_level))
    if (filters.drinkFilter) {
      result = result.filter(p => {
        if (filters.drinkFilter!.type === 'beer' && p.beer_price_max) return p.beer_price_max <= filters.drinkFilter!.maxPrice
        if (filters.drinkFilter!.type === 'cocktail' && p.cocktail_price_max) return p.cocktail_price_max <= filters.drinkFilter!.maxPrice
        return true
      })
    }
    if (filters.features.length > 0) result = result.filter(p => filters.features.every(f => (p as any)[f] === true))
    if (filters.dietary.length > 0) result = result.filter(p => filters.dietary.every(d => (p as any)[d] === true))
    if (filters.entertainment.length > 0) result = result.filter(p => filters.entertainment.some(e => (p as any)[e] === true))
    if (filters.reservationToday) result = result.filter(p => p.reservation_available_today === true)
    setPlaces(result)
  }

  const toggleArrayFilter = (category: 'categories' | 'priceLevel' | 'features' | 'dietary' | 'entertainment', value: string | number) => {
    setFilters(prev => {
      const arr = prev[category] as any[]
      if (arr.includes(value)) return { ...prev, [category]: arr.filter(v => v !== value) }
      return { ...prev, [category]: [...arr, value] }
    })
  }

  const applyDrinkFilter = () => {
    if (selectedDrinkType && drinkMaxPrice) {
      setFilters(prev => ({ ...prev, drinkFilter: { type: selectedDrinkType, maxPrice: parseInt(drinkMaxPrice) } }))
    }
    setShowDrinkModal(false)
  }

  const applyFoodFilter = () => {
    if (selectedFoodType && foodMaxPrice) {
      setFilters(prev => ({ ...prev, foodFilter: { type: selectedFoodType, maxPrice: parseInt(foodMaxPrice) } }))
    }
    setShowFoodModal(false)
  }

  const clearDrinkFilter = () => {
    setFilters(prev => ({ ...prev, drinkFilter: null }))
    setSelectedDrinkType('')
    setDrinkMaxPrice('')
  }

  const clearFoodFilter = () => {
    setFilters(prev => ({ ...prev, foodFilter: null }))
    setSelectedFoodType('')
    setFoodMaxPrice('')
  }

  const clearFilters = () => {
    setFilters({ categories: [], priceLevel: [], drinkFilter: null, foodFilter: null, features: [], dietary: [], entertainment: [], reservationToday: false, searchQuery: '' })
    setSelectedDrinkType('')
    setDrinkMaxPrice('')
    setSelectedFoodType('')
    setFoodMaxPrice('')
  }

  const handlePlaceClick = (place: Place) => {
    if (place.isOrderEnabled) {
      router.push(`/venue/${place.id.replace('order-', '')}`)
    } else {
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
          <div className="flex items-center gap-2">
            {mode === 'takeaway' && (
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">Paket</span>
              </div>
            )}
            <button onClick={() => setShowFilterModal(true)} className="relative p-2 hover:bg-white/10 rounded-full">
              <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">{activeFilterCount}</span>
              )}
            </button>
            <button onClick={() => loadPlaces(userLocation.lat, userLocation.lng)} disabled={loading} className="p-2 hover:bg-white/10 rounded-full disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input type="text" placeholder="Döner, pizza, cafe ara..." value={filters.searchQuery} onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500" />
          {(filters.searchQuery || searching) && (
            <button onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2">
              {searching ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> : <X className="w-4 h-4 text-gray-500" />}
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { if (cat.id === 'all') setFilters(prev => ({ ...prev, categories: [] })); else toggleArrayFilter('categories', cat.id) }}
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
              {categories.find(cat => cat.id === c)?.label}
              <button onClick={() => toggleArrayFilter('categories', c)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.foodFilter && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex items-center gap-1">
              {foodTypes.find(f => f.id === filters.foodFilter?.type)?.label}: max {filters.foodFilter.maxPrice}₺
              <button onClick={clearFoodFilter}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.drinkFilter && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1">
              {drinkTypes.find(d => d.id === filters.drinkFilter?.type)?.label}: max {filters.drinkFilter.maxPrice}₺
              <button onClick={clearDrinkFilter}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.dietary.map(d => (
            <span key={d} className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
              {dietaryOptions.find(opt => opt.id === d)?.label}
              <button onClick={() => toggleArrayFilter('dietary', d)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {filters.reservationToday && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
              Bugün Müsait
              <button onClick={() => setFilters(prev => ({ ...prev, reservationToday: false }))}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-red-400 underline ml-2">Temizle</button>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-400">Mekanlar yükleniyor...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-2">{filters.searchQuery ? `"${filters.searchQuery}" için sonuç bulunamadı` : 'Mekan bulunamadı'}</p>
            <button onClick={clearFilters} className="text-orange-500 text-sm">Filtreleri temizle</button>
          </div>
        ) : (
          <>
            {filters.searchQuery && <p className="text-sm text-gray-400 mb-2">"{filters.searchQuery}" için <span className="text-orange-500 font-medium">{places.length}</span> sonuç</p>}
            {places.map(place => (
              <button key={place.id} onClick={() => handlePlaceClick(place)} className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left hover:bg-[#222] transition-colors">
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
                        {place.has_live_music && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Canlı Müzik</span>}
                        {place.has_dj && <span className="text-xs bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded">DJ</span>}
                        {place.reservation_available_today && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Bugün Müsait</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {place.rating && <span className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{place.rating.toFixed(1)}</span>}
                      <span className="text-sm text-gray-500">{place.distance} km</span>
                      {place.price_level && <span className="text-sm text-gray-500">{'₺'.repeat(place.price_level)}</span>}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#242424] rounded-lg flex items-center justify-center text-2xl ml-3">{place.emoji}</div>
                </div>
              </button>
            ))}
            {loadingGoogle && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin mr-2" />
                <span className="text-sm text-gray-400">Daha fazla mekan yükleniyor...</span>
              </div>
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
          <div className="absolute inset-x-0 bottom-0 bg-[#1a1a1a] rounded-t-3xl flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex-shrink-0 border-b border-white/10 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tüm Filtreler</h2>
              <button onClick={() => setShowFilterModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Kategori */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-orange-500" />Kategori</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <button key={cat.id} onClick={() => toggleArrayFilter('categories', cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${filters.categories.includes(cat.id) ? 'bg-orange-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                      <span>{cat.emoji}</span>{cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fiyat Seviyesi */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-orange-500" />Fiyat Seviyesi</h3>
                <div className="flex flex-wrap gap-2">
                  {priceLevels.map(p => (
                    <button key={p.level} onClick={() => toggleArrayFilter('priceLevel', p.level)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors ${filters.priceLevel.includes(p.level) ? 'bg-green-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                      {p.label} <span className="text-xs opacity-70">({p.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Yiyecek Fiyatı */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Pizza className="w-4 h-4 text-orange-500" />Yiyecek Fiyatı</h3>
                {filters.foodFilter ? (
                  <div className="bg-red-500/20 border border-red-500 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-400">{foodTypes.find(f => f.id === filters.foodFilter?.type)?.label}</p>
                        <p className="text-sm text-gray-400">Max {filters.foodFilter.maxPrice}₺</p>
                      </div>
                      <button onClick={clearFoodFilter} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-red-400" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowFoodModal(true)} className="w-full px-4 py-4 rounded-xl bg-[#242424] text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <Beef className="w-5 h-5" />
                      <div className="text-left">
                        <p>Yiyecek türü ve fiyat belirle</p>
                        <p className="text-xs text-gray-500">Döner, kebap, pizza, balık...</p>
                      </div>
                    </span>
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* İçecek Fiyatı */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Beer className="w-4 h-4 text-orange-500" />İçecek Fiyatı</h3>
                {filters.drinkFilter ? (
                  <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-yellow-400">{drinkTypes.find(d => d.id === filters.drinkFilter?.type)?.label}</p>
                        <p className="text-sm text-gray-400">Max {filters.drinkFilter.maxPrice}₺</p>
                      </div>
                      <button onClick={clearDrinkFilter} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-yellow-400" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDrinkModal(true)} className="w-full px-4 py-4 rounded-xl bg-[#242424] text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <Wine className="w-5 h-5" />
                      <div className="text-left">
                        <p>İçecek türü ve fiyat belirle</p>
                        <p className="text-xs text-gray-500">Bira, kokteyl, şarap, viski...</p>
                      </div>
                    </span>
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Diyet Seçenekleri */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Leaf className="w-4 h-4 text-orange-500" />Diyet Seçenekleri</h3>
                <div className="space-y-2">
                  {dietaryOptions.map(opt => (
                    <button key={opt.id} onClick={() => toggleArrayFilter('dietary', opt.id)}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${filters.dietary.includes(opt.id) ? 'bg-green-500/20 border border-green-500' : 'bg-[#242424] text-gray-300'}`}>
                      <span className="flex items-center gap-3"><opt.icon className="w-5 h-5" />{opt.label}</span>
                      {filters.dietary.includes(opt.id) && <Check className="w-5 h-5 text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eğlence */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-orange-500" />Eğlence</h3>
                <div className="space-y-2">
                  {entertainmentOptions.map(opt => (
                    <button key={opt.id} onClick={() => toggleArrayFilter('entertainment', opt.id)}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${filters.entertainment.includes(opt.id) ? 'bg-purple-500/20 border border-purple-500' : 'bg-[#242424] text-gray-300'}`}>
                      <span className="flex items-center gap-3"><opt.icon className="w-5 h-5" />{opt.label}</span>
                      {filters.entertainment.includes(opt.id) && <Check className="w-5 h-5 text-purple-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Özellikler */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-orange-500" />Özellikler</h3>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map(opt => (
                    <button key={opt.id} onClick={() => toggleArrayFilter('features', opt.id)}
                      className={`px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 ${filters.features.includes(opt.id) ? 'bg-blue-500/20 border border-blue-500' : 'bg-[#242424] text-gray-300'}`}>
                      <opt.icon className="w-4 h-4" />{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bugün Rezervasyon */}
              <div>
                <button onClick={() => setFilters(prev => ({ ...prev, reservationToday: !prev.reservationToday }))}
                  className={`w-full px-4 py-4 rounded-xl text-sm transition-colors flex items-center justify-between ${filters.reservationToday ? 'bg-orange-500/20 border border-orange-500' : 'bg-[#242424] text-gray-300'}`}>
                  <span className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Bugün Rezervasyon Müsait</p>
                      <p className="text-xs text-gray-400">Sadece bugün için müsait mekanları göster</p>
                    </div>
                  </span>
                  {filters.reservationToday && <Check className="w-5 h-5 text-orange-500" />}
                </button>
              </div>
              
              {/* Bottom padding for scroll */}
              <div className="h-4" />
            </div>

            <div className="flex-shrink-0 border-t border-white/10 p-4 flex gap-3 bg-[#1a1a1a]">
              <button onClick={clearFilters} className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium">Temizle</button>
              <button onClick={() => setShowFilterModal(false)} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium">{places.length} Sonuç Göster</button>
            </div>
          </div>
        </div>
      )}

      {/* Food Filter Modal */}
      {showFoodModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">Yiyecek Filtresi</h2>
              <button onClick={() => setShowFoodModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Yiyecek Türü Seç</p>
                <div className="grid grid-cols-2 gap-2">
                  {foodTypes.map(food => (
                    <button key={food.id} onClick={() => { setSelectedFoodType(food.id); if (!foodMaxPrice) setFoodMaxPrice(food.defaultMax.toString()) }}
                      className={`px-3 py-3 rounded-xl text-sm transition-colors text-left ${selectedFoodType === food.id ? 'bg-red-500 text-white' : 'bg-[#242424] text-gray-300'}`}>
                      <div className="flex items-center gap-2">
                        <food.icon className="w-4 h-4" />
                        <span className="font-medium">{food.label}</span>
                      </div>
                      {food.examples && <p className="text-xs opacity-60 mt-1">{food.examples}</p>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Maximum Fiyat (₺)</p>
                <div className="relative">
                  <input type="number" value={foodMaxPrice} onChange={(e) => setFoodMaxPrice(e.target.value)} placeholder="Örn: 300"
                    className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">₺</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 200, 300, 500, 1000].map(price => (
                    <button key={price} onClick={() => setFoodMaxPrice(price.toString())}
                      className={`px-3 py-1 rounded-lg text-xs ${foodMaxPrice === price.toString() ? 'bg-red-500 text-white' : 'bg-[#333] text-gray-400'}`}>{price}₺</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowFoodModal(false)} className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium">İptal</button>
              <button onClick={applyFoodFilter} disabled={!selectedFoodType || !foodMaxPrice} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50">Uygula</button>
            </div>
          </div>
        </div>
      )}

      {/* Drink Filter Modal */}
      {showDrinkModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">İçecek Filtresi</h2>
              <button onClick={() => setShowDrinkModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">İçecek Türü Seç</p>
                <div className="grid grid-cols-2 gap-2">
                  {drinkTypes.map(drink => (
                    <button key={drink.id} onClick={() => { setSelectedDrinkType(drink.id); if (!drinkMaxPrice) setDrinkMaxPrice(drink.defaultMax.toString()) }}
                      className={`px-3 py-3 rounded-xl text-sm transition-colors text-left ${selectedDrinkType === drink.id ? 'bg-yellow-500 text-black' : 'bg-[#242424] text-gray-300'}`}>
                      <div className="flex items-center gap-2">
                        <drink.icon className="w-4 h-4" />
                        <span className="font-medium">{drink.label}</span>
                      </div>
                      {drink.examples && <p className="text-xs opacity-60 mt-1">{drink.examples}</p>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Maximum Fiyat (₺)</p>
                <div className="relative">
                  <input type="number" value={drinkMaxPrice} onChange={(e) => setDrinkMaxPrice(e.target.value)} placeholder="Örn: 300"
                    className="w-full px-4 py-3 bg-[#242424] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-yellow-500" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">₺</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 200, 300, 500, 1000].map(price => (
                    <button key={price} onClick={() => setDrinkMaxPrice(price.toString())}
                      className={`px-3 py-1 rounded-lg text-xs ${drinkMaxPrice === price.toString() ? 'bg-yellow-500 text-black' : 'bg-[#333] text-gray-400'}`}>{price}₺</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-white/10 flex gap-3">
              <button onClick={() => setShowDrinkModal(false)} className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium">İptal</button>
              <button onClick={applyDrinkFilter} disabled={!selectedDrinkType || !drinkMaxPrice} className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-medium disabled:opacity-50">Uygula</button>
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
