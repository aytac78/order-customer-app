'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Bell, Calendar, CreditCard, Star, Gift, X, CalendarPlus, MessageSquare, Coffee } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
}

const iconMap: Record<string, any> = {
  reservation_confirmed: Calendar,
  reservation: Calendar,
  payment: CreditCard,
  review: Star,
  promo: Gift,
  message: MessageSquare,
  waiter_call: Coffee,
  default: Bell
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Notification | null>(null)

  useEffect(() => {
    loadNotifications()
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => loadNotifications()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const loadNotifications = async () => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (user) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query
    if (!error && data) setNotifications(data)
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleClick = (item: Notification) => {
    markAsRead(item.id)
    setSelectedItem(item)
  }

  const addToCalendar = (item: Notification) => {
    if (!item.data) return
    const { venue_name, date, time, guests } = item.data
    const startDate = new Date(`${date}T${time}`)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'
    
    const event = {
      title: `${t.notifications.reservation} - ${venue_name}`,
      description: `${guests} ${t.reservations.person}`,
      start: formatDate(startDate),
      end: formatDate(endDate),
      location: venue_name
    }
    
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${event.start}\nDTEND:${event.end}\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nEND:VEVENT\nEND:VCALENDAR`
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'reservation.ics'
      link.click()
      URL.revokeObjectURL(url)
    } else {
      window.open(googleUrl, '_blank')
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} ${t.notifications.minutesAgo || 'dk önce'}`
    if (hours < 24) return `${hours} ${t.notifications.hoursAgo || 'saat önce'}`
    return `${days} ${t.notifications.daysAgo || 'gün önce'}`
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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
          <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{t.notifications.title}</h1>
            {unreadCount > 0 && <p className="text-gray-400 text-sm">{unreadCount} {t.notifications.unread || 'okunmamış'}</p>}
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="text-orange-500 text-sm font-medium">
              {t.notifications.markAllRead}
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((item) => {
              const Icon = iconMap[item.type] || iconMap.default
              return (
                <div 
                  key={item.id} 
                  onClick={() => handleClick(item)}
                  className={`rounded-2xl p-4 border cursor-pointer active:scale-[0.98] transition-transform ${
                    !item.is_read ? 'bg-orange-500/10 border-orange-500/30' : 'bg-[#1a1a1a] border-white/5'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${!item.is_read ? 'bg-orange-500/20' : 'bg-[#242424]'}`}>
                      <Icon className={`w-6 h-6 ${!item.is_read ? 'text-orange-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        {!item.is_read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />}
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{item.message}</p>
                      <p className="text-gray-600 text-xs">{formatTime(item.created_at)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t.notifications.noNotifications}</h3>
            <p className="text-gray-400">{t.notifications.noNotificationsDesc}</p>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedItem.title}</h2>
              <button type="button" onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {selectedItem.data?.venue_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.common.venue}</span>
                  <span className="font-medium">{selectedItem.data.venue_name}</span>
                </div>
              )}
              {selectedItem.data?.date && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.reservations.date}</span>
                  <span className="font-medium">{selectedItem.data.date}</span>
                </div>
              )}
              {selectedItem.data?.time && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.reservations.time}</span>
                  <span className="font-medium">{selectedItem.data.time}</span>
                </div>
              )}
              {selectedItem.data?.guests && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t.reservations.guests}</span>
                  <span className="font-medium">{selectedItem.data.guests} {t.reservations.person}</span>
                </div>
              )}
              <p className="text-gray-500 text-sm pt-2 border-t border-white/5">{formatTime(selectedItem.created_at)}</p>
            </div>
            <div className="p-4 border-t border-white/5 space-y-2">
              {(selectedItem.type === 'reservation_confirmed' || selectedItem.type === 'reservation') && selectedItem.data && (
                <button type="button" onClick={() => addToCalendar(selectedItem)} className="w-full py-3 bg-green-600 rounded-xl font-medium flex items-center justify-center gap-2">
                  <CalendarPlus className="w-5 h-5" />
                  {t.notifications.addToCalendar || 'Takvime Ekle'}
                </button>
              )}
              <button type="button" onClick={() => setSelectedItem(null)} className="w-full py-3 bg-orange-500 rounded-xl font-medium">
                {t.common.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}