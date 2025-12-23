'use client'

import { useRouter } from 'next/navigation'
import { Coffee, Star, Gift, ChevronRight, Sparkles } from 'lucide-react'
import { useCoffeestar } from '@/lib/coffeestar-context'

export default function CoffeestarHomeCard() {
  const router = useRouter()
  const { stats, freeBalance, isLoading, getLevelConfig, getNextLevelProgress, getCoffeesUntilFree } = useCoffeestar()

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-2xl p-5 border border-amber-500/20 animate-pulse">
        <div className="h-24"></div>
      </div>
    )
  }

  const levelConfig = stats ? getLevelConfig(stats.level) : null
  const progress = getNextLevelProgress()
  const coffeesUntilFree = getCoffeesUntilFree()

  return (
    <button
      onClick={() => router.push('/coffeestar')}
      className="w-full text-left"
    >
      <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-2xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all group relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 right-2">☕</div>
          <div className="absolute top-12 right-16">☕</div>
          <div className="absolute bottom-4 right-8">☕</div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">Coffeestar</h3>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">Michelin</span>
                </div>
              </div>
              <p className="text-sm text-amber-200/60">Kahvenin yıldızı</p>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
          {/* Toplam Kahve */}
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats?.total_coffees || 0}</p>
            <p className="text-xs text-amber-200/60">Kahve</p>
          </div>

          {/* Seviye */}
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-2xl">{levelConfig?.emoji || '☕'}</p>
            <p className="text-xs text-amber-200/60">{levelConfig?.name || 'Çaylak'}</p>
          </div>

          {/* Bedava */}
          <div className="bg-black/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{freeBalance?.available || 0}</p>
            <p className="text-xs text-amber-200/60">Bedava</p>
          </div>
        </div>

        {/* Progress to next free */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-200/80">
                {coffeesUntilFree > 0 
                  ? `${coffeesUntilFree} kahve daha → Bedava!`
                  : '🎉 Bedava kahven hazır!'
                }
              </span>
            </div>
            <span className="text-xs text-amber-400">
              {freeBalance?.coffees_for_free ? `${freeBalance.coffees_for_free - coffeesUntilFree}/${freeBalance.coffees_for_free}` : '0/10'}
            </span>
          </div>
          
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ 
                width: freeBalance?.coffees_for_free 
                  ? `${((freeBalance.coffees_for_free - coffeesUntilFree) / freeBalance.coffees_for_free) * 100}%` 
                  : '0%' 
              }}
            />
          </div>
        </div>

        {/* Sparkle effect on hover */}
        <div className="absolute top-4 right-16 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
      </div>
    </button>
  )
}
