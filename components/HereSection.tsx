'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, Users, Eye, EyeOff, ChevronRight, 
  Sparkles, Radio, MessageCircle, Settings,
  Loader2, UserCircle, Coffee
} from 'lucide-react'
import { usePresence, NearbyUser, VenueCheckin } from '@/lib/usePresence'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface HereSectionProps {
  onOpenSettings?: () => void
}

export default function HereSection({ onOpenSettings }: HereSectionProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const { 
    nearbyUsers, 
    venueUsers, 
    currentVenueId,
    settings, 
    loading,
    updateSettings,
    fetchNearbyUsers,
    fetchVenueUsers,
    getCurrentCheckin
  } = usePresence()

  const [currentVenue, setCurrentVenue] = useState<any>(null)
  const [showNearby, setShowNearby] = useState(false)
  const [radius, setRadius] = useState(1)

  useEffect(() => {
    if (user) loadCurrentState()
  }, [user])

  useEffect(() => {
    if (settings.show_nearby) fetchNearbyUsers(radius)
  }, [settings.show_nearby, radius])

  useEffect(() => {
    if (currentVenueId) fetchVenueUsers(currentVenueId)
  }, [currentVenueId])

  const loadCurrentState = async () => {
    const checkin = await getCurrentCheckin()
    if (checkin) setCurrentVenue(checkin.venue)
  }

  const toggleDiscoverable = () => {
    updateSettings({ is_discoverable: !settings.is_discoverable })
  }

  const handleStartChat = (userId: string) => {
    router.push(`/messages/new?user=${userId}`)
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">HERE - {t.here.socialDiscovery}</h3>
            <p className="text-xs text-gray-400">{t.here.loginToDiscover}</p>
          </div>
        </div>
        <button type="button"
          onClick={() => router.push('/auth')}
          className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors"
        >
          {t.auth.login}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center relative">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {settings.is_discoverable && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a] animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">HERE</h3>
            <p className="text-xs text-gray-400">
              {settings.is_discoverable ? t.here.visible : t.here.invisibleMode}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={toggleDiscoverable}
            className={`p-2 rounded-lg transition-colors ${
              settings.is_discoverable 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {settings.is_discoverable ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button type="button"
            onClick={() => router.push('/here/settings')}
            className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mevcut Mekan */}
      {currentVenue && (
        <div className="mb-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">{currentVenue.name}</span>
            </div>
            <span className="text-xs text-purple-400">{venueUsers.length} {t.here.peopleHere}</span>
          </div>
          
          {venueUsers.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {venueUsers.slice(0, 5).map((checkin, i) => (
                  <div
                    key={checkin.id}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#0a0a0a] flex items-center justify-center overflow-hidden"
                    title={checkin.profile?.display_name}
                  >
                    {checkin.profile?.avatar_url ? (
                      <img src={checkin.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {checkin.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {venueUsers.length > 5 && (
                <span className="text-xs text-purple-400">+{venueUsers.length - 5}</span>
              )}
              <button type="button"
                onClick={() => router.push(`/here/venue/${currentVenueId}`)}
                className="ml-auto text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                {t.common.seeAll} <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">{t.here.beFirst}</p>
          )}
        </div>
      )}

      {/* Yakındakiler */}
      <div className="space-y-3">
        <button type="button"
          onClick={() => {
            if (!settings.show_nearby) {
              updateSettings({ show_nearby: true, is_discoverable: true })
            }
            setShowNearby(!showNearby)
            if (!showNearby) fetchNearbyUsers(radius)
          }}
          className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#222] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{t.here.nearby}</p>
              <p className="text-xs text-gray-500">{(t.here.withinDistance || '{km} km içinde').replace('{km}', radius.toString())}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <span className="text-sm text-pink-400">{nearbyUsers.length} {t.here.people}</span>
            )}
            <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showNearby ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Yakındakiler Listesi */}
        {showNearby && settings.show_nearby && (
          <div className="space-y-2 pl-2">
            <div className="flex gap-2 mb-3">
              {[0.5, 1, 5].map(r => (
                <button type="button"
                  key={r}
                  onClick={() => {
                    setRadius(r)
                    fetchNearbyUsers(r)
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    radius === r ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {r < 1 ? `${r * 1000}m` : `${r}km`}
                </button>
              ))}
            </div>

            {nearbyUsers.length > 0 ? (
              nearbyUsers.slice(0, 5).map(nearby => (
                <NearbyUserCard 
                  key={nearby.user_id} 
                  user={nearby}
                  onChat={() => handleStartChat(nearby.user_id)}
                  t={t}
                />
              ))
            ) : (
              <div className="text-center py-4">
                <UserCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t.here.noOneNearby}</p>
                <p className="text-xs text-gray-600">{t.here.increaseDistance}</p>
              </div>
            )}

            {nearbyUsers.length > 5 && (
              <button type="button"
                onClick={() => router.push('/here/nearby')}
                className="w-full py-2 text-center text-sm text-pink-400 hover:text-pink-300"
              >
                {t.common.seeAll} ({nearbyUsers.length} {t.here.people})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Keşfet Butonu */}
      {!currentVenue && !showNearby && (
        <button type="button"
          onClick={() => router.push('/here')}
          className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <MapPin className="w-4 h-4" />
          {t.here.exploreAround}
        </button>
      )}
    </div>
  )
}

function NearbyUserCard({ user, onChat, t }: { user: NearbyUser; onChat: () => void; t: any }) {
  const distanceText = user.distance_km < 1 
    ? `${Math.round(user.distance_km * 1000)}m`
    : `${user.distance_km.toFixed(1)}km`

  return (
    <div className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-xl">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
        {user.profile?.avatar_url ? (
          <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">
            {user.profile?.display_name?.[0]?.toUpperCase() || '?'}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {user.profile?.display_name || t.here.anonymous}
        </p>
        <p className="text-xs text-gray-500">{distanceText} {t.here.away}</p>
      </div>

      <button type="button"
        onClick={onChat}
        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
    </div>
  )
}