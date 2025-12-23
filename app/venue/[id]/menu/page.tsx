'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Search, Loader2, AlertCircle, ShoppingCart,
  Plus, Minus, X, Coffee, Pizza, Salad, Beef, Fish, 
  IceCream, Beer, Wine
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  sort_order: number
  icon?: string
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category_id: string
  is_available: boolean
  preparation_time?: number
}

interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

// Demo kategoriler
const demoCategories: Category[] = [
  { id: 'cat-1', name: 'Başlangıçlar', sort_order: 1, icon: 'salad' },
  { id: 'cat-2', name: 'Ana Yemekler', sort_order: 2, icon: 'beef' },
  { id: 'cat-3', name: 'Pizzalar', sort_order: 3, icon: 'pizza' },
  { id: 'cat-4', name: 'Deniz Ürünleri', sort_order: 4, icon: 'fish' },
  { id: 'cat-5', name: 'İçecekler', sort_order: 5, icon: 'coffee' },
  { id: 'cat-6', name: 'Tatlılar', sort_order: 6, icon: 'icecream' },
]

// Demo ürünler
const demoProducts: Product[] = [
  // Başlangıçlar
  { id: 'p-1', name: 'Mercimek Çorbası', description: 'Geleneksel tarif ile hazırlanan mercimek çorbası', price: 85, category_id: 'cat-1', is_available: true },
  { id: 'p-2', name: 'Humus', description: 'Nohut püresi, tahin, zeytinyağı', price: 95, category_id: 'cat-1', is_available: true },
  { id: 'p-3', name: 'Sigara Böreği', description: 'Peynirli el açması börek (4 adet)', price: 110, category_id: 'cat-1', is_available: true },
  { id: 'p-4', name: 'Karışık Meze', description: 'Humus, haydari, patlıcan salatası, acuka', price: 180, category_id: 'cat-1', is_available: true },
  
  // Ana Yemekler
  { id: 'p-5', name: 'Izgara Köfte', description: 'Dana kıyma, özel baharatlar, pilav ve salata ile', price: 220, category_id: 'cat-2', is_available: true },
  { id: 'p-6', name: 'Tavuk Şiş', description: 'Marine edilmiş tavuk göğsü, sebzeli pilav', price: 195, category_id: 'cat-2', is_available: true },
  { id: 'p-7', name: 'Adana Kebap', description: 'Acılı dana kıyma, lavaş, közlenmiş domates', price: 250, category_id: 'cat-2', is_available: true },
  { id: 'p-8', name: 'Karışık Izgara', description: 'Köfte, tavuk, kuzu pirzola (2 kişilik)', price: 450, category_id: 'cat-2', is_available: true },
  
  // Pizzalar
  { id: 'p-9', name: 'Margherita', description: 'Domates sos, mozzarella, fesleğen', price: 165, category_id: 'cat-3', is_available: true },
  { id: 'p-10', name: 'Karışık Pizza', description: 'Sucuk, sosis, mantar, biber, mozzarella', price: 195, category_id: 'cat-3', is_available: true },
  { id: 'p-11', name: 'Pepperoni', description: 'Bol pepperoni, mozzarella', price: 185, category_id: 'cat-3', is_available: true },
  
  // Deniz Ürünleri
  { id: 'p-12', name: 'Izgara Levrek', description: 'Taze levrek, limon, roka salatası', price: 320, category_id: 'cat-4', is_available: true },
  { id: 'p-13', name: 'Karides Güveç', description: 'Karides, domates, sarımsak, peynir', price: 280, category_id: 'cat-4', is_available: true },
  { id: 'p-14', name: 'Kalamar Tava', description: 'Çıtır kalamar, tartar sos', price: 240, category_id: 'cat-4', is_available: true },
  
  // İçecekler
  { id: 'p-15', name: 'Türk Kahvesi', description: 'Geleneksel Türk kahvesi', price: 45, category_id: 'cat-5', is_available: true },
  { id: 'p-16', name: 'Ayran', description: 'Ev yapımı ayran', price: 25, category_id: 'cat-5', is_available: true },
  { id: 'p-17', name: 'Taze Sıkılmış Portakal', description: 'Taze sıkılmış portakal suyu', price: 55, category_id: 'cat-5', is_available: true },
  { id: 'p-18', name: 'Limonata', description: 'Ev yapımı limonata', price: 45, category_id: 'cat-5', is_available: true },
  
  // Tatlılar
  { id: 'p-19', name: 'Künefe', description: 'Sıcak künefe, kaymak, antep fıstığı', price: 140, category_id: 'cat-6', is_available: true },
  { id: 'p-20', name: 'Sütlaç', description: 'Fırında sütlaç', price: 75, category_id: 'cat-6', is_available: true },
  { id: 'p-21', name: 'Baklava', description: 'Antep fıstıklı baklava (4 dilim)', price: 160, category_id: 'cat-6', is_available: true },
]

export default function VenueMenuPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id as string

  const [venue, setVenue] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)

  useEffect(() => {
    if (venueId) {
      loadMenuData()
    }
  }, [venueId])

  const loadMenuData = async () => {
    try {
      // Load venue
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('id, name, logo_url')
        .eq('id', venueId)
        .single()

      if (venueError) {
        console.error('Venue error:', venueError)
      } else {
        setVenue(venueData)
      }

      // Try to load categories
      let hasRealData = false
      
      try {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('venue_id', venueId)
          .eq('is_active', true)
          .order('sort_order')

        if (!catError && catData && catData.length > 0) {
          setCategories(catData)
          hasRealData = true
          
          // Load products
          const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*')
            .eq('venue_id', venueId)
            .eq('is_available', true)
            .order('sort_order')

          if (!prodError && prodData) {
            setProducts(prodData)
          }
        }
      } catch (err) {
        console.log('Categories table not found, using demo data')
      }

      // Eğer gerçek veri yoksa demo kullan
      if (!hasRealData) {
        setUsingDemoData(true)
        setCategories(demoCategories)
        setProducts(demoProducts)
      }

    } catch (err) {
      console.error('Menu load error:', err)
      // Hata durumunda da demo veri göster
      setUsingDemoData(true)
      setCategories(demoCategories)
      setProducts(demoProducts)
    } finally {
      setLoading(false)
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
    return cart.find(item => item.product.id === productId)?.quantity || 0
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group products by category
  const productsByCategory = categories.map(cat => ({
    category: cat,
    products: filteredProducts.filter(p => p.category_id === cat.id)
  })).filter(group => group.products.length > 0)

  if (loading) {
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
              {usingDemoData && <span className="text-orange-500"> • Demo Menü</span>}
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="px-4 pb-4 overflow-x-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#1a1a1a] text-gray-400'
                }`}
              >
                Tümü
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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
      </div>

      {/* Demo Data Notice */}
      {usingDemoData && (
        <div className="mx-4 mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl">
          <p className="text-sm text-orange-300 text-center">
            🍽️ Demo menü gösteriliyor. Gerçek menü yakında eklenecek!
          </p>
        </div>
      )}

      {/* Products */}
      <div className="p-4 space-y-6">
        {productsByCategory.map(({ category, products: catProducts }) => (
          <div key={category.id}>
            <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
            <div className="space-y-3">
              {catProducts.map(product => {
                const quantity = getCartQuantity(product.id)
                return (
                  <div
                    key={product.id}
                    className="bg-[#1a1a1a] rounded-2xl p-4 flex gap-4"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-orange-500">
                          ₺{product.price.toLocaleString()}
                        </span>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center gap-3 bg-orange-500 rounded-full px-2 py-1">
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="p-1"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                            <button
                              onClick={() => addToCart(product)}
                              className="p-1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="p-2 bg-orange-500 rounded-full"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Sonuç bulunamadı</p>
          </div>
        )}
      </div>

      {/* Cart Bottom Bar */}
      {cartItemCount > 0 && (
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#1a1a1a] rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">Sepetim ({cartItemCount})</h2>
              <button onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-orange-500 font-bold">
                      ₺{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-2 py-1">
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold min-w-[20px] text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(item.product)} className="p-1">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-[#1a1a1a] p-4 border-t border-white/10">
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Toplam</span>
                <span className="text-xl font-bold">₺{cartTotal.toLocaleString()}</span>
              </div>
              {usingDemoData ? (
                <div className="text-center py-3 bg-gray-800 rounded-2xl">
                  <p className="text-gray-400 text-sm">Demo menü - Sipariş verilemez</p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    alert('Sipariş özelliği yakında!')
                  }}
                  className="w-full py-4 bg-orange-500 rounded-2xl font-bold"
                >
                  Siparişi Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
