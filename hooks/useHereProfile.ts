'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface HereProfile {
  id: string
  user_id: string
  nickname: string
  bio?: string
  avatar_url?: string
  avatar_blur: boolean
  orientation: string
  looking_for: string
  age_range_min: number
  age_range_max: number
  gender: string
  birth_date?: string
  is_visible: boolean
  invisible_mode: boolean
  last_active_at?: string
  created_at: string
  updated_at: string
}

export interface HereCheckin {
  id: string
  user_id: string
  profile_id: string
  venue_id: string
  venue_name?: string
  order_id?: string
  checked_in_at: string
  checked_out_at?: string
  auto_checkout_at?: string
  is_active: boolean
  invisible: boolean
}

export interface CreateProfileData {
  nickname: string
  bio?: string
  avatar_url?: string
  avatar_blur?: boolean
  orientation?: string
  looking_for?: string
  age_range_min?: number
  age_range_max?: number
  gender: string
  birth_date?: string
}

export function useHereProfile() {
  const [profile, setProfile] = useState<HereProfile | null>(null)
  const [checkin, setCheckin] = useState<HereCheckin | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadProfile()
      loadActiveCheckin()
    }
  }, [currentUser])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    if (!user) setLoading(false)
  }

  const loadProfile = async () => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('here_profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (data) {
      setProfile(data)
    }
    setLoading(false)
  }

  const loadActiveCheckin = async () => {
    if (!currentUser) return

    const { data } = await supabase
      .from('here_checkins')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .single()

    if (data) {
      setCheckin(data)
    }
  }

  const createProfile = async (profileData: CreateProfileData): Promise<boolean> => {
    if (!currentUser) return false

    const { data, error } = await supabase
      .from('here_profiles')
      .insert({
        user_id: currentUser.id,
        ...profileData,
        avatar_blur: profileData.avatar_blur ?? true,
        orientation: profileData.orientation || 'prefer_not_say',
        looking_for: profileData.looking_for || 'everyone',
        age_range_min: profileData.age_range_min || 18,
        age_range_max: profileData.age_range_max || 99,
        is_visible: true,
        invisible_mode: false
      })
      .select()
      .single()

    if (data) {
      setProfile(data)
      return true
    }
    console.error('Create profile error:', error)
    return false
  }

  const updateProfile = async (updates: Partial<CreateProfileData>): Promise<boolean> => {
    if (!currentUser || !profile) return false

    const { data, error } = await supabase
      .from('here_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single()

    if (data) {
      setProfile(data)
      return true
    }
    return false
  }

  const deleteProfile = async (): Promise<boolean> => {
    if (!currentUser || !profile) return false

    const { error } = await supabase
      .from('here_profiles')
      .delete()
      .eq('id', profile.id)

    if (!error) {
      setProfile(null)
      return true
    }
    return false
  }

  const checkIn = async (venueId: string, venueName: string, orderId?: string): Promise<boolean> => {
    if (!currentUser || !profile) return false

    // Önce aktif check-in varsa kapat
    if (checkin) {
      await checkOut()
    }

    const { data, error } = await supabase
      .from('here_checkins')
      .insert({
        user_id: currentUser.id,
        profile_id: profile.id,
        venue_id: venueId,
        venue_name: venueName,
        order_id: orderId || null,
        is_active: true,
        invisible: profile.invisible_mode
      })
      .select()
      .single()

    if (data) {
      setCheckin(data)
      // Update last_active_at
      await supabase
        .from('here_profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', profile.id)
      return true
    }
    return false
  }

  const checkOut = async (): Promise<boolean> => {
    if (!checkin) return false

    const { error } = await supabase
      .from('here_checkins')
      .update({
        is_active: false,
        checked_out_at: new Date().toISOString()
      })
      .eq('id', checkin.id)

    if (!error) {
      setCheckin(null)
      return true
    }
    return false
  }

  const setInvisibleMode = async (invisible: boolean): Promise<boolean> => {
    if (!profile) return false

    const success = await updateProfile({ } as any)
    
    const { error } = await supabase
      .from('here_profiles')
      .update({ invisible_mode: invisible })
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, invisible_mode: invisible } : null)
      
      // Aktif check-in varsa onu da güncelle
      if (checkin) {
        await supabase
          .from('here_checkins')
          .update({ invisible })
          .eq('id', checkin.id)
      }
      return true
    }
    return false
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!currentUser) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
    const filePath = `${currentUser.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('here-avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('here-avatars')
      .getPublicUrl(filePath)

    return publicUrl
  }

  return {
    profile,
    checkin,
    loading,
    isLoggedIn: !!currentUser,
    hasProfile: !!profile,
    isCheckedIn: !!checkin,
    createProfile,
    updateProfile,
    deleteProfile,
    checkIn,
    checkOut,
    setInvisibleMode,
    uploadAvatar,
    refresh: loadProfile
  }
}

// Venue'daki diğer kullanıcıları getir
export function useHereUsers(venueId: string | null) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (venueId) {
      loadUsers()
      subscribeToUsers()
    }
  }, [venueId])

  const loadUsers = async () => {
    if (!venueId) return

    const { data } = await supabase
      .from('here_checkins')
      .select(`
        *,
        profile:here_profiles(*)
      `)
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .eq('invisible', false)

    if (data) {
      setUsers(data.map(c => ({
        ...c.profile,
        checkin_id: c.id,
        checked_in_at: c.checked_in_at
      })))
    }
    setLoading(false)
  }

  const subscribeToUsers = () => {
    if (!venueId) return

    const channel = supabase
      .channel(`here-venue-${venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'here_checkins',
          filter: `venue_id=eq.${venueId}`
        },
        () => {
          loadUsers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return { users, loading, refresh: loadUsers }
}
