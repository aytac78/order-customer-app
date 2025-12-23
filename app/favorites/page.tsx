'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Star, Loader2 } from 'lucide-react'

interface FavoriteVenue {
  id: string
  name: string
  category?: string
  rating?: number
  address?: string
  image_url?: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadFavorites()
  }, [])

  const loadFavorites = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('favorite_venues')
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Favorites load error:', e)
    }
    setLoading(false)
  }

  const removeFavorite = (venueId: string) => {
    const updated = favorites.filter(f => f.id !== venueId)
    setFavorites(updated)
    localStorage.setItem('favorite_venues', JSON.stringify(updated))
  }

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      restaurant: 'Restoran', cafe: 'Kafe', bar: 'Bar', 
      night_club: 'Gece Kulübü', fast_food: 'Fast Food', 
      bakery: 'Fırın', beach_club: 'Beach Club',
    }
    return labels[category || ''] || 'Mekan'
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10 p-4">
        <h1 className="text-xl font-bold">Favorilerim</h1>
        <p className="text-sm text-gray-400">{favorites.length} mekan</p>
      </div>

      {/* Favorites List */}
      <div className="p-4 space-y-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400 text-center">Henüz favori mekanınız yok</p>
            <p className="text-sm text-gray-500 text-center mt-1">Beğendiğiniz mekanları kalp ikonuna tıklayarak ekleyin</p>
            <button
              onClick={() => router.push('/discover')}
              className="mt-6 px-6 py-3 bg-orange-500 rounded-xl font-medium"
            >
              Mekanları Keşfet
            </button>
          </div>
        ) : (
          favorites.map(venue => (
            <div
              key={venue.id}
              className="bg-[#1a1a1a] rounded-2xl overflow-hidden"
            >
              <div className="flex">
                {/* Image */}
                <div 
                  onClick={() => router.push(`/venue/${venue.id}`)}
                  className="w-28 h-28 bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0 cursor-pointer"
                >
                  {venue.image_url ? (
                    <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                      {venue.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div 
                  onClick={() => router.push(`/venue/${venue.id}`)}
                  className="flex-1 p-3 cursor-pointer"
                >
                  <h3 className="font-semibold">{venue.name}</h3>
                  <p className="text-sm text-gray-400">{getCategoryLabel(venue.category)}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    {venue.rating && (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {venue.rating.toFixed(1)}
                      </span>
                    )}
                    {venue.address && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{venue.address.split(',')[0]}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFavorite(venue.id)}
                  className="p-4 self-center"
                >
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
