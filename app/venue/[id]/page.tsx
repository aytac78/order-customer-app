'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Navigation,
  Heart, Share2, Calendar, ChevronRight, Loader2, AlertCircle,
  CreditCard, UtensilsCrossed, Wifi, Dog, Cigarette, Music,
  Car, Sun, Instagram, X, ChevronLeft,
  Martini, Utensils, Leaf, Baby, Accessibility,
  Zap, Snowflake, CreditCard as CardIcon, Globe
} from 'lucide-react'

interface Venue {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  website?: string
  rating?: number
  category?: string
  image_url?: string
  logo_url?: string
  working_hours?: any
  is_active: boolean
  lat?: number
  lon?: number
  spending_limit?: number
}

// Feature definitions
const featureConfig: Record<string, { icon: any; label: string; color: string }> = {
  pet_friendly: { icon: Dog, label: 'Pet Dostu', color: 'text-amber-500 bg-amber-500/20' },
  wifi: { icon: Wifi, label: 'Ücretsiz WiFi', color: 'text-blue-500 bg-blue-500/20' },
  smoking_area: { icon: Cigarette, label: 'Sigara Alanı', color: 'text-gray-400 bg-gray-500/20' },
  live_music: { icon: Music, label: 'Canlı Müzik', color: 'text-purple-500 bg-purple-500/20' },
  parking: { icon: Car, label: 'Otopark', color: 'text-green-500 bg-green-500/20' },
  outdoor_seating: { icon: Sun, label: 'Açık Alan', color: 'text-yellow-500 bg-yellow-500/20' },
  cocktails: { icon: Martini, label: 'Kokteyller', color: 'text-pink-500 bg-pink-500/20' },
  turkish_cuisine: { icon: Utensils, label: 'Türk Mutfağı', color: 'text-red-500 bg-red-500/20' },
  vegan_options: { icon: Leaf, label: 'Vegan Seçenekler', color: 'text-green-500 bg-green-500/20' },
  family_friendly: { icon: Baby, label: 'Aile Dostu', color: 'text-pink-400 bg-pink-400/20' },
  wheelchair_accessible: { icon: Accessibility, label: 'Engelli Erişimi', color: 'text-blue-400 bg-blue-400/20' },
  fast_service: { icon: Zap, label: 'Hızlı Servis', color: 'text-yellow-400 bg-yellow-400/20' },
  air_conditioning: { icon: Snowflake, label: 'Klima', color: 'text-cyan-500 bg-cyan-500/20' },
  credit_card: { icon: CardIcon, label: 'Kredi Kartı', color: 'text-indigo-500 bg-indigo-500/20' },
  reservation_required: { icon: Calendar, label: 'Rezervasyon Önerilir', color: 'text-orange-500 bg-orange-500/20' },
}

// Demo data - venue specific
const venueInstagramMap: Record<string, string> = {
  "nihal's break point": 'nbpoint',
  "starbucks": 'starbucks',
}

const getDemoFeatures = (category?: string): string[] => {
  const baseFeatures = ['wifi', 'credit_card', 'air_conditioning']
  switch (category) {
    case 'restaurant': return [...baseFeatures, 'turkish_cuisine', 'parking', 'reservation_required']
    case 'cafe': return [...baseFeatures, 'outdoor_seating', 'pet_friendly', 'fast_service']
    case 'bar': return [...baseFeatures, 'cocktails', 'live_music', 'smoking_area']
    case 'beach_club': return [...baseFeatures, 'outdoor_seating', 'cocktails', 'parking']
    case 'night_club': return [...baseFeatures, 'live_music', 'cocktails']
    default: return [...baseFeatures, 'family_friendly']
  }
}

export default function VenuePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  useEffect(() => {
    if (venueId) {
      loadVenue()
    }
  }, [venueId])

  const loadVenue = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single()

      if (error) {
        setError('Mekan bulunamadı')
        setLoading(false)
        return
      }
      setVenue(data)
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const openMaps = () => {
    if (venue?.lat && venue?.lon) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lon}`, '_blank')
    } else if (venue?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`, '_blank')
    }
  }

  const callVenue = () => {
    if (venue?.phone) {
      window.location.href = `tel:${venue.phone}`
    }
  }

  const getInstagramUsername = () => {
    const nameLower = venue?.name?.toLowerCase() || ''
    return venueInstagramMap[nameLower] || venue?.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'orderapp'
  }

  const openInstagram = () => {
    window.open(`https://instagram.com/${getInstagramUsername()}`, '_blank')
  }

  const toggleFavorite = () => setIsFavorite(!isFavorite)

  const shareVenue = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue?.name,
          text: `${venue?.name} - ORDER'da keşfet!`,
          url: window.location.href,
        })
      } catch (err) {}
    }
  }

  const getCategoryEmoji = (category?: string) => {
    const emojis: Record<string, string> = {
      restaurant: '🍽️', cafe: '☕', bar: '🍸', night_club: '🎉',
      fast_food: '🍔', bakery: '🥐', beach_club: '🏖️',
    }
    return emojis[category || ''] || '🍽️'
  }

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      restaurant: 'Restoran', cafe: 'Kafe', bar: 'Bar', night_club: 'Gece Kulübü',
      fast_food: 'Fast Food', bakery: 'Fırın', beach_club: 'Beach Club',
    }
    return labels[category || ''] || 'Mekan'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Mekan Bulunamadı</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-orange-500 rounded-xl font-semibold">
          Geri Dön
        </button>
      </div>
    )
  }

  const features = getDemoFeatures(venue.category)
  const photos = venue.image_url ? [venue.image_url] : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header Image */}
      <div className="relative h-56 bg-gradient-to-br from-orange-500 to-red-500">
        {venue.image_url && (
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        
        <button onClick={() => router.back()} className="absolute top-4 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm">
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={toggleFavorite} className={`p-2 rounded-full backdrop-blur-sm ${isFavorite ? 'bg-red-500' : 'bg-black/50'}`}>
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
          <button onClick={shareVenue} className="p-2 bg-black/50 rounded-full backdrop-blur-sm">
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-sm">
            {getCategoryEmoji(venue.category)} {getCategoryLabel(venue.category)}
          </span>
        </div>
      </div>

      {/* Venue Info Card */}
      <div className="px-4 -mt-6 relative">
        <div className="bg-[#1a1a1a] rounded-2xl p-4">
          <div className="flex items-start gap-4">
            {venue.logo_url ? (
              <img src={venue.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl font-bold">
                {venue.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold">{venue.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {venue.rating && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                <span className="text-sm text-gray-400">{getCategoryLabel(venue.category)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Limit */}
      {venue.spending_limit && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-purple-300">Minimum Harcama</p>
                <p className="text-xl font-bold">₺{venue.spending_limit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - 4 Buttons */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-3">
        <button onClick={() => router.push(`/reservations/new?venue=${venueId}`)} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="text-xs">Rezervasyon</span>
        </button>
        <button onClick={() => {
          // URL'den mode parametresini kontrol et
          const urlParams = new URLSearchParams(window.location.search)
          const mode = urlParams.get('mode')
          const menuUrl = mode === 'takeaway' 
            ? `/venue/${venueId}/menu?order=true`
            : `/venue/${venueId}/menu`
          router.push(menuUrl)
        }} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform">
          <UtensilsCrossed className="w-5 h-5 text-green-500" />
          <span className="text-xs">Menü</span>
        </button>
        <button onClick={callVenue} disabled={!venue.phone} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl disabled:opacity-50 active:scale-95 transition-transform">
          <Phone className="w-5 h-5 text-blue-500" />
          <span className="text-xs">Ara</span>
        </button>
        <button onClick={openMaps} className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform">
          <Navigation className="w-5 h-5 text-purple-500" />
          <span className="text-xs">Yol Tarifi</span>
        </button>
      </div>

      {/* About Section */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Mekan Hakkında</h2>
        
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          {venue.description || `${venue.name}, ${getCategoryLabel(venue.category).toLowerCase()} kategorisinde hizmet veren kaliteli bir mekandır. Keyifli vakit geçirmek için sizi bekliyoruz.`}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {features.map((feature) => {
            const config = featureConfig[feature]
            if (!config) return null
            const Icon = config.icon
            return (
              <div key={feature} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.color}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{config.label}</span>
              </div>
            )
          })}
        </div>

        {/* Instagram & Website */}
        <div className="flex gap-3 mb-4">
          <button onClick={openInstagram} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex-1">
            <Instagram className="w-5 h-5" />
            <span className="text-sm font-medium">@{getInstagramUsername()}</span>
          </button>
          {venue.website && (
            <button onClick={() => window.open(venue.website, '_blank')} className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] rounded-xl flex-1">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Website</span>
            </button>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-3">Fotoğraflar</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {photos.map((photo, index) => (
                <button key={index} onClick={() => { setGalleryIndex(index); setShowGallery(true); }} className="flex-shrink-0">
                  <img src={photo} alt={`${venue.name}`} className="w-28 h-28 rounded-xl object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Address */}
      {venue.address && (
        <div className="px-4 mt-2">
          <button onClick={openMaps} className="w-full bg-[#1a1a1a] rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Adres</p>
                  <p className="text-sm text-gray-400">{venue.address}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {/* Gallery Modal */}
      {showGallery && photos.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setShowGallery(false)}><X className="w-6 h-6" /></button>
            <span className="text-sm">{galleryIndex + 1} / {photos.length}</span>
            <div className="w-6" />
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={photos[galleryIndex]} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
