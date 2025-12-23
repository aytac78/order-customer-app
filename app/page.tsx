'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Search, QrCode, Package, Sparkles, 
  TrendingUp, Clock, Star, Heart, ChevronRight,
  Flame, Award, Users, ArrowRight, Loader2, User, MapPin, Calendar, Ticket
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

interface Event {
  id: string
  title: string
  description: string
  type: string
  start_date: string
  start_time: string
  end_time: string
  image_url: string | null
  is_featured: boolean
  venue_id: string | null
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [popularVenues, setPopularVenues] = useState<PopularVenue[]>([])
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [nextUpdateTime, setNextUpdateTime] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    getUserLocation()
    calculateUpdateTimes()
    loadEvents()
    if (user) {
      loadProfile()
    }
  }, [user])

  useEffect(() => {
    if (userLocation) {
      loadPopularData()
    }
  }, [userLocation])

  const loadProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data)
  }

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(5)
    
    if (data) setEvents(data)
  }

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
          setUserLocation({ lat: 37.0344, lon: 27.4305 })
        }
      )
    } else {
      setUserLocation({ lat: 37.0344, lon: 27.4305 })
    }
  }

  const loadPopularData = async () => {
    setLoading(true)
    try {
      // Popüler mekanları yükle
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name, category, emoji, rating, order_count, lat, lon, district')
        .order('order_count', { ascending: false })
        .limit(10)
      
      if (venues) setPopularVenues(venues)

      // Popüler yemekleri yükle
      const { data: dishes } = await supabase
        .from('menu_items')
        .select(`
          id, name, price, order_count, image_url,
          venues!inner(id, name)
        `)
        .order('order_count', { ascending: false })
        .limit(5)
      
      if (dishes) {
        const formattedDishes = dishes.map((d: any) => ({
          id: d.id,
          name: d.name,
          venue_name: d.venues?.name || 'Mekan',
          venue_id: d.venues?.id || '',
          price: d.price,
          order_count: d.order_count || 0,
          image_url: d.image_url
        }))
        setPopularDishes(formattedDishes)
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    }
    setLoading(false)
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Bugün'
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın'
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const getEventEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      'music': '🎵',
      'food': '🍽️',
      'party': '🎉',
      'entertainment': '🎤',
      'other': '✨'
    }
    return emojis[type] || '✨'
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Merhaba 👋</h1>
          <p className="text-gray-400">Ne yapmak istersin?</p>
        </div>
        <button 
          onClick={() => router.push(user ? '/profile' : '/login')}
          className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="text-lg font-bold">{profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}</span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <button 
          onClick={() => router.push('/discover')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] rounded-2xl text-gray-400"
        >
          <Search className="w-5 h-5" />
          <span>Mekan veya yemek ara...</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => router.push('/scan')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">QR Okut</span>
          </button>
          <button 
            onClick={() => router.push('/discover')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Keşfet</span>
          </button>
          <button 
            onClick={() => router.push('/orders')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
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

      {/* Etkinlikler */}
      {events.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Yaklaşan Etkinlikler
            </h3>
            <button onClick={() => router.push('/events')} className="text-purple-500 text-sm flex items-center gap-1">
              Tümü <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => router.push(`/events?id=${event.id}`)}
                className="flex-shrink-0 w-64 bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl overflow-hidden"
              >
                <div className="h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center relative">
                  <span className="text-4xl">{event.title.match(/^\p{Emoji}/u)?.[0] || getEventEmoji(event.type)}</span>
                  {event.is_featured && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 rounded-full text-[10px] font-bold">
                      ÖNE ÇIKAN
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm truncate">{event.title.replace(/^\p{Emoji}\s*/u, '')}</h4>
                  <p className="text-xs text-gray-400 truncate">{event.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-purple-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">{formatEventDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{event.start_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Günün Popülerleri - Section Header */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">Günün Popülerleri</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Dün {lastUpdateTime}</span>
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
