'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  CoffeeStats, 
  CoffeeShop, 
  FreeCoffeeBalance, 
  Badge, 
  CoffeeLevel,
  LEVEL_CONFIGS,
  BADGE_CONFIGS,
  BadgeCode
} from './coffeestar-types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ipobkbhcrkrqgbohdeea.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwb2JrYmhjcmtycWdib2hkZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzE1MjgsImV4cCI6MjA4MDAwNzUyOH0.QaUkRsv_B3Msc9qYmE366k1x_sTe8j5GxLUO3oKKg3w'
)

interface CoffeestarContextType {
  // Stats
  stats: CoffeeStats | null
  freeBalance: FreeCoffeeBalance | null
  isLoading: boolean
  
  // Coffee Shops
  coffeeShops: CoffeeShop[]
  nearbyShops: CoffeeShop[]
  favoriteShops: CoffeeShop[]
  
  // Actions
  refreshStats: () => Promise<void>
  addCoffee: (venueId: string, venueName: string, drinkName: string, amount: number) => Promise<void>
  useFreeCoffee: () => Promise<boolean>
  fetchCoffeeShops: (lat: number, lng: number, radius?: number) => Promise<void>
  toggleFavoriteShop: (shopId: string) => Promise<void>
  
  // Helpers
  getLevelConfig: (level: CoffeeLevel) => typeof LEVEL_CONFIGS[0]
  getNextLevelProgress: () => number
  getCoffeesUntilFree: () => number
}

const CoffeestarContext = createContext<CoffeestarContextType | undefined>(undefined)

export function CoffeestarProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [stats, setStats] = useState<CoffeeStats | null>(null)
  const [freeBalance, setFreeBalance] = useState<FreeCoffeeBalance | null>(null)
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([])
  const [nearbyShops, setNearbyShops] = useState<CoffeeShop[]>([])
  const [favoriteShops, setFavoriteShops] = useState<CoffeeShop[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Seviye hesaplama
  const calculateLevel = (totalCoffees: number): CoffeeLevel => {
    for (const config of [...LEVEL_CONFIGS].reverse()) {
      if (totalCoffees >= config.minCoffees) {
        return config.level
      }
    }
    return 'newbie'
  }

  // Seviye konfigürasyonu getir
  const getLevelConfig = (level: CoffeeLevel) => {
    return LEVEL_CONFIGS.find(c => c.level === level) || LEVEL_CONFIGS[0]
  }

  // Sonraki seviyeye ilerleme yüzdesi
  const getNextLevelProgress = (): number => {
    if (!stats) return 0
    const currentConfig = getLevelConfig(stats.level)
    const progress = ((stats.total_coffees - currentConfig.minCoffees) / 
                      (currentConfig.maxCoffees - currentConfig.minCoffees)) * 100
    return Math.min(100, Math.max(0, progress))
  }

  // Bedava kahveye kaç kahve kaldı
  const getCoffeesUntilFree = (): number => {
    if (!stats || !freeBalance) return 10
    return freeBalance.next_free_in
  }

  // Bedavaya kaç kahvede 1 (seviyeye göre)
  const getCoffeesForFree = (level: CoffeeLevel): number => {
    switch (level) {
      case 'newbie': return 10
      case 'coffee_lover': return 10
      case 'barista': return 8
      case 'gold_barista': return 6
      case 'platinum': return 5
      case 'coffee_master': return 4
      default: return 10
    }
  }

  // Stats yükle
  const refreshStats = async () => {
    if (!userId) return
    setIsLoading(true)

    try {
      // Stats'ı çek veya oluştur
      let { data: statsData, error } = await supabase
        .from('coffee_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Stats yoksa oluştur
        const newStats: Partial<CoffeeStats> = {
          user_id: userId,
          total_coffees: 0,
          total_spent: 0,
          total_free_earned: 0,
          current_streak: 0,
          longest_streak: 0,
          monthly_coffees: 0,
          monthly_spent: 0,
          level: 'newbie',
          level_progress: 0,
          next_level_coffees: 10,
          badges: []
        }

        const { data: created } = await supabase
          .from('coffee_stats')
          .insert(newStats)
          .select()
          .single()

        statsData = created
      }

      if (statsData) {
        // Badges'ı parse et ve eksikleri ekle
        const badges = initializeBadges(statsData.badges || [])
        setStats({ ...statsData, badges })

        // Free balance hesapla
        const coffeesForFree = getCoffeesForFree(statsData.level)
        const coffeesSinceLastFree = statsData.total_coffees % coffeesForFree
        
        setFreeBalance({
          user_id: userId,
          total_earned: statsData.total_free_earned || 0,
          total_used: 0, // TODO: Kullanılan bedavaları takip et
          available: statsData.total_free_earned || 0,
          next_free_in: coffeesForFree - coffeesSinceLastFree,
          coffees_for_free: coffeesForFree
        })
      }
    } catch (err) {
      console.error('Error loading coffee stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Badge'leri başlat
  const initializeBadges = (earnedBadges: Badge[]): Badge[] => {
    const allBadges: Badge[] = Object.entries(BADGE_CONFIGS).map(([code, config]) => {
      const earned = earnedBadges.find(b => b.code === code)
      return {
        id: code,
        ...config,
        is_earned: !!earned,
        earned_at: earned?.earned_at,
        progress: earned?.progress || 0,
        current: earned?.current || 0
      }
    })
    return allBadges
  }

  // Kahve ekle (sipariş sonrası çağrılır)
  const addCoffee = async (venueId: string, venueName: string, drinkName: string, amount: number) => {
    if (!userId || !stats) return

    const newTotal = stats.total_coffees + 1
    const newLevel = calculateLevel(newTotal)
    const coffeesForFree = getCoffeesForFree(newLevel)
    const earnedFree = Math.floor(newTotal / coffeesForFree) > Math.floor(stats.total_coffees / coffeesForFree)

    // İstatistikleri güncelle
    const updates: Partial<CoffeeStats> = {
      total_coffees: newTotal,
      total_spent: stats.total_spent + amount,
      monthly_coffees: stats.monthly_coffees + 1,
      monthly_spent: stats.monthly_spent + amount,
      level: newLevel,
      current_streak: stats.current_streak + 1, // TODO: Günlük streak kontrolü
      total_free_earned: earnedFree ? stats.total_free_earned + 1 : stats.total_free_earned,
      updated_at: new Date().toISOString()
    }

    // Favori içecek güncelle
    if (!stats.favorite_drink || drinkName === stats.favorite_drink) {
      updates.favorite_drink = drinkName
      updates.favorite_drink_count = (stats.favorite_drink_count || 0) + 1
    }

    // Favori mekan güncelle
    if (!stats.favorite_shop_id || venueId === stats.favorite_shop_id) {
      updates.favorite_shop_id = venueId
      updates.favorite_shop_name = venueName
      updates.favorite_shop_visits = (stats.favorite_shop_visits || 0) + 1
    }

    try {
      await supabase
        .from('coffee_stats')
        .update(updates)
        .eq('user_id', userId)

      // Sipariş kaydı oluştur
      await supabase
        .from('coffee_orders')
        .insert({
          user_id: userId,
          venue_id: venueId,
          venue_name: venueName,
          drink_name: drinkName,
          amount: amount,
          created_at: new Date().toISOString()
        })

      // Badge kontrolü
      await checkAndAwardBadges(newTotal, stats.current_streak + 1)

      // Stats'ı yenile
      await refreshStats()
    } catch (err) {
      console.error('Error adding coffee:', err)
    }
  }

  // Badge kontrolü ve ödüllendirme
  const checkAndAwardBadges = async (totalCoffees: number, streak: number) => {
    if (!userId || !stats) return

    const newBadges: BadgeCode[] = []

    // İlk kahve
    if (totalCoffees === 1 && !stats.badges.find(b => b.code === 'first_coffee')?.is_earned) {
      newBadges.push('first_coffee')
    }

    // 100. kahve
    if (totalCoffees >= 100 && !stats.badges.find(b => b.code === 'century')?.is_earned) {
      newBadges.push('century')
    }

    // 7 gün streak
    if (streak >= 7 && !stats.badges.find(b => b.code === 'streak_7')?.is_earned) {
      newBadges.push('streak_7')
    }

    // 30 gün streak
    if (streak >= 30 && !stats.badges.find(b => b.code === 'streak_30')?.is_earned) {
      newBadges.push('streak_30')
    }

    // TODO: Diğer badge kontrolleri (saat, mekan çeşitliliği vs.)

    if (newBadges.length > 0) {
      const updatedBadges = [...stats.badges]
      for (const badgeCode of newBadges) {
        const badgeIndex = updatedBadges.findIndex(b => b.code === badgeCode)
        if (badgeIndex >= 0) {
          updatedBadges[badgeIndex] = {
            ...updatedBadges[badgeIndex],
            is_earned: true,
            earned_at: new Date().toISOString()
          }
        }
      }

      await supabase
        .from('coffee_stats')
        .update({ badges: updatedBadges })
        .eq('user_id', userId)
    }
  }

  // Bedava kahve kullan
  const useFreeCoffee = async (): Promise<boolean> => {
    if (!freeBalance || freeBalance.available <= 0) return false

    // TODO: Bedava kahve kullanımını kaydet
    setFreeBalance(prev => prev ? {
      ...prev,
      available: prev.available - 1,
      total_used: prev.total_used + 1
    } : null)

    return true
  }

  // Coffee shop'ları çek (Google Places API)
  const fetchCoffeeShops = async (lat: number, lng: number, radius: number = 3000) => {
    try {
      const response = await fetch(
        `/api/places/coffee-shops?lat=${lat}&lng=${lng}&radius=${radius}`
      )
      const data = await response.json()
      
      if (data.shops) {
        setCoffeeShops(data.shops)
        setNearbyShops(data.shops.slice(0, 10))
      }
    } catch (err) {
      console.error('Error fetching coffee shops:', err)
    }
  }

  // Favori toggle
  const toggleFavoriteShop = async (shopId: string) => {
    if (!userId) return

    const isFavorite = favoriteShops.some(s => s.id === shopId)
    
    if (isFavorite) {
      setFavoriteShops(prev => prev.filter(s => s.id !== shopId))
      await supabase
        .from('favorite_coffee_shops')
        .delete()
        .eq('user_id', userId)
        .eq('shop_id', shopId)
    } else {
      const shop = coffeeShops.find(s => s.id === shopId)
      if (shop) {
        setFavoriteShops(prev => [...prev, shop])
        await supabase
          .from('favorite_coffee_shops')
          .insert({ user_id: userId, shop_id: shopId })
      }
    }
  }

  // İlk yükleme
  useEffect(() => {
    if (userId) {
      refreshStats()
    }
  }, [userId])

  return (
    <CoffeestarContext.Provider value={{
      stats,
      freeBalance,
      isLoading,
      coffeeShops,
      nearbyShops,
      favoriteShops,
      refreshStats,
      addCoffee,
      useFreeCoffee,
      fetchCoffeeShops,
      toggleFavoriteShop,
      getLevelConfig,
      getNextLevelProgress,
      getCoffeesUntilFree
    }}>
      {children}
    </CoffeestarContext.Provider>
  )
}

export function useCoffeestar() {
  const context = useContext(CoffeestarContext)
  if (!context) {
    throw new Error('useCoffeestar must be used within CoffeestarProvider')
  }
  return context
}
