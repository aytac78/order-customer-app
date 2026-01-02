'use client'

import { useRouter } from 'next/navigation'
import { Heart, MapPin, Star, Loader2, LogIn, RefreshCw } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

export default function FavoritesPage() {
  const router = useRouter()
  const { favorites, loading, isLoggedIn, removeFavorite, refresh } = useFavorites()

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      restaurant: 'Restoran', cafe: 'Kafe', bar: 'Bar', 
      night_club: 'Gece Kulübü', fast_food: 'Fast Food', 
      bakery: 'Fırın', beach_club: 'Beach Club',
    }
    return labels[category || ''] || 'Mekan'
  }

  const handleRemove = async (venueId: string) => {
    await removeFavorite(venueId)
  }

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Favorilerim</h1>
            <p className="text-sm text-gray-400">{favorites.length} mekan</p>
          </div>
          <button type="button" onClick={refresh} className="p-2 hover:bg-white/10 rounded-full">
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Login Notice */}
        {!isLoggedIn && favorites.length > 0 && (
          <div className="mt-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center gap-3">
            <LogIn className="w-5 h-5 text-orange-400" />
            <div className="flex-1">
              <p className="text-sm text-orange-200">Giriş yaparak favorilerinizi kaydedin</p>
            </div>
            <button type="button" 
              onClick={() => router.push('/login')}
              className="px-3 py-1 bg-orange-500 rounded-lg text-sm font-medium"
            >
              Giriş
            </button>
          </div>
        )}
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
            <button type="button"
              onClick={() => router.push('/discover')}
              className="mt-6 px-6 py-3 bg-orange-500 rounded-xl font-medium"
            >
              Mekanları Keşfet
            </button>
          </div>
        ) : (
          favorites.map(fav => (
            <div
              key={fav.id}
              className="bg-[#1a1a1a] rounded-2xl overflow-hidden"
            >
              <div className="flex">
                {/* Image */}
                <div 
                  onClick={() => router.push(`/venue/${fav.venue_id}`)}
                  className="w-28 h-28 bg-gradient-to-br from-orange-500 to-red-500 flex-shrink-0 cursor-pointer"
                >
                  {fav.venue_image ? (
                    <img src={fav.venue_image} alt={fav.venue_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
                      {fav.venue_name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div 
                  onClick={() => router.push(`/venue/${fav.venue_id}`)}
                  className="flex-1 p-3 cursor-pointer"
                >
                  <h3 className="font-semibold">{fav.venue_name}</h3>
                  <p className="text-sm text-gray-400">{getCategoryLabel(fav.venue_type)}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    {fav.venue_rating && (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {fav.venue_rating.toFixed(1)}
                      </span>
                    )}
                    {fav.venue_address && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{fav.venue_address.split(',')[0]}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button type="button"
                  onClick={() => handleRemove(fav.venue_id)}
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