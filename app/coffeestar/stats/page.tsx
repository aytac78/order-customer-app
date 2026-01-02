'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Coffee, 
  Gift, 
  Star, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Heart,
  Calendar,
  Flame,
  Award,
  Trophy,
  Zap,
  Target,
  ChevronRight,
  Sparkles,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useCoffeestar } from '@/lib/coffeestar-context'
import { LEVEL_CONFIGS, BADGE_CONFIGS, Badge, CoffeeLevel } from '@/lib/coffeestar-types'

export default function CoffeestarStatsPage() {
  const router = useRouter()
  const { stats, freeBalance, getLevelConfig, getNextLevelProgress } = useCoffeestar()
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'history'>('overview')

  const levelConfig = stats ? getLevelConfig(stats.level) : LEVEL_CONFIGS[0]
  const progress = getNextLevelProgress()
  const nextLevel = LEVEL_CONFIGS.find(l => l.minCoffees > (stats?.total_coffees || 0))

  // Demo data for charts
  const weeklyData = [
    { day: 'Pzt', count: 2 },
    { day: 'Sal', count: 1 },
    { day: 'Çar', count: 3 },
    { day: 'Per', count: 2 },
    { day: 'Cum', count: 4 },
    { day: 'Cmt', count: 3 },
    { day: 'Paz', count: 1 }
  ]

  const maxWeekly = Math.max(...weeklyData.map(d => d.count))

  // Badge kategorileri
  const badgeCategories = {
    time: ['early_bird', 'night_owl', 'weekend_warrior'],
    streak: ['streak_7', 'streak_30'],
    exploration: ['explorer', 'adventurer', 'regular'],
    achievement: ['first_coffee', 'century', 'espresso_lover'],
    social: ['generous', 'reviewer', 'photographer'],
    specialty: ['milk_expert']
  }

  const earnedBadges = stats?.badges?.filter(b => b.is_earned) || []
  const inProgressBadges = stats?.badges?.filter(b => !b.is_earned && (b.progress || 0) > 0) || []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-900/30 to-transparent pt-4 pb-8">
        <div className="px-4">
          <div className="flex items-center justify-between mb-6">
            <button type="button" 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">Coffeestar Stats</h1>
            <div className="w-10" />
          </div>

          {/* Level Card */}
          <div className={`bg-gradient-to-br ${levelConfig.color} rounded-2xl p-6 relative overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 text-6xl">☕</div>
              <div className="absolute bottom-4 left-4 text-4xl">☕</div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Seviye</p>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl">{levelConfig.emoji}</span>
                    <span className="text-2xl font-bold">{levelConfig.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">{stats?.total_coffees || 0}</p>
                  <p className="text-white/60 text-sm">Toplam Kahve</p>
                </div>
              </div>

              {/* Progress to next level */}
              {nextLevel && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/60">Sonraki: {nextLevel.emoji} {nextLevel.name}</span>
                    <span>{stats?.total_coffees || 0}/{nextLevel.minCoffees}</span>
                  </div>
                  <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm text-white/60 mb-2">Avantajların:</p>
                <div className="flex flex-wrap gap-2">
                  {levelConfig.benefits.map((benefit, i) => (
                    <span key={i} className="px-2 py-1 bg-white/20 rounded-full text-xs">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
            <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{freeBalance?.available || 0}</p>
            <p className="text-xs text-gray-500">Bedava Kahve</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-400">{stats?.current_streak || 0}</p>
            <p className="text-xs text-gray-500">Gün Streak</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center border border-white/5">
            <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-400">{earnedBadges.length}</p>
            <p className="text-xs text-gray-500">Rozet</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="flex bg-white/5 rounded-xl p-1">
          {(['overview', 'badges', 'history'] as const).map((tab) => (
            <button type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-amber-500 text-white' : 'text-gray-400'
              }`}
            >
              {tab === 'overview' && 'Genel'}
              {tab === 'badges' && 'Rozetler'}
              {tab === 'history' && 'Geçmiş'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Free Coffee Progress */}
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Bedava Kahve</h3>
                  <p className="text-sm text-gray-500">
                    {freeBalance?.coffees_for_free || 10} kahvede 1 bedava
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {Array.from({ length: freeBalance?.coffees_for_free || 10 }).map((_, i) => {
                  const filled = i < ((freeBalance?.coffees_for_free || 10) - (freeBalance?.next_free_in || 0))
                  return (
                    <div 
                      key={i}
                      className={`flex-1 h-3 rounded-full ${filled ? 'bg-amber-500' : 'bg-white/10'}`}
                    />
                  )
                })}
              </div>

              <p className="text-center text-sm text-gray-400">
                {freeBalance?.next_free_in === 0 ? (
                  <span className="text-green-400 font-medium">🎉 Bedava kahven hazır!</span>
                ) : (
                  <>{freeBalance?.next_free_in} kahve daha → Bedava!</>
                )}
              </p>
            </div>

            {/* This Month */}
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Bu Ay</h3>
                  <p className="text-sm text-gray-500">Aralık 2025</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-400">{stats?.monthly_coffees || 0}</p>
                  <p className="text-sm text-gray-500">Kahve</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">₺{stats?.monthly_spent || 0}</p>
                  <p className="text-sm text-gray-500">Harcama</p>
                </div>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Haftalık</h3>
                  <p className="text-sm text-gray-500">Son 7 gün</p>
                </div>
              </div>

              <div className="flex items-end justify-between h-32 gap-2">
                {weeklyData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-amber-500 rounded-t-lg transition-all"
                      style={{ height: `${(day.count / maxWeekly) * 100}%`, minHeight: day.count > 0 ? '8px' : '0' }}
                    />
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorites */}
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="font-semibold">Favorilerin</h3>
              </div>

              <div className="space-y-4">
                {/* Favorite Drink */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="font-medium">{stats?.favorite_drink || 'Henüz yok'}</p>
                      <p className="text-xs text-gray-500">En sevdiğin içecek</p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold">{stats?.favorite_drink_count || 0}x</span>
                </div>

                {/* Favorite Shop */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="font-medium">{stats?.favorite_shop_name || 'Henüz yok'}</p>
                      <p className="text-xs text-gray-500">En çok gittiğin mekan</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold">{stats?.favorite_shop_visits || 0}x</span>
                </div>

                {/* Favorite Hour */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="font-medium">
                        {stats?.favorite_hour !== undefined 
                          ? `${String(stats.favorite_hour).padStart(2, '0')}:00`
                          : 'Henüz yok'
                        }
                      </p>
                      <p className="text-xs text-gray-500">Favori saatin</p>
                    </div>
                  </div>
                  {stats?.favorite_hour !== undefined && (
                    <span className="text-blue-400 text-sm">
                      {stats.favorite_hour < 10 ? '☀️ Sabahçı' : stats.favorite_hour > 18 ? '🌙 Akşamcı' : '☕ Öğlenci'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Kazanılan Rozetler ({earnedBadges.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {earnedBadges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 text-center border border-amber-500/30"
                    >
                      <span className="text-4xl block mb-2">{badge.emoji}</span>
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {inProgressBadges.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Devam Edenler
                </h3>
                <div className="space-y-3">
                  {inProgressBadges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl opacity-50">{badge.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{badge.name}</p>
                            <span className="text-sm text-gray-500">
                              {badge.current || 0}/{badge.requirement}
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${(badge.progress || 0)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Badges */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-400" />
                Tüm Rozetler
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(BADGE_CONFIGS).map(([code, config]) => {
                  const earned = earnedBadges.find(b => b.code === code)
                  return (
                    <div 
                      key={code}
                      className={`rounded-xl p-3 text-center ${
                        earned 
                          ? 'bg-amber-500/20 border border-amber-500/30' 
                          : 'bg-white/5 border border-white/5 opacity-40'
                      }`}
                    >
                      <span className="text-2xl block">{config.emoji}</span>
                      <p className="text-xs mt-1 truncate">{config.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="text-center py-12">
              <Coffee className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-400 mb-2">Sipariş Geçmişi</h3>
              <p className="text-sm text-gray-600">Yakında burada tüm kahve siparişlerin listelenecek</p>
            </div>
          </div>
        )}
      </div>

      {/* Level Legend */}
      <div className="px-4 mt-8">
        <h3 className="font-semibold mb-3">Seviye Tablosu</h3>
        <div className="space-y-2">
          {LEVEL_CONFIGS.map((level) => (
            <div 
              key={level.level}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                stats?.level === level.level 
                  ? 'bg-amber-500/20 border border-amber-500/30' 
                  : 'bg-white/5 border border-white/5'
              }`}
            >
              <span className="text-2xl">{level.emoji}</span>
              <div className="flex-1">
                <p className="font-medium">{level.name}</p>
                <p className="text-xs text-gray-500">{level.minCoffees}+ kahve</p>
              </div>
              {stats?.level === level.level && (
                <span className="px-2 py-1 bg-amber-500 rounded-full text-xs font-medium">Şu an</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}