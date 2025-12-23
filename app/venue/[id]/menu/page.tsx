'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Search, Loader2, Plus, Minus, X, QrCode, Flame, Heart, TrendingUp, Star } from 'lucide-react'

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
  is_popular: boolean
  order_count?: number
}

interface CartItem {
  product: Product
  quantity: number
}

export default function VenueMenuPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const venueId = params.id as string

  const [mounted, setMounted] = useState(false)
  const [venue, setVenue] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  const tableId = searchParams.get('table')
  const canOrder = searchParams.get('order') === 'true' || tableId !== null

  useEffect(() => {
    setMounted(true)
    loadVenueData()
  }, [venueId])

  const loadVenueData = async () => {
    setLoading(true)
    try {
      // 1. Mekan bilgisi
      const { data: venueData } = await supabase
        .from('venues')
        .select('id, name, logo_url, emoji')
        .eq('id', venueId)
        .single()
      
      if (venueData) setVenue(venueData)

      // 2. Kategoriler
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('id, name, sort_order')
        .eq('venue_id', venueId)
        .order('sort_order')

      // 3. Ürünler
      const { data: productsData } = await supabase
        .from('menu_items')
        .select('id, name, description, price, image_url, category_id, is_available, is_popular')
        .eq('venue_id', venueId)
        .eq('is_available', true)

      // 4. Son 7 günün siparişlerinden popülerlik hesapla
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('items')
        .eq('venue_id', venueId)
        .gte('created_at', weekAgo.toISOString())
        .in('status', ['completed', 'served', 'ready', 'preparing', 'confirmed'])

      // Ürün bazında sipariş sayısını hesapla
      const itemCounts: Record<string, number> = {}
      ordersData?.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const itemName = item.name || item.product_name
            if (itemName) {
              itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1)
            }
          })
        }
      })

      // Ürünlere sipariş sayısı ekle
      const productsWithCounts = productsData?.map(product => ({
        ...product,
        order_count: itemCounts[product.name] || 0
      })) || []

      // Popüler ürünler: is_popular=true VEYA son 7 günde 5+ sipariş
      const popular = productsWithCounts
        .filter(p => p.is_popular || (p.order_count && p.order_count >= 5))
        .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
        .slice(0, 6)

      setCategories(categoriesData || [])
      setProducts(productsWithCounts)
      setPopularProducts(popular)

    } catch (error) {
      console.error('Menü yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOrderModeLabel = () => {
    if (tableId) return `Masa ${tableId}`
    if (canOrder) return 'Paket Sipariş'
    return null
  }

  const addToCart = (product: Product) => {
    if (!canOrder) return
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId)
      if (existing && existing.quantity > 1) {
        return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item)
      }
      return prev.filter(item => item.product.id !== productId)
    })
  }

  const getCartQuantity = (productId: string) => cart.find(item => item.product.id === productId)?.quantity || 0
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filtreleme
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || selectedCategory === 'popular' || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Kategoriye göre grupla
  const productsByCategory = categories.map(cat => ({
    category: cat,
    products: filteredProducts.filter(p => p.category_id === cat.id)
  })).filter(group => group.products.length > 0)

  // Product Card Component
  const ProductCard = ({ product, showStats = false }: { product: Product, showStats?: boolean }) => {
    const quantity = getCartQuantity(product.id)
    const isPopular = product.is_popular || (product.order_count && product.order_count >= 5)
    
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🍽️</span>
          )}
          {isPopular && showStats && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <Flame className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>
          )}
          
          {/* Stats for popular items */}
          {showStats && product.order_count !== undefined && product.order_count > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" /> {product.order_count} sipariş
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-orange-500">₺{product.price}</span>
            
            {canOrder && (
              quantity > 0 ? (
                <div className="flex items-center gap-2 bg-orange-500 rounded-full px-2 py-1">
                  <button onClick={() => removeFromCart(product.id)} className="p-1">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                  <button onClick={() => addToCart(product)} className="p-1">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => addToCart(product)} className="p-2 bg-orange-500 rounded-full">
                  <Plus className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{venue?.name || 'Menü'}</h1>
            <p className="text-sm text-gray-400">
              {products.length} ürün
              {getOrderModeLabel() && (
                <span className="text-orange-500"> • {getOrderModeLabel()}</span>
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Menüde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
            >
              Tümü
            </button>
            {popularProducts.length > 0 && (
              <button
                onClick={() => setSelectedCategory('popular')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'popular' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                    : 'bg-[#1a1a1a] text-gray-400'
                }`}
              >
                🔥 Popüler
              </button>
            )}
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner when can't order */}
      {!canOrder && (
        <div className="mx-4 mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8 text-blue-400" />
            <div>
              <p className="font-medium text-blue-300">Sadece Menü Görüntüleme</p>
              <p className="text-sm text-blue-400">Sipariş vermek için masadaki QR kodu okutun veya Paket seçeneğini kullanın</p>
            </div>
          </div>
        </div>
      )}

      {/* BU MEKANDA POPÜLER - Sadece "Tümü" seçiliyken göster */}
      {!selectedCategory && popularProducts.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bu Mekanda Popüler</h2>
              <p className="text-xs text-gray-400">En çok sipariş edilen ürünler</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {popularProducts.map((product, index) => (
              <div key={product.id} className="relative">
                {index < 3 && (
                  <div className={`absolute -top-1 -left-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                  }`}>
                    {index + 1}
                  </div>
                )}
                <ProductCard product={product} showStats={true} />
              </div>
            ))}
          </div>
          
          <div className="h-px bg-white/10 my-6" />
        </div>
      )}

      {/* Popüler kategorisi seçiliyse */}
      {selectedCategory === 'popular' && (
        <div className="p-4 space-y-3">
          {popularProducts.map((product, index) => (
            <div key={product.id} className="relative">
              {index < 3 && (
                <div className={`absolute -top-1 -left-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                }`}>
                  {index + 1}
                </div>
              )}
              <ProductCard product={product} showStats={true} />
            </div>
          ))}
        </div>
      )}

      {/* Products by Category */}
      {selectedCategory !== 'popular' && (
        <div className="p-4 space-y-6">
          {productsByCategory.map(({ category, products: catProducts }) => (
            <div key={category.id}>
              <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
              <div className="space-y-3">
                {catProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}

          {productsByCategory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ürün bulunamadı</p>
            </div>
          )}
        </div>
      )}

      {/* Cart Button */}
      {canOrder && cartItemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-4 bg-orange-500 rounded-2xl font-bold flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold">{cartItemCount}</span>
              </div>
              <span>Sepeti Görüntüle</span>
            </div>
            <span>₺{cartTotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/90 z-[100]">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
              <h2 className="text-lg font-bold">Sepetim ({cartItemCount})</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0a]">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 bg-[#1a1a1a] p-3 rounded-xl">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center overflow-hidden">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-orange-500 font-bold">₺{(item.product.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-2 py-1">
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1"><Minus className="w-4 h-4" /></button>
                    <span className="font-bold min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)} className="p-1"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#1a1a1a]">
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Toplam</span>
                <span className="text-xl font-bold">₺{cartTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={async () => {
                  // Siparişi Supabase'e kaydet
                  const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
                  
                  const { data, error } = await supabase
                    .from('orders')
                    .insert({
                      venue_id: venueId,
                      order_number: orderNumber,
                      table_number: tableId || null,
                      type: tableId ? 'dine_in' : 'takeaway',
                      status: 'pending',
                      subtotal: cartTotal,
                      total: cartTotal,
                      items: cart.map(item => ({
                        product_id: item.product.id,
                        name: item.product.name,
                        quantity: item.quantity,
                        price: item.product.price,
                        total: item.product.price * item.quantity
                      }))
                    })
                    .select()
                    .single()

                  if (error) {
                    console.error('Sipariş hatası:', error)
                    alert('Sipariş gönderilemedi!')
                    return
                  }

                  setCart([])
                  setShowCart(false)
                  router.push('/orders')
                }}
                className="w-full py-4 bg-orange-500 rounded-2xl font-bold"
              >
                Siparişi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
