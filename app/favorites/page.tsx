'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Star, MapPin, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface FavoriteWithVenue {
  id: string
  user_id: string
  venue_id: string
  created_at: string
  venue_uuid: string
  venue_name: string
  venue_slug: string
  venue_address: string
  venue_district: string
  venue_rating: number
  venue_cuisine_type: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [favorites, setFavorites] = useState<FavoriteWithVenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (user) loadFavorites()
      else setLoading(false)
    }
  }, [user, authLoading])

  const loadFavorites = async () => {
    if (!user) { setLoading(false); return }
    
    try {
      // View kullanarak favorites + venue bilgilerini al
      const { data, error } = await supabase
        .from('favorites_with_venues')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Favorites error:', error)
      }
      
      if (data) setFavorites(data)
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  const removeFavorite = async (id: string) => {
    await supabase.from('favorites').delete().eq('id', id)
    setFavorites(prev => prev.filter(f => f.id !== id))
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
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t.auth.login}</h2>
          <p className="text-gray-400 mb-4">{t.favorites.loginToSee || 'Favorilerinizi görmek için giriş yapın'}</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
            {t.auth.login}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t.favorites.title}</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t.favorites.noFavorites}</h2>
            <p className="text-gray-400 mb-4">{t.favorites.noFavoritesDesc}</p>
            <button onClick={() => router.push('/discover')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
              {t.favorites.discoverVenues}
            </button>
          </div>
        ) : (
          favorites.map(fav => (
            <div key={fav.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
              <div className="flex items-start justify-between">
                <button 
                  onClick={() => router.push(`/venue/${fav.venue_slug || fav.venue_uuid}`)}
                  className="flex-1 text-left"
                >
                  <h3 className="font-semibold text-lg">{fav.venue_name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{fav.venue_district}</span>
                    </div>
                    {fav.venue_cuisine_type && (
                      <span className="text-sm text-orange-500">{fav.venue_cuisine_type}</span>
                    )}
                    {fav.venue_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm">{fav.venue_rating}</span>
                      </div>
                    )}
                  </div>
                </button>
                <button onClick={() => removeFavorite(fav.id)} className="p-2">
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
