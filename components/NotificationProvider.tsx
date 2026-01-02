'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Bell, X, Check, Calendar, MessageSquare, Coffee, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Notification {
  id: string
  type: 'reservation' | 'message' | 'waiter_call' | 'order' | 'info'
  title: string
  message: string
  createdAt: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider')
  return ctx
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      read: false
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, 50))
    
    // Play sound if available
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {})
      } catch {}
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  useEffect(() => {
    if (!user) return

    // Listen for new messages
    const messagesChannel = supabase.channel('user-messages-notif')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `customer_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.sender_type !== 'customer') {
          addNotification({
            type: 'message',
            title: t.notifications.newMessage,
            message: payload.new.content?.substring(0, 50) || t.notifications.newMessageDesc
          })
        }
      })
      .subscribe()

    // Listen for reservation updates
    const reservationsChannel = supabase.channel('user-reservations-notif')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'reservations',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const status = payload.new.status
        if (status === 'confirmed') {
          addNotification({
            type: 'reservation',
            title: t.notifications.reservationUpdate,
            message: t.reservations.confirmed
          })
        } else if (status === 'cancelled') {
          addNotification({
            type: 'reservation',
            title: t.notifications.reservationUpdate,
            message: t.reservations.cancelled
          })
        }
      })
      .subscribe()

    // Listen for order updates
    const ordersChannel = supabase.channel('user-orders-notif')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const status = payload.new.status
        if (status === 'ready') {
          addNotification({
            type: 'order',
            title: t.notifications.orderUpdate,
            message: t.orders.statusReady
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(reservationsChannel)
      supabase.removeChannel(ordersChannel)
    }
  }, [user, t])

  const getIcon = (type: string) => {
    switch (type) {
      case 'reservation': return Calendar
      case 'message': return MessageSquare
      case 'waiter_call': return Coffee
      case 'order': return ShoppingBag
      default: return Bell
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t.notifications.justNow || 'Az önce'
    if (minutes < 60) return `${minutes} ${t.notifications.minutesAgo || 'dk önce'}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${t.notifications.hoursAgo || 'saat önce'}`
    return date.toLocaleDateString()
  }
  const getColor = (type: string) => {
    switch (type) {
      case 'reservation': return 'bg-blue-500/20 text-blue-500'
      case 'message': return 'bg-green-500/20 text-green-500'
      case 'waiter_call': return 'bg-amber-500/20 text-amber-500'
      case 'order': return 'bg-purple-500/20 text-purple-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
      

      {/* Notification Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowPanel(false)}>
          <div 
            className="absolute top-0 right-0 w-full max-w-sm h-full bg-[#0a0a0a] border-l border-white/10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{t.notifications.title}</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="text-xs text-orange-500">
                    {t.notifications.markAllRead}
                  </button>
                )}
                <button type="button" onClick={() => setShowPanel(false)} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto h-full pb-20">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">{t.notifications.noNotifications}</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const Icon = getIcon(notif.type)
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-white/5 flex gap-3 cursor-pointer ${notif.read ? 'opacity-60' : 'bg-white/5'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(notif.type)}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{notif.title}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{notif.message}</p>
                        <p className="text-gray-600 text-xs mt-1">{formatTime(notif.createdAt)}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}