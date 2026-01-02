'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Heart, 
  Share2, 
  Navigation,
  Coffee,
  ExternalLink,
  Instagram,
  Globe,
  Wifi,
  Dog,
  Laptop,
  Leaf,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  Gift,
  Sparkles,
  X
} from 'lucide-react'
import { CoffeeShop, CoffeeMenuItem, CoffeeCategory, CoffeeOption } from '@/lib/coffeestar-types'
import { useCoffeestar } from '@/lib/coffeestar-context'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Demo menü
const DEMO_MENU: CoffeeMenuItem[] = [
  // Espresso Based
  { id: '1', venue_id: '', name: 'Espresso', description: 'Klasik single shot espresso', price: 45, category: 'espresso_based', is_available: true, is_popular: true, is_new: false },
  { id: '2', venue_id: '', name: 'Double Espresso', description: 'Çift shot yoğun espresso', price: 55, category: 'espresso_based', is_available: true, is_popular: false, is_new: false },
  { id: '3', venue_id: '', name: 'Americano', description: 'Espresso + sıcak su', price: 60, category: 'espresso_based', is_available: true, is_popular: true, is_new: false },
  { id: '4', venue_id: '', name: 'Latte', description: 'Espresso + buharla ısıtılmış süt', price: 75, category: 'espresso_based', is_available: true, is_popular: true, is_new: false },
  { id: '5', venue_id: '', name: 'Cappuccino', description: 'Espresso + süt köpüğü', price: 70, category: 'espresso_based', is_available: true, is_popular: true, is_new: false },
  { id: '6', venue_id: '', name: 'Flat White', description: 'Double shot + kadifemsi süt', price: 80, category: 'espresso_based', is_available: true, is_popular: true, is_new: false },
  { id: '7', venue_id: '', name: 'Mocha', description: 'Espresso + çikolata + süt', price: 85, category: 'espresso_based', is_available: true, is_popular: false, is_new: false },
  { id: '8', venue_id: '', name: 'Cortado', description: 'Espresso + az süt', price: 65, category: 'espresso_based', is_available: true, is_popular: false, is_new: false },
  { id: '9', venue_id: '', name: 'Macchiato', description: 'Espresso + süt lekesi', price: 55, category: 'espresso_based', is_available: true, is_popular: false, is_new: false },

  // Filter Coffee
  { id: '10', venue_id: '', name: 'V60', description: 'Pour over filter coffee', price: 90, category: 'filter_coffee', is_available: true, is_popular: true, is_new: false },
  { id: '11', venue_id: '', name: 'Chemex', description: 'Temiz ve parlak kahve', price: 95, category: 'filter_coffee', is_available: true, is_popular: false, is_new: false },
  { id: '12', venue_id: '', name: 'Aeropress', description: 'Yoğun filter coffee', price: 85, category: 'filter_coffee', is_available: true, is_popular: false, is_new: false },
  { id: '13', venue_id: '', name: 'French Press', description: 'Full body kahve', price: 75, category: 'filter_coffee', is_available: true, is_popular: false, is_new: false },

  // Cold Drinks
  { id: '14', venue_id: '', name: 'Iced Latte', description: 'Soğuk latte', price: 85, category: 'cold_drinks', is_available: true, is_popular: true, is_new: false },
  { id: '15', venue_id: '', name: 'Iced Americano', description: 'Soğuk americano', price: 70, category: 'cold_drinks', is_available: true, is_popular: true, is_new: false },
  { id: '16', venue_id: '', name: 'Cold Brew', description: '24 saat demleme', price: 90, category: 'cold_drinks', is_available: true, is_popular: true, is_new: true },
  { id: '17', venue_id: '', name: 'Frappe', description: 'Buzlu kahve', price: 80, category: 'cold_drinks', is_available: true, is_popular: false, is_new: false },

  // Signature
  { id: '18', venue_id: '', name: 'Caramel Macchiato', description: 'Karamel soslu espresso', price: 95, category: 'signature', is_available: true, is_popular: true, is_new: false },
  { id: '19', venue_id: '', name: 'Lavender Latte', description: 'Lavanta aromalı latte', price: 100, category: 'signature', is_available: true, is_popular: false, is_new: true },
  { id: '20', venue_id: '', name: 'Dirty Chai', description: 'Chai latte + espresso shot', price: 95, category: 'signature', is_available: true, is_popular: true, is_new: false },

  // Pastry
  { id: '21', venue_id: '', name: 'Croissant', description: 'Taze tereyağlı kruvasan', price: 55, category: 'pastry', is_available: true, is_popular: true, is_new: false },
  { id: '22', venue_id: '', name: 'Pain au Chocolat', description: 'Çikolatalı kruvasan', price: 65, category: 'pastry', is_available: true, is_popular: true, is_new: false },
  { id: '23', venue_id: '', name: 'Cookie', description: 'Çikolata parçacıklı kurabiye', price: 40, category: 'pastry', is_available: true, is_popular: false, is_new: false },
  { id: '24', venue_id: '', name: 'Brownie', description: 'Fudgy brownie', price: 60, category: 'pastry', is_available: true, is_popular: true, is_new: false },

  // Cake
  { id: '25', venue_id: '', name: 'Cheesecake', description: 'New York style cheesecake', price: 85, category: 'cake', is_available: true, is_popular: true, is_new: false },
  { id: '26', venue_id: '', name: 'Carrot Cake', description: 'Havuçlu tarçınlı kek', price: 80, category: 'cake', is_available: true, is_popular: false, is_new: false },
  { id: '27', venue_id: '', name: 'Tiramisu', description: 'Klasik İtalyan tatlısı', price: 90, category: 'cake', is_available: true, is_popular: true, is_new: false },
]

// Kahve opsiyonları
const COFFEE_OPTIONS: CoffeeOption[] = [
  {
    id: 'size',
    name: 'Boyut',
    type: 'size',
    is_required: true,
    max_selections: 1,
    choices: [
      { id: 'small', name: 'Small', price_modifier: 0, is_default: true },
      { id: 'medium', name: 'Medium', price_modifier: 10 },
      { id: 'large', name: 'Large', price_modifier: 20 }
    ]
  },
  {
    id: 'milk',
    name: 'Süt',
    type: 'milk',
    is_required: false,
    max_selections: 1,
    choices: [
      { id: 'regular', name: 'Normal Süt', price_modifier: 0, is_default: true },
      { id: 'oat', name: 'Yulaf Sütü', price_modifier: 15 },
      { id: 'almond', name: 'Badem Sütü', price_modifier: 15 },
      { id: 'soy', name: 'Soya Sütü', price_modifier: 10 },
      { id: 'coconut', name: 'Hindistan Cevizi', price_modifier: 15 }
    ]
  },
  {
    id: 'sugar',
    name: 'Şeker',
    type: 'sugar',
    is_required: false,
    max_selections: 1,
    choices: [
      { id: 'none', name: 'Şekersiz', price_modifier: 0 },
      { id: 'less', name: 'Az Şekerli', price_modifier: 0, is_default: true },
      { id: 'normal', name: 'Normal', price_modifier: 0 },
      { id: 'extra', name: 'Çok Şekerli', price_modifier: 0 }
    ]
  },
  {
    id: 'extra',
    name: 'Ekstralar',
    type: 'extra',
    is_required: false,
    max_selections: 3,
    choices: [
      { id: 'extra_shot', name: 'Extra Shot', price_modifier: 15 },
      { id: 'vanilla', name: 'Vanilya Şurubu', price_modifier: 10 },
      { id: 'caramel', name: 'Karamel Şurubu', price_modifier: 10 },
      { id: 'hazelnut', name: 'Fındık Şurubu', price_modifier: 10 },
      { id: 'whipped', name: 'Krem Şanti', price_modifier: 10 }
    ]
  }
]

const categoryLabels: Record<CoffeeCategory, string> = {
  espresso_based: '☕ Espresso',
  filter_coffee: '🫖 Filter Coffee',
  cold_drinks: '🧊 Soğuk İçecekler',
  signature: '⭐ Özel Tarifler',
  tea: '🍵 Çay',
  hot_chocolate: '🍫 Sıcak Çikolata',
  pastry: '🥐 Pastane',
  cake: '🍰 Kek & Tatlı',
  dessert: '🍮 Tatlılar',
  snack: '🥪 Atıştırmalık'
}

interface CartItem {
  menuItem: CoffeeMenuItem
  quantity: number
  options: Record<string, string | string[]>
  totalPrice: number
}

export default function CoffeeShopDetailPage() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string
  
  const { stats, freeBalance, favoriteShops, toggleFavoriteShop, addCoffee } = useCoffeestar()
  
  const [shop, setShop] = useState<CoffeeShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<CoffeeCategory>('espresso_based')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CoffeeMenuItem | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({})
  const [quantity, setQuantity] = useState(1)

  // Shop detaylarını çek
  useEffect(() => {
    const fetchShopDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/places/details?place_id=${placeId}`)
        const data = await response.json()
        
        if (data.place) {
          setShop({
            id: data.place.place_id,
            place_id: data.place.place_id,
            name: data.place.name,
            address: data.place.formatted_address || data.place.vicinity || '',
            district: '',
            city: '',
            lat: data.place.geometry?.location?.lat,
            lng: data.place.geometry?.location?.lng,
            rating: data.place.rating || 0,
            user_ratings_total: data.place.user_ratings_total || 0,
            price_level: data.place.price_level || 2,
            photo_url: data.place.photos?.[0]?.photo_reference 
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${data.place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              : undefined,
            photos: data.place.photos?.map((p: any) => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
            ),
            is_open: data.place.opening_hours?.open_now,
            opening_hours: data.place.opening_hours?.weekday_text,
            phone: data.place.formatted_phone_number,
            website: data.place.website,
            is_partner: false,
            features: ['wifi', 'laptop_friendly']
          })
        }
      } catch (err) {
        console.error('Error fetching shop details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (placeId) {
      fetchShopDetails()
    }
  }, [placeId])

  const isFavorite = shop ? favoriteShops.some(s => s.id === shop.id) : false

  // Kategorilere göre menü
  const menuByCategory = DEMO_MENU.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<CoffeeCategory, CoffeeMenuItem[]>)

  const categories = Object.keys(menuByCategory) as CoffeeCategory[]

  // Sepete ekle
  const addToCart = () => {
    if (!selectedItem) return

    let itemPrice = selectedItem.price
    
    // Opsiyon fiyatlarını ekle
    Object.entries(selectedOptions).forEach(([optionId, value]) => {
      const option = COFFEE_OPTIONS.find(o => o.id === optionId)
      if (option) {
        if (Array.isArray(value)) {
          value.forEach(v => {
            const choice = option.choices.find(c => c.id === v)
            if (choice) itemPrice += choice.price_modifier
          })
        } else {
          const choice = option.choices.find(c => c.id === value)
          if (choice) itemPrice += choice.price_modifier
        }
      }
    })

    const cartItem: CartItem = {
      menuItem: selectedItem,
      quantity,
      options: selectedOptions,
      totalPrice: itemPrice * quantity
    }

    setCart(prev => [...prev, cartItem])
    setSelectedItem(null)
    setSelectedOptions({})
    setQuantity(1)
  }

  // Sepet toplamı
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Sipariş ver
  const handleOrder = async () => {
    if (!shop) return

    // Her kahve için puan ekle
    for (const item of cart) {
      if (['espresso_based', 'filter_coffee', 'cold_drinks', 'signature'].includes(item.menuItem.category)) {
        await addCoffee(shop.id, shop.name, item.menuItem.name, item.totalPrice)
      }
    }

    // TODO: Siparişi kaydet
    alert('Siparişiniz alındı! ☕')
    setCart([])
    setShowCart(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Coffee shop bulunamadı</p>
          <button type="button" 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-amber-500 rounded-lg"
          >
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Hero Image */}
      <div className="relative h-64">
        {shop.photo_url ? (
          <img 
            src={shop.photo_url} 
            alt={shop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900 to-orange-900 flex items-center justify-center">
            <Coffee className="w-20 h-20 text-amber-400/50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        
        {/* Back & Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button type="button" 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <button type="button" 
              onClick={() => toggleFavoriteShop(shop.id)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button type="button" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Shop Info */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold mb-1">{shop.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium">{shop.rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({shop.user_ratings_total})</span>
                </div>
                {shop.is_open !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    shop.is_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {shop.is_open ? 'Açık' : 'Kapalı'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Coffeestar Badge */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">Coffeestar</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4">{shop.address}</p>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button type="button" 
              onClick={() => window.open(`tel:${shop.phone}`)}
              className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl"
            >
              <Phone className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">Ara</span>
            </button>
            <button type="button" 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`)}
              className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl"
            >
              <Navigation className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400">Yol Tarifi</span>
            </button>
            {shop.website && (
              <button type="button" 
                onClick={() => window.open(shop.website)}
                className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl"
              >
                <Globe className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-gray-400">Website</span>
              </button>
            )}
            <button type="button" className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl">
              <Instagram className="w-5 h-5 text-pink-400" />
              <span className="text-xs text-gray-400">Instagram</span>
            </button>
          </div>
        </div>
      </div>

      {/* Free Coffee Banner */}
      {freeBalance && freeBalance.available > 0 && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-4 border border-green-500/30 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-400">🎉 {freeBalance.available} Bedava Kahven Var!</p>
              <p className="text-sm text-green-300/60">Bu siparişte kullanabilirsin</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] py-4 mt-4">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button type="button"
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors ${
                activeCategory === cat
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/5 text-gray-400'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 space-y-4">
        {menuByCategory[activeCategory]?.map((item) => (
          <button type="button"
            key={item.id}
            onClick={() => {
              setSelectedItem(item)
              setSelectedOptions({
                size: 'small',
                milk: 'regular',
                sugar: 'less',
                extra: []
              })
            }}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 border border-white/5 hover:border-amber-500/30 transition-all text-left"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.is_popular && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Popüler</span>
                  )}
                  {item.is_new && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Yeni</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                )}
                <p className="text-amber-400 font-semibold">₺{item.price}</p>
              </div>
              
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center ml-4">
                <Plus className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Product Options Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#1a1a1a] w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedItem.name}</h2>
              <button type="button" onClick={() => setSelectedItem(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Only show options for coffee items */}
              {['espresso_based', 'filter_coffee', 'cold_drinks', 'signature'].includes(selectedItem.category) && (
                <>
                  {COFFEE_OPTIONS.map((option) => (
                    <div key={option.id}>
                      <h3 className="font-medium mb-3">{option.name}</h3>
                      <div className="space-y-2">
                        {option.choices.map((choice) => {
                          const isSelected = option.type === 'extra'
                            ? (selectedOptions[option.id] as string[] || []).includes(choice.id)
                            : selectedOptions[option.id] === choice.id

                          return (
                            <button type="button"
                              key={choice.id}
                              onClick={() => {
                                if (option.type === 'extra') {
                                  const current = (selectedOptions[option.id] as string[] || [])
                                  if (isSelected) {
                                    setSelectedOptions(prev => ({
                                      ...prev,
                                      [option.id]: current.filter(c => c !== choice.id)
                                    }))
                                  } else if (current.length < option.max_selections) {
                                    setSelectedOptions(prev => ({
                                      ...prev,
                                      [option.id]: [...current, choice.id]
                                    }))
                                  }
                                } else {
                                  setSelectedOptions(prev => ({
                                    ...prev,
                                    [option.id]: choice.id
                                  }))
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/20 border border-amber-500/50'
                                  : 'bg-white/5 border border-white/5'
                              }`}
                            >
                              <span>{choice.name}</span>
                              <span className={choice.price_modifier > 0 ? 'text-amber-400' : 'text-gray-500'}>
                                {choice.price_modifier > 0 ? `+₺${choice.price_modifier}` : ''}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-medium mb-3">Adet</h3>
                <div className="flex items-center gap-4 justify-center">
                  <button type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                  <button type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="sticky bottom-0 p-4 bg-[#1a1a1a] border-t border-white/5">
              <button type="button"
                onClick={addToCart}
                className="w-full py-4 bg-amber-500 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Sepete Ekle - ₺{selectedItem.price * quantity}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40">
          <button type="button"
            onClick={() => setShowCart(true)}
            className="w-full py-4 bg-amber-500 rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-amber-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="font-bold">{cartItemCount}</span>
              </div>
              <span>Sepeti Görüntüle</span>
            </div>
            <span className="text-lg font-bold">₺{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#1a1a1a] w-full rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a1a1a] p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Sepetim ({cartItemCount})</h2>
              <button type="button" onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cart.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.menuItem.name}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="font-bold text-amber-400">₺{item.totalPrice}</p>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 p-4 bg-[#1a1a1a] border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span>Toplam</span>
                <span className="font-bold text-amber-400">₺{cartTotal}</span>
              </div>
              <button type="button"
                onClick={handleOrder}
                className="w-full py-4 bg-green-500 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Coffee className="w-5 h-5" />
                Sipariş Ver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}