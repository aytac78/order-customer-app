'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Minus, Plus, ShoppingCart, X, Send, MapPin, Heart, Sparkles, User, Phone, Clock, Instagram } from 'lucide-react'
import { createOrder, OrderItem } from '@/lib/shared-orders'
import { useVenueMenu } from '@/lib/useVenueMenu'

interface CartItem extends OrderItem {
  name: string
  price: number
}

export default function QROrderPage() {
  const router = useRouter()
  const { venue, loading, error } = useVenueMenu("nihals-break-point")
  
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState('')
  const [placedOrderTotal, setPlacedOrderTotal] = useState(0)
  const [showTableInput, setShowTableInput] = useState(true)

  // İlk kategoriyi seç venue yüklenince
  useEffect(() => {
    if (venue?.menu?.[0]?.id && !selectedCategory) {
      setSelectedCategory(venue.menu[0].id)
    }
  }, [venue])

  // Loading durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <p>Mekan bulunamadı</p>
      </div>
    )
  }

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
      }
      return prev.filter(i => i.id !== itemId)
    })
  }

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !tableNumber) return

    const total = cartTotal
    setPlacedOrderTotal(total)

    const order = await createOrder({
  venue_id: venue.id,
  venue_name: venue.name,
  table_number: tableNumber,
  items: cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    note: note
  })),
  total: total,
  status: 'pending',
  customer_name: customerName || 'Misafir',
})

    setPlacedOrderId(order.id)
    setOrderPlaced(true)
    setCart([])
    setShowCart(false)
  }

  // Masa seçim ekranı
  if (showTableInput) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        {/* Venue Header */}
        <div className="relative h-48 bg-gradient-to-br from-orange-600 to-amber-700">
          <div className="absolute inset-0 bg-black/30" />
          <button 
            onClick={() => router.back()} 
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold mb-1">{venue.name}</h1>
            <p className="text-white/80 text-sm">{[venue.category].flat().join(' • ')}</p>
          </div>
        </div>

        {/* Venue Info */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">{venue.address}</p>
              <p className="text-sm text-gray-400">{venue.district}, {venue.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{venue.workingHours?.open || "09:00"} - {venue.workingHours?.close || "00:00"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★</span>
              <span>{venue.rating} ({venue.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Table Selection */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
            <ShoppingCart className="w-10 h-10 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sipariş Vermek İçin</h2>
          <p className="text-gray-400 text-center mb-8">Masa numaranızı girin</p>
          
          <input
            type="text"
            placeholder="Masa No (örn: 5)"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full max-w-xs px-6 py-4 bg-[#1a1a1a] rounded-xl border border-white/10 text-center text-2xl font-bold outline-none focus:border-orange-500 mb-4"
          />
          
          <button
            onClick={() => tableNumber && setShowTableInput(false)}
            disabled={!tableNumber}
            className="w-full max-w-xs py-4 bg-orange-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Menüyü Gör
          </button>
        </div>

        {/* Bottom contact */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="flex items-center gap-2 hover:text-white">
                <Phone className="w-4 h-4" />
                <span>Ara</span>
              </a>
            )}
            {venue.instagram && (
              <a href={`https://instagram.com/${venue.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-2 hover:text-white">
                <Instagram className="w-4 h-4" />
                <span>{venue.instagram}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Sipariş başarılı ekranı
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Send className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Siparişiniz Alındı!</h1>
        <p className="text-gray-400 text-center mb-1">{venue.name}</p>
        <p className="text-gray-400 text-center mb-2">Masa {tableNumber} için siparişiniz hazırlanıyor</p>
        <p className="text-orange-500 font-mono mb-8">{placedOrderId}</p>
        
        <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Durum</span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm">Onay Bekleniyor</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Toplam</span>
            <span className="font-bold">₺{placedOrderTotal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Tahmini Süre</span>
            <span>15-20 dk</span>
          </div>
        </div>

        <button
          onClick={() => {
            setOrderPlaced(false)
            setPlacedOrderId('')
            setPlacedOrderTotal(0)
          }}
          className="w-full max-w-sm py-4 bg-orange-500 rounded-xl font-semibold mb-3"
        >
          Yeni Sipariş Ver
        </button>
        <button
          onClick={() => router.push('/orders/my')}
          className="w-full max-w-sm py-4 bg-[#1a1a1a] border border-white/10 rounded-xl font-semibold"
        >
          Siparişlerimi Gör
        </button>
      </div>
    )
  }

  // Ana menü ekranı
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTableInput(true)} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{venue.name}</h1>
              <p className="text-sm text-gray-400">Masa {tableNumber}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[73px] z-30 bg-[#0a0a0a] border-b border-white/5">
        <div className="flex overflow-x-auto py-3 px-4 gap-2 no-scrollbar">
          {venue.menu.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all text-sm ${
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

      {/* Menu Items */}
      <div className="px-4 py-4">
        {venue.menu
          .filter(cat => cat.id === selectedCategory)
          .map(cat => (
            <div key={cat.id} className="space-y-3">
              <h2 className="text-lg font-bold mb-4">{cat.name}</h2>
              {cat.items.map(item => {
                const qty = getItemQuantity(item.id)
                return (
                  <div
                    key={item.id}
                    className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                      )}
                      <p className="text-orange-500 font-bold">₺{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {qty > 0 ? (
                        <>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-semibold">{qty}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-4 py-2 bg-orange-500 rounded-lg font-medium text-sm"
                        >
                          Ekle
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
      </div>

      {/* Cart Button Fixed */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <button
            onClick={() => setShowCart(true)}
            className="w-full py-4 bg-orange-500 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30"
          >
            <ShoppingCart className="w-5 h-5" />
            Sepeti Gör ({cartCount} ürün) - ₺{cartTotal}
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
         <div className="w-full max-h-[80vh] bg-[#1a1a1a] rounded-t-3xl overflow-hidden flex flex-col mb-16">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-xl font-bold">Sepetim</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Sepetiniz boş</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-[#242424] rounded-xl p-3">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-orange-500">₺{item.price} x {item.quantity} = ₺{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Note Input */}
                  <div className="mt-4">
                    <label className="text-gray-400 text-sm mb-2 block">Sipariş Notu (opsiyonel)</label>
                    <input
                      type="text"
                      placeholder="Örn: Acısız olsun, ekstra sos"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-3 bg-[#242424] rounded-xl border border-white/5 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Name Input */}
                  <div className="mt-3">
                    <label className="text-gray-400 text-sm mb-2 block">İsminiz (opsiyonel)</label>
                    <input
                      type="text"
                      placeholder="Siparişte görünecek isim"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#242424] rounded-xl border border-white/5 outline-none focus:border-orange-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Toplam</span>
                  <span className="text-2xl font-bold">₺{cartTotal}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-4 bg-orange-500 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Siparişi Gönder
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
