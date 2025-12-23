'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Search, QrCode, Package, Coffee,
  Clock, Star, Heart, ChevronRight,
  Flame, Award, Users, ArrowRight, Loader2, MapPin, Calendar
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'
import LanguageSelector from '@/components/LanguageSelector'

interface PopularVenue {
  id: string
  name: string
  category: string
  emoji: string
  rating: number
  order_count: number
}

interface PopularDish {
  id: string
  name: string
  venue_name: string
  venue_id: string
  price: number
  order_count: number
}

interface Event {
  id: string
  title: string
  description: string
  type: string
  start_date: string
  start_time: string
  is_featured: boolean
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [popularVenues, setPopularVenues] = useState<PopularVenue[]>([])
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    loadAllData()
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadProfile()
    }
  }, [user?.id])

  const loadProfile = async () => {
    if (!user?.id) return
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    } catch (err) {
      console.log('Profile load failed')
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [venuesRes, dishesRes, eventsRes] = await Promise.all([
        supabase
          .from('venues')
          .select('id, name, category, emoji, rating, order_count')
          .order('order_count', { ascending: false })
          .limit(10),
        supabase
          .from('menu_items')
          .select('id, name, price, order_count, venue_id, venues(name)')
          .order('order_count', { ascending: false })
          .limit(5),
        supabase
          .from('events')
          .select('id, title, description, type, start_date, start_time, is_featured')
          .eq('is_active', true)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .limit(5)
      ])

      if (venuesRes.data) setPopularVenues(venuesRes.data)
      if (dishesRes.data) {
        setPopularDishes(dishesRes.data.map((d: any) => ({
          id: d.id,
          name: d.name,
          venue_name: d.venues?.name || 'Venue',
          venue_id: d.venue_id,
          price: d.price,
          order_count: d.order_count || 0
        })))
      }
      if (eventsRes.data) setEvents(eventsRes.data)
    } catch (err) {
      console.error('Data load error:', err)
    }
    setLoading(false)
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return t('dates.today') || 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return t('dates.tomorrow') || 'Tomorrow'
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : locale === 'fa' ? 'fa-IR' : locale === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t('home.hello')} 👋</h1>
          <p className="text-gray-400">{t('home.whatToDo')}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button 
            onClick={() => router.push(user ? '/profile' : '/login')}
            className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-10 h-10 object-cover" />
            ) : (
              <span className="text-lg font-bold">{profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'A'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <button 
          onClick={() => router.push('/discover')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] rounded-2xl text-gray-400"
        >
          <Search className="w-5 h-5" />
          <span>{t('home.searchPlaceholder')}</span>
        </button>
      </div>

      {/* Quick Actions - 5 buton */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-5 gap-2">
          <button onClick={() => router.push('/scan')} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl">
            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">{t('home.scanQR')}</span>
          </button>
          <button onClick={() => router.push('/discover')} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">{t('home.discover')}</span>
          </button>
          <button onClick={() => router.push('/orders')} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl">
            <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">{t('home.takeaway')}</span>
          </button>
          <button onClick={() => router.push('/coffeestar')} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Coffeestar</span>
          </button>
          <button onClick={() => router.push('/here')} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl">
            <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">HERE</span>
          </button>
        </div>
      </div>

      {/* Etkinlikler */}
      {events.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              {t('home.upcomingEvents')}
            </h3>
            <button onClick={() => router.push('/events')} className="text-purple-500 text-sm flex items-center gap-1">
              {t('common.seeAll')} <ChevronRight className="w-4 h-4" />
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
                  <span className="text-4xl">{event.title.match(/^\p{Emoji}/u)?.[0] || '✨'}</span>
                  {event.is_featured && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500 rounded-full text-[10px] font-bold">
                      {t('events.featured') || 'FEATURED'}
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

      {/* Günün Popülerleri */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold">{t('discover.popular') || "Today's Popular"}</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">{t('discover.updatedDaily') || 'Updated daily at 15:00'}</p>
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
                {t('home.popularVenues')}
              </h3>
              <button onClick={() => router.push('/discover')} className="text-orange-500 text-sm flex items-center gap-1">
                {t('common.seeAll')} <ChevronRight className="w-4 h-4" />
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
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sm truncate">{venue.name}</h4>
                      <p className="text-xs text-gray-400">{venue.category || t('common.venue')}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs">{venue.rating?.toFixed(1) || '4.5'}</span>
                        </div>
                        <span className="text-xs text-gray-500">{venue.order_count || 0} {t('orders.orders') || 'orders'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('discover.noVenues') || 'No venues yet'}</p>
              </div>
            )}
          </div>

          {/* Popüler Yemekler */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                {t('discover.topOrdered') || 'Most Ordered'}
              </h3>
            </div>
            
            {popularDishes.length > 0 ? (
              <div className="space-y-3">
                {popularDishes.map((dish, index) => (
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
                      <span className="text-xs text-gray-500">{dish.order_count} {t('orders.orders') || 'orders'}</span>
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
                <p className="text-sm">{t('orders.noOrders') || 'No orders yet'}</p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}
