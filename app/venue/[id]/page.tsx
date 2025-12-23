'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, 
  Plus, Minus, ShoppingCart, Heart, Share2, 
  ChevronRight, Loader2, AlertCircle
} from 'lucide-react'

interface Venue {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  website?: string
  rating?: number
  category?: string
  image_url?: string
  logo_url?: string
  working_hours?: any
  is_active: boolean
}

interface Category {
  id: string
  name: string
  sort_order: number
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category_id: string
  is_available: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

export default function VenuePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (venueId) {
      loadVenue()
      loadMenu()
    }
  }, [venueId])

  const loadVenue = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()

    if (error) {
      setError('Mekan bulunamadı')
      setLoading(false)
      return
    }

    setVenue(data)
    setLoading(false)
  }

  const loadMenu = async () => {
    // Kategorileri yükle
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('venue_id', venueId)
      .order('sort_order')

    if (cats && cats.length > 0) {
      setCategories(cats)
      setSelectedCategory(cats[0].id)
    }

    // Ürünleri yükle
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_available', true)
      .order('sort_order')

    if (prods) {
      setProducts(prods)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId)
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      }
      return prev.filter(item => item.product.id !== productId)
    })
  }

  const getCartQuantity = (productId: string) => {
    const item = cart.find(i => i.product.id === productId)
    return item?.quantity || 0
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category_id === selectedCategory)
    : products

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Mekan Bulunamadı</h2>
        <p className="text-gray-400 mb-6">{error || 'Bu mekan mevcut değil'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-orange-500 rounded-xl font-semibold"
        >
          Geri Dön
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-br from-orange-500 to-red-500">
        {venue.image_url && (
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-full backdrop-blur-sm ${isFavorite ? 'bg-red-500' : 'bg-black/50'}`}
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
          <button className="p-2 bg-black/50 rounded-full backdrop-blur-sm">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Venue Info */}
      <div className="px-4 -mt-8 relative">
        <div className="bg-[#1a1a1a] rounded-2xl p-4">
          <div className="flex items-start gap-4">
            {venue.logo_url ? (
              <img src={venue.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-orange-500 flex items-center justify-center text-2xl font-bold">
                {venue.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold">{venue.name}</h1>
              {venue.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{venue.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                {venue.rating && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {venue.rating.toFixed(1)}
                  </span>
                )}
                {venue.address && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{venue.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4" />
                Ara
              </a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" className="flex items-center gap-2 text-sm text-gray-400">
                <Globe className="w-4 h-4" />
                Web
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-white/5 mt-4">
          <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#1a1a1a] text-gray-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="p-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">Bu kategoride ürün yok</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const quantity = getCartQuantity(product.id)
            
            return (
              <div key={product.id} className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex gap-4">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-[#252525] flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-orange-500 font-bold">₺{product.price}</span>
                      
                      {quantity > 0 ? (
                        <div className="flex items-center gap-3 bg-orange-500 rounded-full px-2 py-1">
                          <button onClick={() => removeFromCart(product.id)} className="p-1">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                          <button onClick={() => addToCart(product)} className="p-1">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 bg-orange-500 rounded-full text-sm font-medium"
                        >
                          Ekle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cart Footer */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
          <button
            onClick={() => router.push('/cart')}
            className="w-full py-4 bg-orange-500 rounded-2xl font-bold flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">
                {cartItemCount}
              </div>
              <span>Sepeti Gör</span>
            </div>
            <span>₺{cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  )
}
