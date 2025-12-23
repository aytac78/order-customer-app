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
  orderCount?: number
  likeCount?: number
  isPopular?: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

const demoCategories: Category[] = [
  { id: 'cat-0', name: '🔥 Popüler', sort_order: 0 },
  { id: 'cat-1', name: 'Başlangıçlar', sort_order: 1 },
  { id: 'cat-2', name: 'Ana Yemekler', sort_order: 2 },
  { id: 'cat-3', name: 'Pizzalar', sort_order: 3 },
  { id: 'cat-4', name: 'Deniz Ürünleri', sort_order: 4 },
  { id: 'cat-5', name: 'İçecekler', sort_order: 5 },
  { id: 'cat-6', name: 'Tatlılar', sort_order: 6 },
]

const demoProducts: Product[] = [
  // Popüler ürünler (en çok sipariş + beğeni)
  { id: 'p-12', name: 'Izgara Levrek', description: 'Taze levrek, limon, roka', price: 320, category_id: 'cat-4', is_available: true, orderCount: 89, likeCount: 156, isPopular: true },
  { id: 'p-7', name: 'Adana Kebap', description: 'Acılı dana kıyma, lavaş', price: 250, category_id: 'cat-2', is_available: true, orderCount: 76, likeCount: 134, isPopular: true },
  { id: 'p-19', name: 'Künefe', description: 'Sıcak künefe, kaymak, fıstık', price: 140, category_id: 'cat-6', is_available: true, orderCount: 68, likeCount: 112, isPopular: true },
  { id: 'p-9', name: 'Margherita', description: 'Domates sos, mozzarella, fesleğen', price: 165, category_id: 'cat-3', is_available: true, orderCount: 54, likeCount: 98, isPopular: true },
  
  // Normal ürünler
  { id: 'p-1', name: 'Mercimek Çorbası', description: 'Geleneksel tarif ile hazırlanan', price: 85, category_id: 'cat-1', is_available: true, orderCount: 32, likeCount: 45 },
  { id: 'p-2', name: 'Humus', description: 'Nohut püresi, tahin, zeytinyağı', price: 95, category_id: 'cat-1', is_available: true, orderCount: 28, likeCount: 38 },
  { id: 'p-3', name: 'Sigara Böreği', description: 'Peynirli el açması (4 adet)', price: 110, category_id: 'cat-1', is_available: true, orderCount: 41, likeCount: 52 },
  { id: 'p-4', name: 'Karışık Meze', description: 'Humus, haydari, patlıcan salatası', price: 180, category_id: 'cat-1', is_available: true, orderCount: 35, likeCount: 48 },
  { id: 'p-5', name: 'Izgara Köfte', description: 'Dana kıyma, pilav ve salata ile', price: 220, category_id: 'cat-2', is_available: true, orderCount: 45, likeCount: 67 },
  { id: 'p-6', name: 'Tavuk Şiş', description: 'Marine tavuk göğsü, sebzeli pilav', price: 195, category_id: 'cat-2', is_available: true, orderCount: 38, likeCount: 54 },
  { id: 'p-8', name: 'Karışık Izgara', description: 'Köfte, tavuk, kuzu (2 kişilik)', price: 450, category_id: 'cat-2', is_available: true, orderCount: 29, likeCount: 76 },
  { id: 'p-10', name: 'Karışık Pizza', description: 'Sucuk, sosis, mantar, biber', price: 195, category_id: 'cat-3', is_available: true, orderCount: 42, likeCount: 61 },
  { id: 'p-11', name: 'Pepperoni', description: 'Bol pepperoni, mozzarella', price: 185, category_id: 'cat-3', is_available: true, orderCount: 36, likeCount: 55 },
  { id: 'p-13', name: 'Karides Güveç', description: 'Karides, domates, sarımsak', price: 280, category_id: 'cat-4', is_available: true, orderCount: 31, likeCount: 68 },
  { id: 'p-14', name: 'Kalamar Tava', description: 'Çıtır kalamar, tartar sos', price: 240, category_id: 'cat-4', is_available: true, orderCount: 27, likeCount: 42 },
  { id: 'p-15', name: 'Türk Kahvesi', description: 'Geleneksel Türk kahvesi', price: 45, category_id: 'cat-5', is_available: true, orderCount: 67, likeCount: 34 },
  { id: 'p-16', name: 'Ayran', description: 'Ev yapımı ayran', price: 25, category_id: 'cat-5', is_available: true, orderCount: 89, likeCount: 28 },
  { id: 'p-17', name: 'Taze Portakal Suyu', description: 'Taze sıkılmış', price: 55, category_id: 'cat-5', is_available: true, orderCount: 45, likeCount: 38 },
  { id: 'p-18', name: 'Limonata', description: 'Ev yapımı limonata', price: 45, category_id: 'cat-5', is_available: true, orderCount: 52, likeCount: 41 },
  { id: 'p-20', name: 'Sütlaç', description: 'Fırında sütlaç', price: 75, category_id: 'cat-6', is_available: true, orderCount: 34, likeCount: 45 },
  { id: 'p-21', name: 'Baklava', description: 'Antep fıstıklı (4 dilim)', price: 160, category_id: 'cat-6', is_available: true, orderCount: 41, likeCount: 72 },
]

export default function VenueMenuPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const venueId = params.id as string

  const [mounted, setMounted] = useState(false)
  const [venue, setVenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  const tableId = searchParams.get('table')
  const canOrder = searchParams.get('order') === 'true' || tableId !== null

  useEffect(() => {
    setMounted(true)
    loadVenue()
  }, [venueId])

  const loadVenue = async () => {
    try {
      const { data } = await supabase
        .from('venues')
        .select('id, name, logo_url')
        .eq('id', venueId)
        .single()
      if (data) setVenue(data)
    } catch (err) {
      console.error(err)
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

  // Popüler ürünler (en çok sipariş + beğeni)
  const popularProducts = demoProducts
    .filter(p => p.isPopular)
    .sort((a, b) => ((b.orderCount || 0) + (b.likeCount || 0)) - ((a.orderCount || 0) + (a.likeCount || 0)))

  const filteredProducts = demoProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Popüler kategorisi seçildiyse
    if (selectedCategory === 'cat-0') {
      return matchesSearch && product.isPopular
    }
    
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesSearch && matchesCategory && !product.isPopular
  })

  // Popüler seçiliyse farklı, değilse normal gruplama
  const productsByCategory = selectedCategory === 'cat-0' 
    ? [{ category: demoCategories[0], products: popularProducts }]
    : demoCategories.slice(1).map(cat => ({
        category: cat,
        products: filteredProducts.filter(p => p.category_id === cat.id)
      })).filter(group => group.products.length > 0)

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // Product Card Component
  const ProductCard = ({ product, showStats = false }: { product: Product, showStats?: boolean }) => {
    const quantity = getCartQuantity(product.id)
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0 relative">
          <span className="text-2xl">🍽️</span>
          {product.isPopular && showStats && (
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
          {showStats && (product.orderCount || product.likeCount) && (
            <div className="flex items-center gap-3 mt-1">
              {product.orderCount && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" /> {product.orderCount} sipariş
                </span>
              )}
              {product.likeCount && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500" /> {product.likeCount}
                </span>
              )}
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
              {demoProducts.length} ürün
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

        {/* Categories - Popüler ilk sırada */}
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
            >
              Tümü
            </button>
            {demoCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id 
                    ? cat.id === 'cat-0' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                      : 'bg-orange-500 text-white' 
                    : 'bg-[#1a1a1a] text-gray-400'
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

      {/* BU MEKANDA POPÜLER - Her zaman en üstte (sadece tümü veya popüler seçili değilse) */}
      {!selectedCategory && popularProducts.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bu Mekanda Popüler</h2>
              <p className="text-xs text-gray-400">En çok sipariş edilen ve beğenilen</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {popularProducts.slice(0, 4).map((product, index) => (
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

      {/* Products by Category */}
      <div className="p-4 space-y-6">
        {productsByCategory.map(({ category, products: catProducts }) => (
          <div key={category.id}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {category.id === 'cat-0' && <Flame className="w-5 h-5 text-orange-500" />}
              {category.name}
            </h2>
            <div className="space-y-3">
              {catProducts.map(product => (
                <ProductCard key={product.id} product={product} showStats={category.id === 'cat-0'} />
              ))}
            </div>
          </div>
        ))}
      </div>

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
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <span className="text-xl">🍽️</span>
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
                onClick={() => {
                  const newOrder = {
                    id: `order-${Date.now()}`,
                    order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                    venue_id: venueId,
                    venue_name: venue?.name || 'Mekan',
                    table_number: tableId || undefined,
                    type: tableId ? 'dine_in' : 'takeaway',
                    status: 'pending',
                    total: cartTotal,
                    items: cart.map(item => ({
                      name: item.product.name,
                      quantity: item.quantity,
                      price: item.product.price
                    })),
                    created_at: new Date().toISOString()
                  }
                  const existingOrders = JSON.parse(localStorage.getItem('user_orders') || '[]')
                  existingOrders.unshift(newOrder)
                  localStorage.setItem('user_orders', JSON.stringify(existingOrders))
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
