'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'
import { Search, Package, Users, Calendar, QrCode, Clock, ChevronRight, Sparkles, Heart, Receipt, AlertTriangle } from 'lucide-react'
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

interface ActiveBill {
  id: string
  venue_name: string
  table_number: string
  total: number
  spending_limit?: number
  items_count: number
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const [upcomingReservation, setUpcomingReservation] = useState<Reservation | null>(null)
  const [activeBill, setActiveBill] = useState<ActiveBill | null>(null)

  useEffect(() => {
    if (user) {
      loadUpcomingReservation()
      loadActiveBill()
      
      // Real-time subscription for active bill
      const channel = supabase
        .channel('home-bill')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
          () => loadActiveBill()
        )
        .subscribe()
      
      return () => { supabase.removeChannel(channel) }
    }
  }, [user])

  const loadActiveBill = async () => {
    if (!user) return
    
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          venues (name, spending_limit),
          order_items (id)
        `)
        .eq('customer_id', user.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (orders) {
        setActiveBill({
          id: orders.id,
          venue_name: orders.venues?.name || 'Mekan',
          table_number: orders.table_number || '-',
          total: orders.total || 0,
          spending_limit: orders.venues?.spending_limit,
          items_count: orders.order_items?.length || 0,
          created_at: orders.created_at
        })
      } else {
        setActiveBill(null)
      }
    } catch (err) {
      setActiveBill(null)
    }
  }

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

      if (error) return

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

  const calculateDuration = (dateString: string) => {
    const start = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins} dk`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours} sa ${mins} dk`
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

  const limitPercent = activeBill?.spending_limit 
    ? Math.min((activeBill.total / activeBill.spending_limit) * 100, 100)
    : 0
  const isNearLimit = activeBill?.spending_limit && activeBill.total >= activeBill.spending_limit * 0.8
  const isOverLimit = activeBill?.spending_limit && activeBill.total >= activeBill.spending_limit

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold">
          {user ? `${t.home.hello}, ${user.name.split(' ')[0]}` : t.home.welcome}
        </h1>
        <p className="text-gray-400 mt-1">{t.home.whatToDo}</p>
      </div>

      {/* Active Bill Banner - Priority Display */}
      {activeBill && (
        <div className="px-4 mb-4">
          <button
            onClick={() => router.push('/bill')}
            className={`w-full rounded-2xl p-4 text-left relative overflow-hidden ${
              isOverLimit 
                ? 'bg-gradient-to-r from-red-600 to-red-500' 
                : isNearLimit 
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-500'
                  : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
          >
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-white/10 animate-pulse" />
            
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    {isOverLimit ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <Receipt className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">Açık Hesabın</h3>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-white/70">Canlı</span>
                      </div>
                    </div>
                    <p className="text-sm text-white/80">{activeBill.venue_name} • Masa {activeBill.table_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₺{activeBill.total.toLocaleString()}</p>
                  <p className="text-xs text-white/70">{activeBill.items_count} ürün • {calculateDuration(activeBill.created_at)}</p>
                </div>
              </div>

              {/* Spending Limit Progress */}
              {activeBill.spending_limit && (
                <div className="mt-3">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isOverLimit ? 'bg-white' : isNearLimit ? 'bg-yellow-300' : 'bg-green-400'
                      }`}
                      style={{ width: `${limitPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-white/80">
                    <span>Limit: ₺{activeBill.spending_limit.toLocaleString()}</span>
                    <span>Kalan: ₺{Math.max(0, activeBill.spending_limit - activeBill.total).toLocaleString()}</span>
                  </div>
                  {isOverLimit && (
                    <p className="text-white text-sm mt-2 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Limit aşıldı!
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          </button>
        </div>
      )}

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
                  {upcomingReservation.party_size} kişi
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
            onClick={() => router.push('/orders')}
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
