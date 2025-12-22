'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, MapPin, Users, Radio, MessageCircle, 
  Settings, Eye, EyeOff, Loader2, UserCircle,
  Coffee, Navigation, ChevronRight, Sparkles
} from 'lucide-react'
import { usePresence, NearbyUser } from '@/lib/usePresence'
import { useAuth } from '@/lib/AuthContext'
import { useLocation } from '@/lib/LocationContext'
import { supabase } from '@/lib/supabase'

interface VenueWithUsers {
  id: string
  name: string
  district: string
  user_count: number
}

export default function HerePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { location } = useLocation()
  const { 
    nearbyUsers, 
    settings, 
    loading,
    updateSettings,
    fetchNearbyUsers,
    checkInToVenue
  } = usePresence()

  const [activeTab, setActiveTab] = useState<'nearby' | 'venues'>('nearby')
  const [radius, setRadius] = useState(1)
  const [nearbyVenues, setNearbyVenues] = useState<VenueWithUsers[]>([])
  const [venuesLoading, setVenuesLoading] = useState(false)

  useEffect(() => {
    if (settings.is_discoverable) {
      fetchNearbyUsers(radius)
    }
    fetchNearbyVenues()
  }, [radius, settings.is_discoverable])

  const fetchNearbyVenues = async () => {
    if (!location) return
    setVenuesLoading(true)

    // Yakındaki mekanları çek (basit sorgu)
    const { data: venues } = await supabase
      .from('venues')
      .select('id, name, district')
      .limit(20)

    if (venues) {
      // Her mekan için aktif check-in sayısını al
      const venuesWithCounts = await Promise.all(
        venues.map(async (venue) => {
          const { count } = await supabase
            .from('venue_checkins')
            .select('*', { count: 'exact', head: true })
            .eq('venue_id', venue.id)
            .eq('is_active', true)

          return {
            ...venue,
            user_count: count || 0
          }
        })
      )

      // Kullanıcı sayısına göre sırala
      setNearbyVenues(venuesWithCounts.sort((a, b) => b.user_count - a.user_count))
    }
    setVenuesLoading(false)
  }

  const handleCheckIn = async (venueId: string) => {
    const success = await checkInToVenue(venueId, 'manual')
    if (success) {
      router.push(`/here/venue/${venueId}`)
    }
  }

  const handleStartChat = (userId: string) => {
    router.push(`/messages/new?user=${userId}`)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">HERE - Sosyal Keşif</h1>
          <p className="text-gray-400 mb-6">Etrafındakileri keşfetmek için giriş yap</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-8 py-3 bg-purple-500 rounded-xl font-medium"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-b from-purple-900/50 to-[#0a0a0a] px-4 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                HERE
                {settings.is_discoverable && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </h1>
              <p className="text-sm text-gray-400">
                {location?.district || 'Konum alınıyor...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateSettings({ is_discoverable: !settings.is_discoverable })}
              className={`p-2 rounded-lg transition-colors ${
                settings.is_discoverable 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {settings.is_discoverable ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => router.push('/here/settings')}
              className="p-2 rounded-lg bg-gray-700 text-gray-400"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('nearby')}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'nearby' 
                ? 'bg-purple-500 text-white' 
                : 'bg-[#1a1a1a] text-gray-400'
            }`}
          >
            <Radio className="w-4 h-4 inline mr-2" />
            Yakındakiler
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'venues' 
                ? 'bg-purple-500 text-white' 
                : 'bg-[#1a1a1a] text-gray-400'
            }`}
          >
            <Coffee className="w-4 h-4 inline mr-2" />
            Mekanlar
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'nearby' ? (
          <>
            {/* Mesafe Seçici */}
            <div className="flex gap-2 mb-4">
              {[0.5, 1, 3, 5].map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`flex-1 py-2 rounded-xl text-sm transition-colors ${
                    radius === r 
                      ? 'bg-pink-500 text-white' 
                      : 'bg-[#1a1a1a] text-gray-400'
                  }`}
                >
                  {r < 1 ? `${r * 1000}m` : `${r}km`}
                </button>
              ))}
            </div>

            {!settings.is_discoverable ? (
              <div className="text-center py-12">
                <EyeOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Görünmez Moddasın</h2>
                <p className="text-gray-400 mb-4">
                  Başkalarını görmek için keşfedilebilir ol
                </p>
                <button
                  onClick={() => updateSettings({ is_discoverable: true, show_nearby: true })}
                  className="px-6 py-2 bg-purple-500 rounded-xl"
                >
                  Keşfedilebilir Ol
                </button>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-purple-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">Yakındakiler aranıyor...</p>
              </div>
            ) : nearbyUsers.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-2">
                  {nearbyUsers.length} kişi {radius < 1 ? `${radius * 1000}m` : `${radius}km`} içinde
                </p>
                {nearbyUsers.map(nearby => (
                  <NearbyUserCard 
                    key={nearby.user_id} 
                    user={nearby}
                    onChat={() => handleStartChat(nearby.user_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">Yakınında Kimse Yok</h2>
                <p className="text-gray-400">
                  Mesafeyi artırarak daha fazla kişi bulabilirsin
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Mekanlar */}
            {venuesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-orange-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">Mekanlar yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-2">
                  {nearbyVenues.filter(v => v.user_count > 0).length} mekanda aktif kullanıcı
                </p>
                {nearbyVenues.map(venue => (
                  <div
                    key={venue.id}
                    className="bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        venue.user_count > 0 ? 'bg-orange-500/20' : 'bg-gray-700'
                      }`}>
                        <Coffee className={`w-6 h-6 ${
                          venue.user_count > 0 ? 'text-orange-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{venue.name}</p>
                        <p className="text-sm text-gray-500">{venue.district}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {venue.user_count > 0 && (
                        <div className="flex items-center gap-1 text-orange-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{venue.user_count}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleCheckIn(venue.id)}
                        className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm"
                      >
                        Check-in
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Yakındaki Kullanıcı Kartı
function NearbyUserCard({ user, onChat }: { user: NearbyUser; onChat: () => void }) {
  const distanceText = user.distance_km < 1 
    ? `${Math.round(user.distance_km * 1000)}m`
    : `${user.distance_km.toFixed(1)}km`

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
        {user.profile?.avatar_url ? (
          <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg font-bold text-white">
            {user.profile?.display_name?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{user.profile?.display_name || 'Anonim'}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>{distanceText} uzakta</span>
        </div>
        {user.profile?.bio && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{user.profile.bio}</p>
        )}
      </div>

      <button
        onClick={onChat}
        className="p-3 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  )
}
