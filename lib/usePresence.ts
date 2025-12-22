'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import { useLocation } from './LocationContext'

export interface NearbyUser {
  user_id: string
  latitude: number
  longitude: number
  distance_km: number
  venue_id: string | null
  status: string
  last_seen: string
  profile?: {
    display_name: string
    avatar_url?: string
    bio?: string
  }
}

export interface VenueCheckin {
  id: string
  user_id: string
  venue_id: string
  checked_in_at: string
  profile?: {
    display_name: string
    avatar_url?: string
    bio?: string
  }
}

export interface PresenceSettings {
  is_discoverable: boolean
  show_in_venue: boolean
  show_nearby: boolean
}

export function usePresence() {
  const { user } = useAuth()
  const { location } = useLocation()
  
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [venueUsers, setVenueUsers] = useState<VenueCheckin[]>([])
  const [currentVenueId, setCurrentVenueId] = useState<string | null>(null)
  const [settings, setSettings] = useState<PresenceSettings>({
    is_discoverable: false,
    show_in_venue: true,
    show_nearby: false
  })
  const [loading, setLoading] = useState(false)

  // Kullanıcı ayarlarını yükle
  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  // Konum değiştiğinde presence güncelle
  useEffect(() => {
    if (user && location && settings.is_discoverable) {
      updatePresence()
    }
  }, [location, settings.is_discoverable])

  // Periyodik güncelleme (her 30 saniye)
  useEffect(() => {
    if (!user || !settings.is_discoverable) return

    const interval = setInterval(() => {
      if (location) updatePresence()
    }, 30000)

    return () => clearInterval(interval)
  }, [user, location, settings.is_discoverable])

  const loadSettings = async () => {
    if (!user) return

    const { data } = await supabase
      .from('customer_profiles')
      .select('is_discoverable, show_in_venue, show_nearby')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setSettings({
        is_discoverable: data.is_discoverable ?? false,
        show_in_venue: data.show_in_venue ?? true,
        show_nearby: data.show_nearby ?? false
      })
    }
  }

  const updateSettings = async (newSettings: Partial<PresenceSettings>) => {
    if (!user) return

    const updated = { ...settings, ...newSettings }
    setSettings(updated)

    await supabase
      .from('customer_profiles')
      .update(newSettings)
      .eq('user_id', user.id)

    // Eğer discoverable kapatıldıysa presence'ı sil
    if (newSettings.is_discoverable === false) {
      await supabase
        .from('user_presence')
        .delete()
        .eq('user_id', user.id)
    }
  }

  const updatePresence = async () => {
    if (!user || !location) return

    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        venue_id: currentVenueId,
        is_visible: settings.is_discoverable,
        status: 'available',
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) console.error('Presence update error:', error)
  }

  const fetchNearbyUsers = async (radiusKm: number = 1) => {
    if (!location) return

    setLoading(true)
    
    const { data, error } = await supabase
      .rpc('get_nearby_users', {
        p_lat: location.latitude,
        p_lon: location.longitude,
        p_radius_km: radiusKm
      })

    if (data && !error) {
      // Profil bilgilerini çek
      const userIds = data.map((u: any) => u.user_id).filter((id: string) => id !== user?.id)
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('customer_profiles')
          .select('user_id, display_name, avatar_url, bio')
          .in('user_id', userIds)

        const profileMap: Record<string, any> = {}
        profiles?.forEach(p => { profileMap[p.user_id] = p })

        const enriched = data
          .filter((u: any) => u.user_id !== user?.id)
          .map((u: any) => ({
            ...u,
            profile: profileMap[u.user_id]
          }))

        setNearbyUsers(enriched)
      } else {
        setNearbyUsers([])
      }
    }
    
    setLoading(false)
  }

  const fetchVenueUsers = async (venueId: string) => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('venue_checkins')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .neq('user_id', user?.id || '')

    if (data && !error) {
      const userIds = data.map(c => c.user_id)
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('customer_profiles')
          .select('user_id, display_name, avatar_url, bio')
          .in('user_id', userIds)

        const profileMap: Record<string, any> = {}
        profiles?.forEach(p => { profileMap[p.user_id] = p })

        const enriched = data.map(c => ({
          ...c,
          profile: profileMap[c.user_id]
        }))

        setVenueUsers(enriched)
      } else {
        setVenueUsers([])
      }
    }
    
    setLoading(false)
  }

  const checkInToVenue = async (venueId: string, source: 'manual' | 'qr_scan' | 'reservation' = 'manual') => {
    if (!user) return false

    // Önce mevcut aktif check-in'i kapat
    await supabase
      .from('venue_checkins')
      .update({ is_active: false, checked_out_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Yeni check-in oluştur
    const { error } = await supabase
      .from('venue_checkins')
      .insert({
        user_id: user.id,
        venue_id: venueId,
        source,
        is_active: true
      })

    if (!error) {
      setCurrentVenueId(venueId)
      // Presence'ı da güncelle
      if (settings.is_discoverable) {
        await updatePresence()
      }
      return true
    }
    return false
  }

  const checkOut = async () => {
    if (!user) return

    await supabase
      .from('venue_checkins')
      .update({ is_active: false, checked_out_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    setCurrentVenueId(null)
    setVenueUsers([])
  }

  const getCurrentCheckin = async () => {
    if (!user) return null

    const { data } = await supabase
      .from('venue_checkins')
      .select('*, venue:venues(name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (data) {
      setCurrentVenueId(data.venue_id)
    }
    return data
  }

  return {
    // State
    nearbyUsers,
    venueUsers,
    currentVenueId,
    settings,
    loading,
    
    // Actions
    updateSettings,
    fetchNearbyUsers,
    fetchVenueUsers,
    checkInToVenue,
    checkOut,
    getCurrentCheckin,
    updatePresence
  }
}
