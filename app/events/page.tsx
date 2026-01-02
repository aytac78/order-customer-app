'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, Calendar, Clock, MapPin, Music, Utensils, PartyPopper, Star,
  Filter, X, SlidersHorizontal, Check, ChevronDown, Mic2, Radio, Guitar,
  Wine, Sparkles, Users, DollarSign, Sun, Waves, UtensilsCrossed
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

interface Event {
  id: string
  venue_id: string
  title: string
  description: string
  start_date: string
  start_time: string
  end_time: string
  type: string
  music_genre?: string
  price?: number
  features?: string[]
  age_limit?: number
  capacity?: number
  available_spots?: number
  image_url?: string
  is_featured: boolean
  is_active: boolean
  venue?: {
    name: string
    neighborhood: string
    district: string
  }
}

interface Filters {
  types: string[]
  musicGenres: string[]
  dateRange: string
  priceRange: string
  features: string[]
  searchQuery: string
}

export default function EventsPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  
  const [filters, setFilters] = useState<Filters>({
    types: [],
    musicGenres: [],
    dateRange: '',
    priceRange: '',
    features: [],
    searchQuery: ''
  })

  // Dynamic configs with translations
  const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
    dj: { icon: Radio, label: t('events.typeDJ'), color: 'bg-pink-500' },
    entertainment: { icon: Sparkles, label: t('events.typeEntertainment'), color: 'bg-cyan-500' },
    music: { icon: Music, label: t('events.typeMusic'), color: 'bg-purple-500' },
    food: { icon: Utensils, label: t('events.typeFood'), color: 'bg-orange-500' },
    party: { icon: PartyPopper, label: t('events.typeParty'), color: 'bg-pink-500' },
    brunch: { icon: UtensilsCrossed, label: t('events.typeBrunch'), color: 'bg-yellow-500' },
    wine: { icon: Wine, label: t('events.typeWine'), color: 'bg-red-500' },
    standup: { icon: Mic2, label: t('events.typeStandup'), color: 'bg-indigo-500' },
    other: { icon: Star, label: t('events.typeOther'), color: 'bg-blue-500' }
  }

  const musicGenres = [
    { id: 'live_music', label: t('events.musicLive'), icon: Music },
    { id: 'dj', label: t('events.musicDJ'), icon: Radio },
    { id: 'fasil', label: t('events.musicFasil'), icon: Guitar },
    { id: 'acoustic', label: t('events.musicAcoustic'), icon: Guitar },
    { id: 'karaoke', label: t('events.musicKaraoke'), icon: Mic2 },
    { id: 'concert', label: t('events.musicConcert'), icon: Music },
  ]

  const featureOptions = [
    { id: 'fix_menu', label: t('events.featureFixMenu'), icon: UtensilsCrossed },
    { id: 'outdoor', label: t('events.featureOutdoor'), icon: Sun },
    { id: 'sea_view', label: t('events.featureSeaView'), icon: Waves },
    { id: 'reservation_required', label: t('events.featureReservationRequired'), icon: Calendar },
    { id: 'free_entry', label: t('events.featureFreeEntry'), icon: Sparkles },
  ]

  const priceRanges = [
    { id: 'free', label: t('events.priceFree'), min: 0, max: 0 },
    { id: '0-500', label: t('events.price0to500'), min: 0, max: 500 },
    { id: '500-1000', label: t('events.price500to1000'), min: 500, max: 1000 },
    { id: '1000+', label: t('events.price1000plus'), min: 1000, max: 999999 },
  ]

  const dateRanges = [
    { id: 'today', label: t('events.dateToday') },
    { id: 'tomorrow', label: t('events.dateTomorrow') },
    { id: 'this_weekend', label: t('events.dateThisWeekend') },
    { id: 'this_week', label: t('events.dateThisWeek') },
    { id: 'this_month', label: t('events.dateThisMonth') },
  ]

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    applyFilters()
    countActiveFilters()
  }, [filters, events])

  const loadEvents = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        venue:venues(name, neighborhood, district)
      `)
      .gte('start_date', today)
      .eq('is_active', true)
      .order('start_date', { ascending: true })

    if (!error && data) {
      setEvents(data)
      setFilteredEvents(data)
    }
    setLoading(false)
  }

  const countActiveFilters = () => {
    let count = 0
    if (filters.types.length > 0) count++
    if (filters.musicGenres.length > 0) count++
    if (filters.dateRange) count++
    if (filters.priceRange) count++
    if (filters.features.length > 0) count++
    if (filters.searchQuery) count++
    setActiveFilterCount(count)
  }

  const applyFilters = () => {
    let result = [...events]

    // Search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.venue?.name.toLowerCase().includes(query)
      )
    }

    // Type filter
    if (filters.types.length > 0) {
      result = result.filter(e => filters.types.includes(e.type))
    }

    // Music genre
    if (filters.musicGenres.length > 0) {
      result = result.filter(e => 
        e.music_genre && filters.musicGenres.includes(e.music_genre)
      )
    }

    // Date filter
    if (filters.dateRange) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      result = result.filter(e => {
        const eventDate = new Date(e.start_date)
        eventDate.setHours(0, 0, 0, 0)
        
        switch (filters.dateRange) {
          case 'today':
            return eventDate.getTime() === today.getTime()
          case 'tomorrow':
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            return eventDate.getTime() === tomorrow.getTime()
          case 'this_weekend':
            const dayOfWeek = today.getDay()
            const saturday = new Date(today)
            saturday.setDate(today.getDate() + (6 - dayOfWeek))
            const sunday = new Date(saturday)
            sunday.setDate(saturday.getDate() + 1)
            return eventDate >= saturday && eventDate <= sunday
          case 'this_week':
            const endOfWeek = new Date(today)
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
            return eventDate >= today && eventDate <= endOfWeek
          case 'this_month':
            return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear()
          default:
            return true
        }
      })
    }

    // Price filter
    if (filters.priceRange) {
      const range = priceRanges.find(r => r.id === filters.priceRange)
      if (range) {
        result = result.filter(e => {
          const price = e.price || 0
          if (range.id === 'free') return price === 0
          return price >= range.min && price <= range.max
        })
      }
    }

    // Feature filter
    if (filters.features.length > 0) {
      result = result.filter(e => {
        if (!e.features) return false
        return filters.features.every(f => e.features?.includes(f))
      })
    }

    setFilteredEvents(result)
  }

  const toggleFilter = (category: keyof Filters, value: string) => {
    setFilters(prev => {
      if (category === 'dateRange' || category === 'priceRange' || category === 'searchQuery') {
        return { ...prev, [category]: prev[category] === value ? '' : value }
      }
      
      const arr = prev[category] as string[]
      if (arr.includes(value)) {
        return { ...prev, [category]: arr.filter(v => v !== value) }
      }
      return { ...prev, [category]: [...arr, value] }
    })
  }

  const clearFilters = () => {
    setFilters({
      types: [],
      musicGenres: [],
      dateRange: '',
      priceRange: '',
      features: [],
      searchQuery: ''
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return t('events.dateToday')
    if (date.toDateString() === tomorrow.toDateString()) return t('events.dateTomorrow')
    
    const localeCode = locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-US' : locale
    return date.toLocaleDateString(localeCode, { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long' 
    })
  }

  const formatTime = (time: string) => time?.slice(0, 5) || ''

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t('events.title')}</h1>
            <p className="text-gray-400 text-sm">{t('events.eventsFound', { count: filteredEvents.length })}</p>
          </div>
          <button type="button" 
            onClick={() => setShowFilterModal(true)}
            className="relative w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder={t('events.searchPlaceholder')}
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full px-4 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
          />
          {filters.searchQuery && (
            <button type="button" 
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {dateRanges.slice(0, 3).map(range => (
            <button type="button"
              key={range.id}
              onClick={() => toggleFilter('dateRange', range.id)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filters.dateRange === range.id 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-[#1a1a1a] text-gray-400 border border-white/10'
              }`}
            >
              {range.label}
            </button>
          ))}
          <div className="w-px bg-white/10" />
          {Object.entries(typeConfig).slice(0, 4).map(([key, config]) => (
            <button type="button"
              key={key}
              onClick={() => toggleFilter('types', key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filters.types.includes(key)
                  ? `${config.color} text-white`
                  : 'bg-[#1a1a1a] text-gray-400 border border-white/10'
              }`}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-gray-400">{t('events.activeFilters')}</span>
            {filters.types.map(type => (
              <span key={type} className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs flex items-center gap-1">
                {typeConfig[type]?.label || type}
                <button type="button" onClick={() => toggleFilter('types', type)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {filters.dateRange && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                {dateRanges.find(d => d.id === filters.dateRange)?.label}
                <button type="button" onClick={() => toggleFilter('dateRange', filters.dateRange)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filters.priceRange && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                {priceRanges.find(p => p.id === filters.priceRange)?.label}
                <button type="button" onClick={() => toggleFilter('priceRange', filters.priceRange)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button type="button" onClick={clearFilters} className="text-xs text-red-400 underline">
              {t('events.clear')}
            </button>
          </div>
        )}

        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const config = typeConfig[event.type] || typeConfig.other
              const Icon = config.icon
              
              return (
                <div 
                  key={event.id}
                  className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5"
                >
                  <div className={`h-32 ${config.color} relative`}>
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    {event.is_featured && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t('events.featured')}
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 ${config.color} rounded-full text-xs font-medium flex items-center gap-1`}>
                      <Icon className="w-3 h-3" /> {config.label}
                    </div>
                    {event.price !== undefined && event.price > 0 && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur rounded-full text-xs font-bold">
                        {event.price} ₺
                      </div>
                    )}
                    {event.price === 0 && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-green-500 rounded-full text-xs font-bold">
                        {t('events.free')}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>
                    
                    {/* Features */}
                    {event.features && event.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.features.map(f => {
                          const feature = featureOptions.find(fo => fo.id === f)
                          return feature ? (
                            <span key={f} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300">
                              {feature.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        {formatDate(event.start_date)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="w-4 h-4 text-orange-500" />
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          {event.venue.name} • {event.venue.neighborhood || event.venue.district}
                        </div>
                      )}
                      {event.available_spots !== undefined && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Users className="w-4 h-4 text-orange-500" />
                          {t('events.spotsAvailable', { count: event.available_spots })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('events.noEvents')}</h3>
            <p className="text-gray-400 mb-4">{t('events.noEventsDesc')}</p>
            <button type="button" 
              onClick={clearFilters}
              className="px-4 py-2 bg-orange-500 rounded-xl text-sm font-medium"
            >
              {t('events.clearFilters')}
            </button>
          </div>
        )}
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="bg-[#1a1a1a] w-full max-h-[85vh] rounded-t-3xl flex flex-col">
            {/* Modal Header */}
            <div className="shrink-0 bg-[#1a1a1a] border-b border-white/10 px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('events.allFilters')}</h2>
              <button type="button" onClick={() => setShowFilterModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
              
              {/* Date */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  {t('events.dateTitle')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dateRanges.map(range => (
                    <button type="button"
                      key={range.id}
                      onClick={() => toggleFilter('dateRange', range.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                        filters.dateRange === range.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#242424] text-gray-300'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Type */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  {t('events.typeTitle')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <button type="button"
                      key={key}
                      onClick={() => toggleFilter('types', key)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                        filters.types.includes(key)
                          ? `${config.color} text-white`
                          : 'bg-[#242424] text-gray-300'
                      }`}
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Music Genre */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-orange-500" />
                  {t('events.musicTitle')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {musicGenres.map(genre => (
                    <button type="button"
                      key={genre.id}
                      onClick={() => toggleFilter('musicGenres', genre.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                        filters.musicGenres.includes(genre.id)
                          ? 'bg-purple-500 text-white'
                          : 'bg-[#242424] text-gray-300'
                      }`}
                    >
                      <genre.icon className="w-4 h-4" />
                      {genre.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  {t('events.priceTitle')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map(range => (
                    <button type="button"
                      key={range.id}
                      onClick={() => toggleFilter('priceRange', range.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                        filters.priceRange === range.id
                          ? 'bg-green-500 text-white'
                          : 'bg-[#242424] text-gray-300'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-orange-500" />
                  {t('events.featureTitle')}
                </h3>
                <div className="space-y-2">
                  {featureOptions.map(feature => (
                    <button type="button"
                      key={feature.id}
                      onClick={() => toggleFilter('features', feature.id)}
                      className={`w-full px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${
                        filters.features.includes(feature.id)
                          ? 'bg-orange-500/20 border border-orange-500'
                          : 'bg-[#242424] text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <feature.icon className="w-5 h-5" />
                        {feature.label}
                      </span>
                      {filters.features.includes(feature.id) && (
                        <Check className="w-5 h-5 text-orange-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 bg-[#1a1a1a] border-t border-white/10 p-4 flex gap-3 safe-area-bottom">
              <button type="button"
                onClick={clearFilters}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium"
              >
                {t('events.clear')}
              </button>
              <button type="button"
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium"
              >
                {t('events.showResults', { count: filteredEvents.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}