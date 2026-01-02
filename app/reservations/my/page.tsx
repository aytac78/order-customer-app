'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, Clock, Users, MapPin, Phone,
  X, Check, AlertTriangle, ChevronRight, Plus, Loader2,
  CalendarCheck, CalendarX, Store
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Reservation {
  id: string
  user_id: string
  venue_id: string
  venue_name: string
  venue_image?: string
  venue_address?: string
  venue_phone?: string
  date: string
  time: string
  party_size: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes?: string
  special_requests?: string
  created_at: string
}

const statusConfig = {
  pending: { label: 'Onay Bekliyor', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-green-500', textColor: 'text-green-500', icon: Check },
  cancelled: { label: 'İptal Edildi', color: 'bg-red-500', textColor: 'text-red-500', icon: X },
  completed: { label: 'Tamamlandı', color: 'bg-blue-500', textColor: 'text-blue-500', icon: CalendarCheck },
  no_show: { label: 'Gelmedi', color: 'bg-gray-500', textColor: 'text-gray-500', icon: CalendarX },
}

type FilterType = 'upcoming' | 'past' | 'all'

export default function MyReservationsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filter, setFilter] = useState<FilterType>('upcoming')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadReservations()
    }
  }, [currentUser])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user)
    } else {
      router.push('/login')
    }
    setLoading(false)
  }

  const loadReservations = async () => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (data) {
      setReservations(data)
    }
  }

  const cancelReservation = async () => {
    if (!selectedReservation) return

    setCancelling(true)

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', selectedReservation.id)

    if (!error) {
      setReservations(prev =>
        prev.map(r => r.id === selectedReservation.id ? { ...r, status: 'cancelled' as const } : r)
      )
      setShowCancelModal(false)
      setSelectedReservation(null)
    }

    setCancelling(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Yarın'
    }
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  const isUpcoming = (reservation: Reservation) => {
    const reservationDate = new Date(`${reservation.date}T${reservation.time}`)
    return reservationDate > new Date() && reservation.status !== 'cancelled'
  }

  const isPast = (reservation: Reservation) => {
    const reservationDate = new Date(`${reservation.date}T${reservation.time}`)
    return reservationDate <= new Date() || reservation.status === 'cancelled'
  }

  const filteredReservations = reservations.filter(r => {
    if (filter === 'upcoming') return isUpcoming(r)
    if (filter === 'past') return isPast(r)
    return true
  })

  const upcomingCount = reservations.filter(isUpcoming).length

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <Calendar className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Giriş Yapın</h2>
        <p className="text-gray-400 text-center mb-4">Rezervasyonlarınızı görmek için giriş yapın.</p>
        <button type="button" onClick={() => router.push('/login')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
          Giriş Yap
        </button>
      </div>
    )
  }

  // Reservation Detail Modal
  if (selectedReservation && !showCancelModal) {
    const status = statusConfig[selectedReservation.status]
    const StatusIcon = status.icon
    const canCancel = isUpcoming(selectedReservation) && selectedReservation.status !== 'cancelled'

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10 p-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setSelectedReservation(null)}><ArrowLeft className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg">Rezervasyon Detayı</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Status Banner */}
          <div className={`${status.color}/20 border ${status.color.replace('bg-', 'border-')} rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 ${status.color} rounded-full flex items-center justify-center`}>
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`font-semibold ${status.textColor}`}>{status.label}</p>
              <p className="text-sm text-gray-400">
                {selectedReservation.status === 'confirmed' && 'Rezervasyonunuz onaylandı'}
                {selectedReservation.status === 'pending' && 'Mekan tarafından onay bekleniyor'}
                {selectedReservation.status === 'cancelled' && 'Bu rezervasyon iptal edildi'}
              </p>
            </div>
          </div>

          {/* Venue Info */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center gap-4">
              {selectedReservation.venue_image ? (
                <img src={selectedReservation.venue_image} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Store className="w-8 h-8 text-orange-500" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-bold text-lg">{selectedReservation.venue_name}</h2>
                {selectedReservation.venue_address && (
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedReservation.venue_address}
                  </p>
                )}
              </div>
            </div>
            {selectedReservation.venue_phone && (
              <a href={`tel:${selectedReservation.venue_phone}`} 
                className="mt-4 flex items-center justify-center gap-2 py-3 bg-[#2a2a2a] rounded-xl">
                <Phone className="w-4 h-4 text-orange-500" />
                <span>{selectedReservation.venue_phone}</span>
              </a>
            )}
          </div>

          {/* Reservation Details */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tarih</p>
                <p className="font-semibold">{formatDate(selectedReservation.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Saat</p>
                <p className="font-semibold">{formatTime(selectedReservation.time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Kişi Sayısı</p>
                <p className="font-semibold">{selectedReservation.party_size} kişi</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(selectedReservation.notes || selectedReservation.special_requests) && (
            <div className="bg-[#1a1a1a] rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Notlar</h3>
              {selectedReservation.notes && (
                <p className="text-gray-400 text-sm mb-2">{selectedReservation.notes}</p>
              )}
              {selectedReservation.special_requests && (
                <p className="text-gray-400 text-sm">
                  <span className="text-orange-400">Özel İstek:</span> {selectedReservation.special_requests}
                </p>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <button type="button"
              onClick={() => setShowCancelModal(true)}
              className="w-full py-4 border border-red-500 text-red-500 rounded-xl font-medium hover:bg-red-500/10"
            >
              Rezervasyonu İptal Et
            </button>
          )}
        </div>
      </div>
    )
  }

  // Cancel Confirmation Modal
  if (showCancelModal && selectedReservation) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Rezervasyonu İptal Et</h2>
            <p className="text-gray-400">
              {selectedReservation.venue_name} için {formatDate(selectedReservation.date)} {formatTime(selectedReservation.time)} rezervasyonunuz iptal edilecek.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
              className="flex-1 py-3 border border-white/20 rounded-xl font-medium"
            >
              Vazgeç
            </button>
            <button type="button"
              onClick={cancelReservation}
              disabled={cancelling}
              className="flex-1 py-3 bg-red-500 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {cancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : 'İptal Et'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main List View
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button type="button" onClick={() => router.back()}><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Rezervasyonlarım</h1>
            {upcomingCount > 0 && (
              <p className="text-xs text-orange-400">{upcomingCount} aktif rezervasyon</p>
            )}
          </div>
          <button type="button"
            onClick={() => router.push('/reservations/new')}
            className="p-2 bg-orange-500 rounded-full"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 pb-4 gap-2">
          {(['upcoming', 'past', 'all'] as FilterType[]).map(f => (
            <button type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl font-medium text-sm ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#1a1a1a] text-gray-400'
              }`}
            >
              {f === 'upcoming' && 'Yaklaşan'}
              {f === 'past' && 'Geçmiş'}
              {f === 'all' && 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      <div className="p-4 space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'upcoming' ? 'Yaklaşan rezervasyon yok' : 'Rezervasyon bulunamadı'}
            </h3>
            <p className="text-gray-400 text-center mb-6">
              {filter === 'upcoming' 
                ? 'Henüz aktif bir rezervasyonunuz bulunmuyor.'
                : 'Bu kategoride rezervasyon yok.'}
            </p>
            <button type="button"
              onClick={() => router.push('/reservations/new')}
              className="px-6 py-3 bg-orange-500 rounded-xl font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Rezervasyon
            </button>
          </div>
        ) : (
          filteredReservations.map(reservation => {
            const status = statusConfig[reservation.status]
            const StatusIcon = status.icon

            return (
              <button type="button"
                key={reservation.id}
                onClick={() => setSelectedReservation(reservation)}
                className="w-full bg-[#1a1a1a] rounded-2xl p-4 text-left hover:bg-[#222] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Date Box */}
                  <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-orange-500">
                      {new Date(reservation.date).getDate()}
                    </span>
                    <span className="text-xs text-orange-400">
                      {new Date(reservation.date).toLocaleDateString('tr-TR', { month: 'short' })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{reservation.venue_name}</h3>
                      <div className={`flex items-center gap-1 ${status.textColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-xs">{status.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(reservation.time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {reservation.party_size} kişi
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}