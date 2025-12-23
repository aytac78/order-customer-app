'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Navigation,
  Heart, Share2, Calendar, ChevronRight, Loader2, AlertCircle,
  CreditCard, UtensilsCrossed, Wifi, Dog, Cigarette, Music,
  Car, Sun, Instagram, Image as ImageIcon, X, ChevronLeft,
  Martini, Utensils, Coffee, Leaf, Baby, Accessibility,
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
  instagram_url?: string
  photos?: string[]
  features?: string[]
  cuisine_type?: string
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

// Cuisine type labels
const cuisineLabels: Record<string, string> = {
  turkish: 'Türk Mutfağı',
  italian: 'İtalyan',
  japanese: 'Japon',
  chinese: 'Çin',
  mexican: 'Meksika',
  indian: 'Hint',
  french: 'Fransız',
  mediterranean: 'Akdeniz',
  seafood: 'Deniz Ürünleri',
  steakhouse: 'Steakhouse',
  vegetarian: 'Vejetaryen',
  international: 'Dünya Mutfağı',
  cafe: 'Kafe',
  fastfood: 'Fast Food',
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
        console.error('Venue load error:', error)
        setError('Mekan bulunamadı')
        setLoading(false)
        return
      }

      // Demo features if not set (for testing)
      if (!data.features || data.features.length === 0) {
        data.features = ['wifi', 'credit_card', 'air_conditioning']
      }

      setVenue(data)
    } catch (err) {
      console.error('Venue error:', err)
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

  const openInstagram = () => {
    if (venue?.instagram_url) {
      window.open(venue.instagram_url, '_blank')
    }
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Save to Supabase
  }

  const shareVenue = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue?.name,
          text: `${venue?.name} - ORDER'da keşfet!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
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

  // Get all photos for gallery
  const getAllPhotos = () => {
    const photos: string[] = []
    if (venue?.image_url) photos.push(venue.image_url)
    if (venue?.photos) photos.push(...venue.photos)
    return photos
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
        <p className="text-gray-400 mb-6">{error || 'Bu mekan mevcut değil'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-orange-500 rounded-xl font-semibold"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  const photos = getAllPhotos()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header Image */}
      <div className="relative h-56 bg-gradient-to-br from-orange-500 to-red-500">
        {venue.image_url && (
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full backdrop-blur-sm ${isFavorite ? 'bg-red-500' : 'bg-black/50'}`}
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
          <button 
            onClick={shareVenue}
            className="p-2 bg-black/50 rounded-full backdrop-blur-sm"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-sm">
            {getCategoryEmoji(venue.category)} {getCategoryLabel(venue.category)}
          </span>
        </div>
      </div>

      {/* Venue Info */}
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
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {venue.rating && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                {venue.cuisine_type && (
                  <span className="text-sm text-gray-400">
                    {cuisineLabels[venue.cuisine_type] || venue.cuisine_type}
                  </span>
                )}
                {venue.address && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{venue.address.split(',')[0]}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Limit Info */}
      {venue.spending_limit && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-purple-300">Minimum Harcama Limiti</p>
                <p className="text-xl font-bold text-white">₺{venue.spending_limit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - 4 Buttons */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-3">
        <button
          onClick={() => router.push(`/reservations/new?venue=${venueId}`)}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform"
        >
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="text-xs">Rezervasyon</span>
        </button>
        <button
          onClick={() => router.push(`/venue/${venueId}/menu`)}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform"
        >
          <UtensilsCrossed className="w-5 h-5 text-green-500" />
          <span className="text-xs">Menü</span>
        </button>
        <button
          onClick={callVenue}
          disabled={!venue.phone}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          <Phone className="w-5 h-5 text-blue-500" />
          <span className="text-xs">Ara</span>
        </button>
        <button
          onClick={openMaps}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform"
        >
          <Navigation className="w-5 h-5 text-purple-500" />
          <span className="text-xs">Yol Tarifi</span>
        </button>
      </div>

      {/* About Venue Section */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Mekan Hakkında</h2>
        
        {/* Description */}
        {venue.description && (
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {venue.description}
          </p>
        )}

        {/* Features Grid */}
        {venue.features && venue.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {venue.features.map((feature) => {
              const config = featureConfig[feature]
              if (!config) return null
              const Icon = config.icon
              return (
                <div
                  key={feature}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl ${config.color}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{config.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Instagram & Website Links */}
        <div className="flex gap-3 mb-4">
          {venue.instagram_url && (
            <button
              onClick={openInstagram}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex-1"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm font-medium">Instagram</span>
            </button>
          )}
          {venue.website && (
            <button
              onClick={() => window.open(venue.website, '_blank')}
              className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] rounded-xl flex-1"
            >
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium">Website</span>
            </button>
          )}
        </div>

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Fotoğraflar</h3>
              {photos.length > 3 && (
                <button 
                  onClick={() => { setGalleryIndex(0); setShowGallery(true); }}
                  className="text-sm text-orange-500"
                >
                  Tümünü Gör ({photos.length})
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {photos.slice(0, 5).map((photo, index) => (
                <button
                  key={index}
                  onClick={() => { setGalleryIndex(index); setShowGallery(true); }}
                  className="flex-shrink-0 relative"
                >
                  <img
                    src={photo}
                    alt={`${venue.name} ${index + 1}`}
                    className="w-28 h-28 rounded-xl object-cover"
                  />
                  {index === 4 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold">+{photos.length - 5}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Address Card */}
      {venue.address && (
        <div className="px-4 mt-2">
          <button
            onClick={openMaps}
            className="w-full bg-[#1a1a1a] rounded-2xl p-4 text-left"
          >
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

      {/* Working Hours */}
      {venue.working_hours && (
        <div className="px-4 mt-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Çalışma Saatleri</p>
                <p className="text-sm text-green-500">Şu an açık</p>
              </div>
            </div>
            {typeof venue.working_hours === 'object' && (
              <div className="space-y-2 text-sm">
                {Object.entries(venue.working_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{day}</span>
                    <span>{hours.open} - {hours.close}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Gallery Modal */}
      {showGallery && photos.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setShowGallery(false)}>
              <X className="w-6 h-6" />
            </button>
            <span className="text-sm">{galleryIndex + 1} / {photos.length}</span>
            <div className="w-6" />
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={photos[galleryIndex]}
              alt={`${venue.name} ${galleryIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 p-4">
            <button
              onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
              disabled={galleryIndex === 0}
              className="p-3 bg-white/10 rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setGalleryIndex(Math.min(photos.length - 1, galleryIndex + 1))}
              disabled={galleryIndex === photos.length - 1}
              className="p-3 bg-white/10 rounded-full disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 p-4 overflow-x-auto justify-center">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setGalleryIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                  index === galleryIndex ? 'ring-2 ring-orange-500' : 'opacity-50'
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
