'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Calendar, Clock, MapPin, Music, Utensils, PartyPopper, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  venue_id: string
  title: string
  description: string
  start_date: string
  start_time: string
  end_time: string
  type: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  venue?: {
    name: string
    neighborhood: string
    district: string
  }
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  music: { icon: Music, label: 'Müzik', color: 'bg-purple-500' },
  food: { icon: Utensils, label: 'Yemek', color: 'bg-orange-500' },
  party: { icon: PartyPopper, label: 'Parti', color: 'bg-pink-500' },
  other: { icon: Star, label: 'Etkinlik', color: 'bg-blue-500' }
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadEvents()
  }, [])

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
    }
    setLoading(false)
  }

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long' 
    })
  }

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Etkinlikler</h1>
            <p className="text-gray-400 text-sm">{events.length} yaklaşan etkinlik</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-white/10'
            }`}
          >
            Tümü
          </button>
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  filter === key ? `${config.color} text-white` : 'bg-[#1a1a1a] text-gray-400 border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="px-4">
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
                        <Star className="w-3 h-3" /> Öne Çıkan
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 ${config.color} rounded-full text-xs font-medium flex items-center gap-1`}>
                      <Icon className="w-3 h-3" /> {config.label}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>
                    
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
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Etkinlik bulunamadı</h3>
            <p className="text-gray-400">
              {filter === 'all' ? 'Yaklaşan etkinlik bulunmuyor' : 'Bu kategoride etkinlik yok'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
