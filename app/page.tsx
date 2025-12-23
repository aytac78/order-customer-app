'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'
import { Search, Package, Users, Calendar, QrCode, Clock, ChevronRight, Sparkles, Heart, MapPin } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Reservation {
  id: string
  venue_name: string
  date: string
  time: string
  party_size: number
  status: string
}

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const [upcomingReservation, setUpcomingReservation] = useState<Reservation | null>(null)

  useEffect(() => {
    if (user) {
      loadUpcomingReservation()
    }
  }, [user])

  const loadUpcomingReservation = async () => {
    if (!user) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .gte('reservation_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('reservation_date', { ascending: true })
        .limit(1)

      if (error) {
        console.log('Reservations query error:', error.message)
        return
      }

      if (data && data.length > 0) {
        const reservation = data[0]
        
        let venueName = 'Mekan'
        if (reservation.venue_id) {
          const { data: venueData } = await supabase
            .from('venues')
            .select('name')
            .eq('id', reservation.venue_id)
            .single()
          if (venueData) venueName = venueData.name
        }

        setUpcomingReservation({
          id: reservation.id,
          venue_name: venueName,
          date: reservation.reservation_date,
          time: reservation.reservation_time,
          party_size: reservation.party_size,
          status: reservation.status
        })
      }
    } catch (err) {
      console.log('Reservation load error:', err)
    }
  }

  const mainActions = [
    {
      id: 'discover',
      title: t.home.discover,
      subtitle: t.home.discoverSubtitle,
      icon: Search,
      gradient: 'from-orange-500 to-red-500',
      href: '/discover'
    },
    {
      id: 'takeaway',
      title: t.home.takeaway,
      subtitle: t.home.takeawaySubtitle,
      icon: Package,
      gradient: 'from-purple-500 to-pink-500',
      href: '/discover?mode=takeaway'
    },
    {
      id: 'events',
      title: t.home.events,
      subtitle: t.home.eventsSubtitle,
      icon: Sparkles,
      gradient: 'from-green-500 to-emerald-500',
      href: '/events'
    },
    {
      id: 'here',
      title: t.home.here,
      subtitle: t.home.hereSubtitle,
      icon: Users,
      gradient: 'from-cyan-500 to-blue-500',
      href: '/here'
    },
  ]

  const quickActions = [
    { id: 'scan', title: t.home.scanQR, icon: QrCode, href: '/scan' },
    { id: 'reservation', title: t.home.reservation, icon: Calendar, href: '/reservations/new' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold">
          {user ? `${t.home.hello}, ${user.name.split(' ')[0]}` : t.home.welcome}
        </h1>
        <p className="text-gray-400 mt-1">{t.home.whatToDo}</p>
      </div>

      {/* Main Actions Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {mainActions.map((action) => (
          <button
            key={action.id}
            onClick={() => router.push(action.href)}
            className={`bg-gradient-to-br ${action.gradient} rounded-2xl p-5 text-left transition-transform active:scale-95`}
          >
            <action.icon className="w-8 h-8 mb-3" />
            <h3 className="font-bold text-lg">{action.title}</h3>
            <p className="text-sm text-white/80">{action.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => router.push(action.href)}
            className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-[#252525]"
          >
            <action.icon className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{action.title}</span>
          </button>
        ))}
      </div>

      {/* Upcoming Reservation */}
      {upcomingReservation && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">{t.home.upcomingReservation}</h2>
          <button
            onClick={() => router.push('/reservations')}
            className="w-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{upcomingReservation.venue_name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(upcomingReservation.date).toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })} • {upcomingReservation.time}
                </p>
                <p className="text-sm text-gray-400">
                  {upcomingReservation.party_size} {t.reservation.guests}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {/* Quick Access */}
      <div className="px-4 mt-6 pb-24">
        <h2 className="text-lg font-semibold mb-3">{t.home.quickAccess}</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/orders/my')}
            className="bg-[#1a1a1a] rounded-xl p-4 text-left hover:bg-[#252525]"
          >
            <Clock className="w-6 h-6 text-orange-500 mb-2" />
            <h3 className="font-medium">{t.home.myOrders}</h3>
            <p className="text-sm text-gray-400">{t.home.activeOrders}</p>
          </button>
          <button
            onClick={() => router.push('/favorites')}
            className="bg-[#1a1a1a] rounded-xl p-4 text-left hover:bg-[#252525]"
          >
            <Heart className="w-6 h-6 text-red-500 mb-2" />
            <h3 className="font-medium">{t.home.favorites}</h3>
            <p className="text-sm text-gray-400">{t.home.favoriteVenues}</p>
          </button>
        </div>
      </div>
    </div>
  )
}
