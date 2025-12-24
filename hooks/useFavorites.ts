'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Favorite {
  id: string
  user_id: string
  venue_id: string
  venue_name: string
  venue_image?: string
  venue_address?: string
  venue_rating?: number
  venue_price_level?: number
  venue_type?: string
  created_at: string
}

export interface VenueData {
  venue_id: string
  venue_name: string
  venue_image?: string
  venue_address?: string
  venue_rating?: number
  venue_price_level?: number
  venue_type?: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadFavorites()
      migrateFromLocalStorage()
    } else {
      // Giriş yapılmamışsa localStorage'dan yükle
      loadFromLocalStorage()
    }
  }, [currentUser])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    setLoading(false)
  }

  const loadFavorites = async () => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (data) {
      setFavorites(data)
    }
    setLoading(false)
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('order-favorites')
      if (saved) {
        const parsed = JSON.parse(saved)
        // localStorage formatını Favorite formatına çevir
        const converted: Favorite[] = parsed.map((item: any) => ({
          id: item.id || item.venue_id,
          user_id: 'local',
          venue_id: item.venue_id || item.id,
          venue_name: item.venue_name || item.name,
          venue_image: item.venue_image || item.image,
          venue_address: item.venue_address || item.address,
          venue_rating: item.venue_rating || item.rating,
          venue_price_level: item.venue_price_level || item.priceLevel,
          venue_type: item.venue_type || item.type,
          created_at: item.created_at || new Date().toISOString()
        }))
        setFavorites(converted)
      }
    } catch (e) {
      console.error('LocalStorage load error:', e)
    }
    setLoading(false)
  }

  // LocalStorage'dan Supabase'e migration
  const migrateFromLocalStorage = async () => {
    if (!currentUser) return

    try {
      const saved = localStorage.getItem('order-favorites')
      if (!saved) return

      const localFavorites = JSON.parse(saved)
      if (!localFavorites.length) return

      // Her favoriyi Supabase'e ekle
      for (const item of localFavorites) {
        const venueData: VenueData = {
          venue_id: item.venue_id || item.id,
          venue_name: item.venue_name || item.name,
          venue_image: item.venue_image || item.image,
          venue_address: item.venue_address || item.address,
          venue_rating: item.venue_rating || item.rating,
          venue_price_level: item.venue_price_level || item.priceLevel,
          venue_type: item.venue_type || item.type
        }

        await supabase
          .from('favorites')
          .upsert({
            user_id: currentUser.id,
            ...venueData
          }, { onConflict: 'user_id,venue_id' })
      }

      // Migration sonrası localStorage'ı temizle
      localStorage.removeItem('order-favorites')
      
      // Güncel listeyi yükle
      loadFavorites()
    } catch (e) {
      console.error('Migration error:', e)
    }
  }

  const addFavorite = useCallback(async (venue: VenueData) => {
    // Supabase'e ekle
    if (currentUser) {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: currentUser.id,
          ...venue
        })
        .select()
        .single()

      if (data) {
        setFavorites(prev => [data, ...prev])
      }
      return !error
    } else {
      // Giriş yapılmamışsa localStorage'a kaydet
      const newFavorite: Favorite = {
        id: venue.venue_id,
        user_id: 'local',
        ...venue,
        created_at: new Date().toISOString()
      }
      setFavorites(prev => [newFavorite, ...prev])
      saveToLocalStorage([newFavorite, ...favorites])
      return true
    }
  }, [currentUser, favorites])

  const removeFavorite = useCallback(async (venueId: string) => {
    if (currentUser) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('venue_id', venueId)

      if (!error) {
        setFavorites(prev => prev.filter(f => f.venue_id !== venueId))
      }
      return !error
    } else {
      const updated = favorites.filter(f => f.venue_id !== venueId)
      setFavorites(updated)
      saveToLocalStorage(updated)
      return true
    }
  }, [currentUser, favorites])

  const toggleFavorite = useCallback(async (venue: VenueData) => {
    const isFav = favorites.some(f => f.venue_id === venue.venue_id)
    if (isFav) {
      return removeFavorite(venue.venue_id)
    } else {
      return addFavorite(venue)
    }
  }, [favorites, addFavorite, removeFavorite])

  const isFavorite = useCallback((venueId: string) => {
    return favorites.some(f => f.venue_id === venueId)
  }, [favorites])

  const saveToLocalStorage = (data: Favorite[]) => {
    try {
      localStorage.setItem('order-favorites', JSON.stringify(data))
    } catch (e) {
      console.error('LocalStorage save error:', e)
    }
  }

  return {
    favorites,
    loading,
    isLoggedIn: !!currentUser,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refresh: loadFavorites
  }
}
