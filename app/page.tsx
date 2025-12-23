'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  MapPin, Search, QrCode, Package, Sparkles, 
  TrendingUp, Clock, Star, Heart, ChevronRight,
  Flame, Award, Users, ArrowRight, Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

interface PopularVenue {
  id: string
  name: string
  category: string
  emoji: string
  rating: number
  order_count: number
  lat: number
  lon: number
  district: string
}

interface PopularDish {
  id: string
  name: string
  venue_name: string
  venue_id: string
  price: number
  order_count: number
  image_url: string | null
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [popularVenues, setPopularVenues] = useState<PopularVenue[]>([])
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [nextUpdateTime, setNextUpdateTime] = useState<string>('')

  useEffect(() => {
    setMounted(true)
    getUserLocation()
    calculateUpdateTimes()
  }, [])

  useEffect(() => {
    if (userLocation) {
      loadPopularData()
    }
  }, [userLocation])

  const calculateUpdateTimes = () => {
    const now = new Date()
    const today15 = new Date(now)
    today15.setHours(15, 0, 0, 0)
    
    if (now >= today15) {
      setLastUpdateTime(today15.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
      setNextUpdateTime('Yarın 15:00')
    } else {
      setLastUpdateTime('Dün 15:00')
      setNextUpdateTime('Bugün 15:00')
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.log('Konum alınamadı, varsayılan kullanılıyor')
          // Default: Bodrum
          setUserLocation({ lat: 37.0344, lon: 27.4305 })
        }
      )
    } else {
      // Default: Bodrum
      setUserLocation({ lat: 37.0344, lon: 27.4305 })
    }
  }

  const loadPopularData = async () => {
    if (!userLocation) return
    
    setLoading(true)
    try {
      // 1. Son 24 saatteki siparişlere göre popüler mekanları getir
      const today = new Date()
      today.setHours(today.getHours() - 24)
      
      // Mekanları getir
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id, name, category, emoji, rating, lat, lon, district')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lon', 'is', null)

      if (venuesError) throw venuesError

      // Siparişleri getir (son 24 saat)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('venue_id, items')
        .gte('created_at', today.toISOString())
        .in('status', ['completed', 'served', 'ready', 'preparing', 'confirmed'])

      if (ordersError) throw ordersError

      // Venue başına sipariş sayısını hesapla
      const venueOrderCounts: Record<string, number> = {}
      orders?.forEach(order => {
        if (order.venue_id) {
          venueOrderCounts[order.venue_id] = (venueOrderCounts[order.venue_id] || 0) + 1
        }
      })

      // Mesafe hesapla ve filtrele (50km içindeki mekanlar)
      const venuesWithDistance = venues?.map(venue => {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lon,
          venue.lat, venue.lon
        )
        return {
          ...venue,
          distance,
          order_count: venueOrderCounts[venue.id] || 0
        }
      }).filter(v => v.distance <= 50) // 50km içi

      // Sipariş sayısına göre sırala
      const sortedVenues = venuesWithDistance?.sort((a, b) => b.order_count - a.order_count).slice(0, 10) || []
      setPopularVenues(sortedVenues)

      // 2. Popüler yemekleri getir (items JSON'dan)
      const itemCounts: Record<string, { name: string; venue_id: string; venue_name: string; price: number; count: number }> = {}
      
      orders?.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const key = `${order.venue_id}-${item.name || item.product_name}`
            if (!itemCounts[key]) {
              const venue = venues?.find(v => v.id === order.venue_id)
              itemCounts[key] = {
                name: item.name || item.product_name,
                venue_id: order.venue_id,
                venue_name: venue?.name || 'Mekan',
                price: item.price || item.unit_price || 0,
                count: 0
              }
            }
            itemCounts[key].count += item.quantity || 1
          })
        }
      })

      const sortedItems = Object.entries(itemCounts)
        .map(([key, value]) => ({
          id: key,
          name: value.name,
          venue_id: value.venue_id,
          venue_name: value.venue_name,
          price: value.price,
          order_count: value.count,
          image_url: null
        }))
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 10)

      setPopularDishes(sortedItems)

    } catch (error) {
      console.error('Popüler veriler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  // Haversine formula - iki nokta arası mesafe (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">Merhaba{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''} 👋</p>
            <h1 className="text-xl font-bold">Ne yapmak istersin?</h1>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Search */}
        <button 
          onClick={() => router.push('/discover')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] rounded-2xl text-gray-400"
        >
          <Search className="w-5 h-5" />
          <span>Mekan veya yemek ara...</span>
        </button>
      </div>

      {/* Quick Actions - 4 buttons */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => router.push('/scan')}
            className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl"
          >
            <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">QR Okut</span>
          </button>
          
          <button 
            onClick={() => router.push('/discover')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Keşfet</span>
          </button>
          
          <button 
            onClick={() => router.push('/discover?mode=takeaway')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-purple-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Paket</span>
          </button>
          
          <button 
            onClick={() => router.push('/here')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">HERE</span>
          </button>
        </div>
      </div>

      {/* Günün Popülerleri - Section Header */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">Günün Popülerleri</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{lastUpdateTime}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">Her gün 15:00'te güncellenir • Sonraki: {nextUpdateTime}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Popüler Mekanlar */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                En Çok Tercih Edilen Mekanlar
              </h3>
              <button onClick={() => router.push('/discover')} className="text-orange-500 text-sm flex items-center gap-1">
                Tümü <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {popularVenues.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {popularVenues.map((venue, index) => (
                  <button
                    key={venue.id}
                    onClick={() => router.push(`/venue/${venue.id}`)}
                    className="flex-shrink-0 w-40 bg-[#1a1a1a] rounded-2xl overflow-hidden"
                  >
                    <div className="h-24 bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center relative">
                      <span className="text-4xl">{venue.emoji || '🍽️'}</span>
                      {index < 3 && (
                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                      {venue.order_count > 50 && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> HOT
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sm truncate">{venue.name}</h4>
                      <p className="text-xs text-gray-400">{venue.category || 'Restoran'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs">{venue.rating?.toFixed(1) || '4.5'}</span>
                        </div>
                        <span className="text-xs text-gray-500">{venue.order_count} sipariş</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Yakınında henüz sipariş yok</p>
              </div>
            )}
          </div>

          {/* Popüler Yemekler */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Bugün En Çok Sipariş Edilenler
              </h3>
            </div>
            
            {popularDishes.length > 0 ? (
              <div className="space-y-3">
                {popularDishes.slice(0, 5).map((dish, index) => (
                  <button
                    key={dish.id}
                    onClick={() => router.push(`/venue/${dish.venue_id}/menu`)}
                    className="w-full flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-2xl text-left"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-3xl">
                        🍽️
                      </div>
                      {index < 3 && (
                        <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{dish.name}</h4>
                      <p className="text-sm text-gray-400 truncate">{dish.venue_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Package className="w-3 h-3" /> {dish.order_count} sipariş
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">₺{dish.price}</p>
                      <ArrowRight className="w-4 h-4 text-gray-500 ml-auto mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Bugün henüz sipariş yok</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  )
}
