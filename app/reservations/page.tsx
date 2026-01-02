'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, Users, MapPin, X, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Reservation {
  id: string
  venue_id: string
  venue?: { name: string; address: string }
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  notes?: string
}

export default function ReservationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { translations: t, locale } = useI18n()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (!authLoading) {
      if (user) loadReservations()
      else setLoading(false)
    }
  }, [user, authLoading])

  const loadReservations = async () => {
    if (!user) { setLoading(false); return }
    
    try {
      const { data: reservationsData, error } = await supabase
        .from('reservations')
        .select('*')
        .or(`user_id.eq.${user.id},customer_id.eq.${user.id}`)
        .order('reservation_date', { ascending: false })
      
      if (error) { console.error('Reservations error:', error); setLoading(false); return }

      if (reservationsData && reservationsData.length > 0) {
        const venueIds = Array.from(new Set(reservationsData.map(r => r.venue_id).filter(Boolean)))
        
        if (venueIds.length > 0) {
          const { data: venuesData } = await supabase.from('venues').select('id, name, address').in('id', venueIds)
          const venueMap: Record<string, { name: string; address: string }> = {}
          venuesData?.forEach(v => { venueMap[v.id] = { name: v.name, address: v.address } })
          reservationsData.forEach(res => { res.venue = venueMap[res.venue_id] || { name: t.common.venue, address: '' } })
        }
        
        setReservations(reservationsData)
      } else {
        setReservations([])
      }
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  const cancelReservation = async (id: string) => {
    if (!confirm(t.reservations.confirmCancel || 'Rezervasyonu iptal etmek istediğinize emin misiniz?')) return
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id)
    loadReservations()
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = reservations.filter(r => r.reservation_date >= today && r.status !== 'cancelled')
  const past = reservations.filter(r => r.reservation_date < today || r.status === 'cancelled')

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    confirmed: 'bg-green-500/20 text-green-500',
    cancelled: 'bg-red-500/20 text-red-500',
    completed: 'bg-gray-500/20 text-gray-400',
    no_show: 'bg-red-500/20 text-red-500',
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t.reservations.pending,
      confirmed: t.reservations.confirmed,
      cancelled: t.reservations.cancelled,
      completed: t.reservations.completed,
      no_show: t.reservations.no_show,
    }
    return labels[status] || status
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t.auth.login}</h2>
          <p className="text-gray-400 mb-4">{t.reservations.loginToSee || 'Rezervasyonlarınızı görmek için giriş yapın'}</p>
          <button type="button" onClick={() => router.push('/auth')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
            {t.auth.login}
          </button>
        </div>
      </div>
    )
  }

  const displayList = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t.reservations.myReservations}</h1>
          </div>
          <button type="button" className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <button type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 rounded-xl font-medium transition ${activeTab === 'upcoming' ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
        >
          {t.reservations.upcoming || 'Yaklaşan'} ({upcoming.length})
        </button>
        <button type="button"
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-3 rounded-xl font-medium transition ${activeTab === 'past' ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
        >
          {t.reservations.past || 'Geçmiş'} ({past.length})
        </button>
      </div>

      <div className="p-4 space-y-3">
        {displayList.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {activeTab === 'upcoming' ? t.reservations.noUpcoming || 'Yaklaşan rezervasyon yok' : t.reservations.noPast || 'Geçmiş rezervasyon yok'}
            </h2>
            {activeTab === 'upcoming' && (
              <button type="button" onClick={() => router.push('/discover')} className="mt-4 px-6 py-3 bg-orange-500 rounded-xl font-medium">
                {t.nav.discover}
              </button>
            )}
          </div>
        ) : (
          displayList.map(res => (
            <div key={res.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{res.venue?.name || t.common.venue}</h3>
                  {res.venue?.address && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{res.venue.address}</span>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[res.status] || 'bg-gray-500/20 text-gray-400'}`}>
                  {getStatusLabel(res.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>{new Date(res.reservation_date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>{res.reservation_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>{res.party_size} {t.reservations.person}</span>
                </div>
              </div>

              {res.notes && (
                <p className="mt-2 text-sm text-gray-400">{t.reservations.note || 'Not'}: {res.notes}</p>
              )}

              {activeTab === 'upcoming' && res.status !== 'cancelled' && (
                <button type="button"
                  onClick={() => cancelReservation(res.id)}
                  className="mt-3 w-full py-2 border border-red-500/50 text-red-500 rounded-lg flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t.reservations.cancelReservation}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}