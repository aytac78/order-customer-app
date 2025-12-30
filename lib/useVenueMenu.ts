import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
}

export interface MenuCategory {
  id: string
  name: string
  description?: string
  items: MenuItem[]
}

export interface VenueWithMenu {
  id: string
  name: string
  slug: string
  description?: string
  category?: string
  address?: string
  district?: string
  city?: string
  phone?: string
  instagram?: string
  rating?: number
  reviewCount?: number
  workingHours?: { open: string; close: string }
  menu: MenuCategory[]
}

export function useVenueMenu(slug: string) {
  const [venue, setVenue] = useState<VenueWithMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVenueMenu() {
      if (!slug) {
        setLoading(false)
        return
      }

      try {
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('*')
          .eq('slug', slug)
          .single()

        if (venueError) throw venueError

        const { data: categories, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('venue_id', venueData.id)
          .eq('is_active', true)
          .order('display_order')

        if (catError) throw catError

        const { data: items, error: itemError } = await supabase
          .from('products')
          .select('*')
          .eq('venue_id', venueData.id)
          .eq('is_available', true)

        if (itemError) throw itemError

        const menuCategories: MenuCategory[] = (categories || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          items: (items || [])
            .filter(item => item.category_id === cat.id)
            .map(item => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: Number(item.price),
              image_url: item.image_url,
              is_available: item.is_available
            }))
        }))

        setVenue({
          id: venueData.id,
          name: venueData.name,
          slug: venueData.slug,
          description: venueData.description,
          category: venueData.category,
          address: venueData.address,
          district: venueData.district,
          city: venueData.city,
          phone: venueData.phone,
          instagram: venueData.instagram,
          rating: venueData.rating,
          reviewCount: venueData.review_count,
          workingHours: venueData.working_hours,
          menu: menuCategories
        })
      } catch (err: any) {
        console.error('Venue fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVenueMenu()
  }, [slug])

  return { venue, loading, error }
}
