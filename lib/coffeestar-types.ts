// =============================================
// COFFEESTAR - TYPE DEFINITIONS
// Kahvenin Michelin Yıldızı ⭐☕
// =============================================

export interface CoffeeShop {
  id: string
  place_id: string
  name: string
  address: string
  district: string
  city: string
  lat: number
  lng: number
  rating: number
  user_ratings_total: number
  price_level: number
  photo_url?: string
  photos?: string[]
  is_open?: boolean
  opening_hours?: string[]
  phone?: string
  website?: string
  instagram?: string
  distance_km?: number
  is_partner: boolean
  venue_id?: string // ORDER venue bağlantısı
  features: CoffeeShopFeature[]
  specialty?: string // "Specialty Coffee", "Third Wave" vs.
}

export type CoffeeShopFeature = 
  | 'wifi'
  | 'outdoor'
  | 'pet_friendly'
  | 'laptop_friendly'
  | 'specialty_coffee'
  | 'third_wave'
  | 'roastery'
  | 'vegan_options'
  | 'gluten_free'
  | 'breakfast'
  | 'brunch'

export interface CoffeeMenuItem {
  id: string
  venue_id: string
  name: string
  description?: string
  price: number
  category: CoffeeCategory
  image_url?: string
  is_available: boolean
  is_popular: boolean
  is_new: boolean
  options?: CoffeeOption[]
  allergens?: string[]
  calories?: number
}

export type CoffeeCategory = 
  | 'espresso_based'      // Espresso, Americano, Latte, Cappuccino
  | 'filter_coffee'       // V60, Chemex, Aeropress, French Press
  | 'cold_drinks'         // Iced Coffee, Cold Brew, Frappe
  | 'signature'           // Özel tarifler
  | 'tea'                 // Çay çeşitleri
  | 'hot_chocolate'       // Sıcak çikolata
  | 'pastry'              // Pasta, kurabiye
  | 'cake'                // Kek, cheesecake
  | 'dessert'             // Tatlılar
  | 'snack'               // Hafif atıştırmalık

export interface CoffeeOption {
  id: string
  name: string
  type: 'size' | 'milk' | 'sugar' | 'extra' | 'temperature'
  choices: CoffeeOptionChoice[]
  is_required: boolean
  max_selections: number
}

export interface CoffeeOptionChoice {
  id: string
  name: string
  price_modifier: number
  is_default?: boolean
}

// Kullanıcı İstatistikleri
export interface CoffeeStats {
  user_id: string
  total_coffees: number
  total_spent: number
  total_free_earned: number
  current_streak: number
  longest_streak: number
  favorite_drink?: string
  favorite_drink_count: number
  favorite_shop_id?: string
  favorite_shop_name?: string
  favorite_shop_visits: number
  favorite_hour: number // 0-23
  favorite_day: number // 0-6 (Pazar-Cumartesi)
  monthly_coffees: number
  monthly_spent: number
  level: CoffeeLevel
  level_progress: number // 0-100
  next_level_coffees: number
  badges: Badge[]
  created_at: string
  updated_at: string
}

export type CoffeeLevel = 
  | 'newbie'        // ☕ Çaylak (0-10)
  | 'coffee_lover'  // ☕☕ Kahve Sever (11-50)
  | 'barista'       // ☕☕☕ Barista (51-100)
  | 'gold_barista'  // ⭐ Gold Barista (101-250)
  | 'platinum'      // 💎 Platinum (251-500)
  | 'coffee_master' // 👑 Kahve Ustası (500+)

export interface LevelConfig {
  level: CoffeeLevel
  name: string
  emoji: string
  minCoffees: number
  maxCoffees: number
  color: string
  benefits: string[]
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 'newbie',
    name: 'Çaylak',
    emoji: '☕',
    minCoffees: 0,
    maxCoffees: 10,
    color: 'from-gray-400 to-gray-500',
    benefits: ['Her 10 kahvede 1 bedava']
  },
  {
    level: 'coffee_lover',
    name: 'Kahve Sever',
    emoji: '☕☕',
    minCoffees: 11,
    maxCoffees: 50,
    color: 'from-amber-400 to-amber-500',
    benefits: ['Her 10 kahvede 1 bedava', '%5 indirim']
  },
  {
    level: 'barista',
    name: 'Barista',
    emoji: '☕☕☕',
    minCoffees: 51,
    maxCoffees: 100,
    color: 'from-orange-400 to-orange-500',
    benefits: ['Her 8 kahvede 1 bedava', '%10 indirim']
  },
  {
    level: 'gold_barista',
    name: 'Gold Barista',
    emoji: '⭐',
    minCoffees: 101,
    maxCoffees: 250,
    color: 'from-yellow-400 to-yellow-500',
    benefits: ['Her 6 kahvede 1 bedava', '%15 indirim', 'Öncelikli sipariş']
  },
  {
    level: 'platinum',
    name: 'Platinum',
    emoji: '💎',
    minCoffees: 251,
    maxCoffees: 500,
    color: 'from-purple-400 to-purple-500',
    benefits: ['Her 5 kahvede 1 bedava', '%20 indirim', 'VIP etkinlikler']
  },
  {
    level: 'coffee_master',
    name: 'Kahve Ustası',
    emoji: '👑',
    minCoffees: 501,
    maxCoffees: 999999,
    color: 'from-rose-400 to-rose-500',
    benefits: ['Her 4 kahvede 1 bedava', '%25 indirim', 'Özel blend hediyeler']
  }
]

// Rozetler
export interface Badge {
  id: string
  code: BadgeCode
  name: string
  description: string
  emoji: string
  earned_at?: string
  is_earned: boolean
  progress?: number // 0-100
  requirement: number
  current?: number
}

export type BadgeCode =
  | 'early_bird'      // ☀️ Sabahçı - 10 sipariş 09:00 öncesi
  | 'night_owl'       // 🌙 Gece Kuşu - 10 sipariş 22:00 sonrası
  | 'streak_7'        // 🔥 Streak 7 - 7 gün üst üste
  | 'streak_30'       // 🔥🔥 Streak 30 - 30 gün üst üste
  | 'explorer'        // 🌍 Gezgin - 10 farklı mekanda
  | 'milk_expert'     // 🥛 Süt Uzmanı - 5 farklı süt tipi
  | 'century'         // 💯 Yüzüncü - 100. sipariş
  | 'generous'        // 🎁 Cömert - 5 hediye gönderdi
  | 'reviewer'        // ✍️ Yorumcu - 10 yorum yazdı
  | 'photographer'    // 📸 Fotoğrafçı - 10 fotoğraf paylaştı
  | 'regular'         // 🏠 Müdavim - Aynı mekana 20 kez
  | 'adventurer'      // 🎲 Maceracı - 10 farklı içecek denedi
  | 'first_coffee'    // 🎉 İlk Kahve - İlk sipariş
  | 'weekend_warrior' // 🎊 Hafta Sonu Savaşçısı - 10 hafta sonu siparişi
  | 'espresso_lover'  // ⚡ Espresso Aşığı - 20 espresso bazlı içecek

export const BADGE_CONFIGS: Record<BadgeCode, Omit<Badge, 'id' | 'earned_at' | 'is_earned' | 'progress' | 'current'>> = {
  early_bird: {
    code: 'early_bird',
    name: 'Sabahçı',
    description: '09:00 öncesi 10 sipariş ver',
    emoji: '☀️',
    requirement: 10
  },
  night_owl: {
    code: 'night_owl',
    name: 'Gece Kuşu',
    description: '22:00 sonrası 10 sipariş ver',
    emoji: '🌙',
    requirement: 10
  },
  streak_7: {
    code: 'streak_7',
    name: '7 Gün Streak',
    description: '7 gün üst üste kahve iç',
    emoji: '🔥',
    requirement: 7
  },
  streak_30: {
    code: 'streak_30',
    name: '30 Gün Streak',
    description: '30 gün üst üste kahve iç',
    emoji: '🔥',
    requirement: 30
  },
  explorer: {
    code: 'explorer',
    name: 'Gezgin',
    description: '10 farklı mekanda sipariş ver',
    emoji: '🌍',
    requirement: 10
  },
  milk_expert: {
    code: 'milk_expert',
    name: 'Süt Uzmanı',
    description: '5 farklı süt tipi dene',
    emoji: '🥛',
    requirement: 5
  },
  century: {
    code: 'century',
    name: 'Yüzüncü',
    description: '100 kahve siparişine ulaş',
    emoji: '💯',
    requirement: 100
  },
  generous: {
    code: 'generous',
    name: 'Cömert',
    description: '5 arkadaşına kahve hediye et',
    emoji: '🎁',
    requirement: 5
  },
  reviewer: {
    code: 'reviewer',
    name: 'Yorumcu',
    description: '10 yorum yaz',
    emoji: '✍️',
    requirement: 10
  },
  photographer: {
    code: 'photographer',
    name: 'Fotoğrafçı',
    description: '10 kahve fotoğrafı paylaş',
    emoji: '📸',
    requirement: 10
  },
  regular: {
    code: 'regular',
    name: 'Müdavim',
    description: 'Aynı mekana 20 kez git',
    emoji: '🏠',
    requirement: 20
  },
  adventurer: {
    code: 'adventurer',
    name: 'Maceracı',
    description: '10 farklı içecek dene',
    emoji: '🎲',
    requirement: 10
  },
  first_coffee: {
    code: 'first_coffee',
    name: 'İlk Kahve',
    description: 'İlk siparişini ver',
    emoji: '🎉',
    requirement: 1
  },
  weekend_warrior: {
    code: 'weekend_warrior',
    name: 'Hafta Sonu Savaşçısı',
    description: 'Hafta sonları 10 sipariş ver',
    emoji: '🎊',
    requirement: 10
  },
  espresso_lover: {
    code: 'espresso_lover',
    name: 'Espresso Aşığı',
    description: '20 espresso bazlı içecek iç',
    emoji: '⚡',
    requirement: 20
  }
}

// Sipariş Geçmişi
export interface CoffeeOrder {
  id: string
  user_id: string
  venue_id: string
  venue_name: string
  items: CoffeeOrderItem[]
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  order_type: 'dine_in' | 'takeaway'
  created_at: string
  completed_at?: string
}

export interface CoffeeOrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  options?: {
    size?: string
    milk?: string
    sugar?: string
    extras?: string[]
    temperature?: string
  }
  notes?: string
}

// Free Coffee Tracking
export interface FreeCoffeeBalance {
  user_id: string
  total_earned: number
  total_used: number
  available: number
  next_free_in: number // Kaç kahve daha gerekiyor
  coffees_for_free: number // Seviyeye göre kaç kahvede 1 bedava
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_avatar?: string
  total_coffees: number
  level: CoffeeLevel
  level_emoji: string
}
