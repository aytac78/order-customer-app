'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, Navigation,
  Plus, Minus, ShoppingCart, Heart, Share2, Calendar,
  ChevronRight, Loader2, AlertCircle, Users, CreditCard
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

export default function VenuePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    // TODO: Save to Supabase
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
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
          <button className="p-2 bg-black/50 rounded-full backdrop-blur-sm">
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
              {venue.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{venue.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {venue.rating && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                {venue.address && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[180px]">{venue.address}</span>
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

      {/* Quick Actions */}
      <div className="px-4 mt-4 grid grid-cols-4 gap-3">
        <button
          onClick={callVenue}
          disabled={!venue.phone}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl disabled:opacity-50"
        >
          <Phone className="w-5 h-5 text-green-500" />
          <span className="text-xs">Ara</span>
        </button>
        <button
          onClick={openMaps}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl"
        >
          <Navigation className="w-5 h-5 text-blue-500" />
          <span className="text-xs">Yol Tarifi</span>
        </button>
        <button
          onClick={() => router.push(`/reservations/new?venue=${venueId}`)}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl"
        >
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="text-xs">Rezervasyon</span>
        </button>
        <button
          onClick={() => venue.website && window.open(venue.website, '_blank')}
          disabled={!venue.website}
          className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-xl disabled:opacity-50"
        >
          <Globe className="w-5 h-5 text-purple-500" />
          <span className="text-xs">Web</span>
        </button>
      </div>

      {/* Address Card */}
      {venue.address && (
        <div className="px-4 mt-4">
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

      {/* Menu Coming Soon */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Menü</h2>
        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-gray-400 mb-2">Menü yakında eklenecek</p>
          <p className="text-sm text-gray-500">Bu mekanın menüsü henüz hazır değil</p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/reservations/new?venue=${venueId}`)}
            className="flex-1 py-4 bg-orange-500 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Rezervasyon Yap
          </button>
          <button
            onClick={openMaps}
            className="px-6 py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
