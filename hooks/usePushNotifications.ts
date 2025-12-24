'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getFCMToken, onForegroundMessage } from '@/lib/firebase'

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  image?: string
  data?: Record<string, any>
  timestamp: Date
  read: boolean
}

export interface NotificationPreferences {
  orders: boolean
  reservations: boolean
  promotions: boolean
  messages: boolean
  waiter_calls: boolean
  here_matches: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  orders: true,
  reservations: true,
  promotions: true,
  messages: true,
  waiter_calls: true,
  here_matches: true,
}

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    loadPreferences()
    loadNotifications()
    setLoading(false)
  }, [])

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const notification: PushNotification = {
        id: `notif-${Date.now()}`,
        title: payload.notification?.title || 'ORDER',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        data: payload.data,
        timestamp: new Date(),
        read: false,
      }
      
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)

      // Show browser notification if app is in foreground
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          data: notification.data,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const loadPreferences = async () => {
    // Try to load from Supabase
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPreferences({
          orders: data.orders ?? true,
          reservations: data.reservations ?? true,
          promotions: data.promotions ?? true,
          messages: data.messages ?? true,
          waiter_calls: data.waiter_calls ?? true,
          here_matches: data.here_matches ?? true,
        })
        return
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('notification_preferences')
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
  }

  const loadNotifications = async () => {
    // Load recent notifications from localStorage cache
    const saved = localStorage.getItem('push_notifications')
    if (saved) {
      const parsed = JSON.parse(saved)
      setNotifications(parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      })))
      setUnreadCount(parsed.filter((n: any) => !n.read).length)
    }
  }

  const saveNotifications = (notifs: PushNotification[]) => {
    localStorage.setItem('push_notifications', JSON.stringify(notifs.slice(0, 50)))
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)

    if (result === 'granted') {
      const fcmToken = await getFCMToken()
      if (fcmToken) {
        setToken(fcmToken)
        await saveTokenToServer(fcmToken)
        return true
      }
    }

    return false
  }

  const saveTokenToServer = async (fcmToken: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Save token to Supabase
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: fcmToken,
          platform: detectPlatform(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token'
        })
    } else {
      // Save to localStorage for anonymous users
      localStorage.setItem('fcm_token', fcmToken)
    }
  }

  const detectPlatform = (): string => {
    if (typeof window === 'undefined') return 'unknown'
    
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
    if (/Android/.test(ua)) return 'android'
    return 'web'
  }

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updated,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
    }

    localStorage.setItem('notification_preferences', JSON.stringify(updated))
  }

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      saveNotifications(updated)
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      saveNotifications(updated)
      return updated
    })
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
    localStorage.removeItem('push_notifications')
  }, [])

  const addLocalNotification = useCallback((notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: PushNotification = {
      ...notification,
      id: `local-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    }
    
    setNotifications(prev => {
      const updated = [newNotif, ...prev]
      saveNotifications(updated)
      return updated
    })
    setUnreadCount(prev => prev + 1)
  }, [])

  return {
    token,
    permission,
    loading,
    notifications,
    preferences,
    unreadCount,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    isEnabled: permission === 'granted',
    requestPermission,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addLocalNotification,
  }
}
