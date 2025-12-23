'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, Search, QrCode, Package, Sparkles, 
  TrendingUp, Clock, Star, Heart, ChevronRight,
  Flame, Award, Users, ArrowRight
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

interface PopularVenue {
  id: string
  name: string
  type: string
  image: string
  rating: number
  orderCount: number
  trending: boolean
}

interface PopularDish {
  id: string
  name: string
  venue: string
  venueId: string
  price: number
  orderCount: number
  likeCount: number
  image: string
}

// Demo data - Günün popülerleri (15:00'te güncellenir)
const dailyPopularVenues: PopularVenue[] = [
  { id: 'v1', name: "Nihal's Break Point", type: 'Kafe & Bar', image: '☕', rating: 4.8, orderCount: 127, trending: true },
  { id: 'v2', name: 'Bodrum Balık', type: 'Restoran', image: '🐟', rating: 4.9, orderCount: 98, trending: true },
  { id: 'v3', name: 'Pizza Roma', type: 'Fast Food', image: '🍕', rating: 4.6, orderCount: 85, trending: false },
  { id: 'v4', name: 'Sunset Beach Club', type: 'Beach Club', image: '🏖️', rating: 4.7, orderCount: 76, trending: true },
]

const dailyPopularDishes: PopularDish[] = [
  { id: 'd1', name: 'Izgara Levrek', venue: 'Bodrum Balık', venueId: 'v2', price: 320, orderCount: 89, likeCount: 156, image: '🐟' },
  { id: 'd2', name: 'Karışık Kahvaltı', venue: "Nihal's Break Point", venueId: 'v1', price: 280, orderCount: 76, likeCount: 134, image: '🍳' },
  { id: 'd3', name: 'Margherita Pizza', venue: 'Pizza Roma', venueId: 'v3', price: 165, orderCount: 68, likeCount: 98, image: '🍕' },
  { id: 'd4', name: 'Mojito', venue: 'Sunset Beach Club', venueId: 'v4', price: 180, orderCount: 54, likeCount: 87, image: '🍹' },
]

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [nextUpdateTime, setNextUpdateTime] = useState<string>('')

  useEffect(() => {
    setMounted(true)
    
    // Güncelleme zamanlarını hesapla
    const now = new Date()
    const today15 = new Date(now)
    today15.setHours(15, 0, 0, 0)
    
    if (now >= today15) {
      // Bugün 15:00 geçti, son güncelleme bugün 15:00
      setLastUpdateTime(today15.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
      // Sonraki güncelleme yarın 15:00
      const tomorrow15 = new Date(today15)
      tomorrow15.setDate(tomorrow15.getDate() + 1)
      setNextUpdateTime('Yarın 15:00')
    } else {
      // Bugün 15:00 gelmedi, son güncelleme dün 15:00
      const yesterday15 = new Date(today15)
      yesterday15.setDate(yesterday15.getDate() - 1)
      setLastUpdateTime('Dün 15:00')
      // Sonraki güncelleme bugün 15:00
      setNextUpdateTime('Bugün 15:00')
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="p-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">Merhaba{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''} 👋</p>
            <h1 className="text-xl font-bold">Ne yapmak istersin?</h1>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Search */}
        <button 
          onClick={() => router.push('/discover')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] rounded-2xl text-gray-400"
        >
          <Search className="w-5 h-5" />
          <span>Mekan veya yemek ara...</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => router.push('/scan')}
            className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl"
          >
            <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">QR Okut</span>
          </button>
          
          <button 
            onClick={() => router.push('/discover')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Keşfet</span>
          </button>
          
          <button 
            onClick={() => router.push('/discover?mode=takeaway')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-purple-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Paket</span>
          </button>
          
          <button 
            onClick={() => router.push('/here')}
            className="flex flex-col items-center gap-2 p-3 bg-[#1a1a1a] rounded-2xl"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">HERE</span>
          </button>
        </div>
      </div>

      {/* Günün Popülerleri - Section Header */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold">Günün Popülerleri</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{lastUpdateTime}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">Her gün 15:00'te güncellenir • Sonraki: {nextUpdateTime}</p>
      </div>

      {/* Popüler Mekanlar */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            En Çok Tercih Edilen Mekanlar
          </h3>
          <button onClick={() => router.push('/discover')} className="text-orange-500 text-sm flex items-center gap-1">
            Tümü <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {dailyPopularVenues.map((venue, index) => (
            <button
              key={venue.id}
              onClick={() => router.push(`/venue/${venue.id}`)}
              className="flex-shrink-0 w-40 bg-[#1a1a1a] rounded-2xl overflow-hidden"
            >
              <div className="h-24 bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center relative">
                <span className="text-4xl">{venue.image}</span>
                {index < 3 && (
                  <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                  }`}>
                    {index + 1}
                  </div>
                )}
                {venue.trending && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> HOT
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{venue.name}</h4>
                <p className="text-xs text-gray-400">{venue.type}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs">{venue.rating}</span>
                  </div>
                  <span className="text-xs text-gray-500">{venue.orderCount} sipariş</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Popüler Yemekler */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Bugün En Çok Sipariş Edilenler
          </h3>
        </div>
        
        <div className="space-y-3">
          {dailyPopularDishes.map((dish, index) => (
            <button
              key={dish.id}
              onClick={() => router.push(`/venue/${dish.venueId}/menu`)}
              className="w-full flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-2xl text-left"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-3xl">
                  {dish.image}
                </div>
                {index < 3 && (
                  <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                  }`}>
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">{dish.name}</h4>
                <p className="text-sm text-gray-400 truncate">{dish.venue}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Package className="w-3 h-3" /> {dish.orderCount}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {dish.likeCount}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-500">₺{dish.price}</p>
                <ArrowRight className="w-4 h-4 text-gray-500 ml-auto mt-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  )
}
