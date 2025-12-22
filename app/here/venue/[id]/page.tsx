'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Users, MessageCircle, MapPin, Clock,
  LogOut, Loader2, UserCircle, Coffee, Share2
} from 'lucide-react'
import { usePresence, VenueCheckin } from '@/lib/usePresence'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'

interface VenueDetails {
  id: string
  name: string
  address: string
  district: string
}

export default function HereVenuePage() {
  const router = useRouter()
  const params = useParams()
  const venueId = params.id as string
  const { user } = useAuth()
  const { 
    venueUsers, 
    currentVenueId,
    fetchVenueUsers,
    checkInToVenue,
    checkOut
  } = usePresence()

  const [venue, setVenue] = useState<VenueDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const isCheckedIn = currentVenueId === venueId

  useEffect(() => {
    loadVenue()
    fetchVenueUsers(venueId)
    
    // Real-time subscription
    const channel = supabase
      .channel(`venue_checkins_${venueId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'venue_checkins', filter: `venue_id=eq.${venueId}` },
        () => {
          fetchVenueUsers(venueId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [venueId])

  const loadVenue = async () => {
    const { data } = await supabase
      .from('venues')
      .select('id, name, address, district')
      .eq('id', venueId)
      .single()

    if (data) setVenue(data)
    setLoading(false)
  }

  const handleCheckIn = async () => {
    await checkInToVenue(venueId, 'manual')
  }

  const handleCheckOut = async () => {
    await checkOut()
    router.back()
  }

  const handleStartChat = (userId: string) => {
    router.push(`/messages/new?user=${userId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Coffee className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Mekan Bulunamadı</h2>
          <button onClick={() => router.back()} className="text-purple-400">
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-b from-orange-900/50 to-[#0a0a0a] px-4 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{venue.name}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {venue.district}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 font-medium">{venueUsers.length + (isCheckedIn ? 1 : 0)}</span>
          </div>
        </div>

        {/* Check-in/out Button */}
        {user && (
          isCheckedIn ? (
            <button
              onClick={handleCheckOut}
              className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Çıkış Yap
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Coffee className="w-5 h-5" />
              Buradayım - Check-in
            </button>
          )
        )}
      </header>

      {/* Content */}
      <div className="p-4">
        {/* Info */}
        {isCheckedIn && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Bu mekanda check-in yaptın
            </p>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Şu An Burada</h2>
          
          {venueUsers.length > 0 ? (
            venueUsers.map(checkin => (
              <VenueUserCard 
                key={checkin.id} 
                checkin={checkin}
                onChat={() => handleStartChat(checkin.user_id)}
                isMe={checkin.user_id === user?.id}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <UserCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Henüz Kimse Yok</h3>
              <p className="text-gray-400 text-sm">
                {isCheckedIn 
                  ? 'İlk sen geldin! Başkaları da gelince göreceksin.'
                  : 'Check-in yaparak ilk sen ol!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mekandaki Kullanıcı Kartı
function VenueUserCard({ 
  checkin, 
  onChat, 
  isMe 
}: { 
  checkin: VenueCheckin
  onChat: () => void
  isMe: boolean
}) {
  const checkinTime = new Date(checkin.checked_in_at)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - checkinTime.getTime()) / 60000)
  
  const timeText = diffMinutes < 1 
    ? 'Az önce' 
    : diffMinutes < 60 
      ? `${diffMinutes} dk önce`
      : `${Math.floor(diffMinutes / 60)} saat önce`

  return (
    <div className={`rounded-xl p-4 flex items-center gap-4 ${
      isMe ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-[#1a1a1a]'
    }`}>
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
        {checkin.profile?.avatar_url ? (
          <img src={checkin.profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-white">
            {checkin.profile?.display_name?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>
      
      <div className="flex-1">
        <p className="font-medium">
          {checkin.profile?.display_name || 'Anonim'}
          {isMe && <span className="text-purple-400 text-sm ml-2">(Sen)</span>}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{timeText}</span>
        </div>
        {checkin.profile?.bio && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{checkin.profile.bio}</p>
        )}
      </div>

      {!isMe && (
        <button
          onClick={onChat}
          className="p-3 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
