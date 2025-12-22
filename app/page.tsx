'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
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
      title: 'Keşfet',
      subtitle: 'Mekanları keşfet',
      icon: Search,
      gradient: 'from-orange-500 to-red-500',
      href: '/discover'
    },
    {
      id: 'takeaway',
      title: 'Paket Al',
      subtitle: 'Paket sipariş ver',
      icon: Package,
      gradient: 'from-purple-500 to-pink-500',
      href: '/discover?mode=takeaway'
    },
    {
      id: 'events',
      title: 'Etkinlikler',
      subtitle: 'Yakındaki etkinlikler',
      icon: Sparkles,
      gradient: 'from-green-500 to-emerald-500',
      href: '/events'
    },
    {
      id: 'here',
      title: 'HERE',
      subtitle: 'Buradakiler',
      icon: MapPin,
      gradient: 'from-blue-500 to-cyan-500',
      href: '/here'
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold">
          {user ? `Merhaba, ${user.name?.split(' ')[0] || 'Kullanıcı'}` : 'Hoş Geldin'}
        </h1>
        <p className="text-gray-400 mt-1">Ne yapmak istersin?</p>
      </header>

      {/* Main Actions Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {mainActions.map(action => (
          <button
            key={action.id}
            onClick={() => router.push(action.href)}
            className={`p-4 rounded-2xl bg-gradient-to-br ${action.gradient} text-left transition-transform active:scale-95`}
          >
            <action.icon className="w-8 h-8 mb-3" />
            <h3 className="font-semibold">{action.title}</h3>
            <p className="text-sm text-white/70">{action.subtitle}</p>
          </button>
        ))}
      </div>

      {/* QR Tara & Rezervasyon */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/scan')}
          className="py-3 bg-[#1a1a1a] rounded-xl border border-white/10 flex items-center justify-center gap-2"
        >
          <QrCode className="w-5 h-5 text-orange-500" />
          <span className="font-medium">QR Tara</span>
        </button>
        <button
          onClick={() => router.push('/reservations')}
          className="py-3 bg-[#1a1a1a] rounded-xl border border-white/10 flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Rezervasyon</span>
        </button>
      </div>

      {/* Upcoming Reservation */}
      {upcomingReservation && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">Yaklaşan Rezervasyon</h2>
          <button
            onClick={() => router.push(`/reservations`)}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{upcomingReservation.venue_name}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {upcomingReservation.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {upcomingReservation.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {upcomingReservation.party_size} kişi
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {/* Quick Stats for logged in users */}
      {user && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/orders')}
              className="bg-[#1a1a1a] rounded-xl p-4 text-left border border-white/10"
            >
              <Package className="w-6 h-6 text-orange-500 mb-2" />
              <h3 className="font-medium">Siparişlerim</h3>
              <p className="text-sm text-gray-400">Aktif siparişleri gör</p>
            </button>
            <button
              onClick={() => router.push('/favorites')}
              className="bg-[#1a1a1a] rounded-xl p-4 text-left border border-white/10"
            >
              <Heart className="w-6 h-6 text-red-500 mb-2" />
              <h3 className="font-medium">Favorilerim</h3>
              <p className="text-sm text-gray-400">Favori mekanlar</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
