'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Minus, Plus, Trash2, ShoppingBag, MapPin, CreditCard, Wallet, 
  Check, Clock, Users, Split, X, AlertTriangle, Home, Store, Bike, 
  Phone, User, ChevronRight, Navigation, Edit2, Loader2
} from 'lucide-react'
import { useCart } from '@/lib/CartContext'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

type OrderType = 'dine_in' | 'takeaway' | 'delivery'

interface Address {
  id: string
  title: string
  full_address: string
  district: string
  city: string
  notes?: string
  is_default: boolean
}

export default function CartPage() {
  const router = useRouter()
  const { items, venueName, venueId, updateQuantity, removeItem, clearCart, totalPrice } = useCart()
  const { user, profile } = useAuth()
  const { t } = useI18n()
  
  // Sipariş Tipi
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  
  // Dine-in için
  const [tableNumber, setTableNumber] = useState('')
  
  // Takeaway için
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  // Delivery için
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [deliveryFee, setDeliveryFee] = useState(0)
  
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'tit_pay'>('cash')
  
  // Bahşiş
  const [tipPercent, setTipPercent] = useState<number>(0)
  const [customTip, setCustomTip] = useState('')
  
  // Hesap Bölme
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitCount, setSplitCount] = useState(1)

  const tipOptions = [0, 10, 15, 20]
  const tipAmount = customTip ? parseFloat(customTip) || 0 : Math.round(totalPrice * tipPercent / 100)
  const tax = Math.round(totalPrice * 0.08)
  const subtotalWithTax = totalPrice + tax + tipAmount
  const total = subtotalWithTax + (orderType === 'delivery' ? deliveryFee : 0)
  const perPerson = splitCount > 1 ? Math.ceil(total / splitCount) : total

  // Tahmini hazırlık süresi
  const estimatedTime = Math.max(15, items.reduce((sum, item) => sum + item.quantity * 5, 10))
  const deliveryTime = orderType === 'delivery' ? 20 : 0
  const totalEstimatedTime = estimatedTime + deliveryTime

  // Minimum sipariş tutarı
  const minimumOrderAmount = orderType === 'delivery' ? 100 : 0
  const isMinimumMet = totalPrice >= minimumOrderAmount

  useEffect(() => {
    // Check order_mode from localStorage (set by discover page)
    const orderMode = localStorage.getItem('order_mode')
    const savedTable = localStorage.getItem('current_table')
    
    if (orderMode === 'takeaway') {
      setOrderType('takeaway')
    } else if (savedTable) {
      setTableNumber(savedTable)
      setOrderType('dine_in')
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadAddresses()
      if (profile?.display_name) setCustomerName(profile.display_name)
      if (profile?.phone) setCustomerPhone(profile.phone)
    }
  }, [user, profile])

  useEffect(() => {
    if (orderType === 'delivery' && selectedAddress) {
      setDeliveryFee(15)
    } else {
      setDeliveryFee(0)
    }
  }, [orderType, selectedAddress])

  const loadAddresses = async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    
    if (data && data.length > 0) {
      setAddresses(data)
      const defaultAddr = data.find((a: Address) => a.is_default) || data[0]
      setSelectedAddress(defaultAddr)
    }
  }

  const validateOrder = () => {
    if (orderType === 'dine_in' && !tableNumber) {
      alert(t.cart?.enterTableNumber || 'Lütfen masa numaranızı girin')
      return false
    }
    if (orderType === 'takeaway' && (!customerName || !customerPhone)) {
      alert(t.cart?.enterContactInfo || 'Lütfen isim ve telefon numaranızı girin')
      return false
    }
    if (orderType === 'delivery' && !selectedAddress) {
      alert(t.cart?.selectAddress || 'Lütfen teslimat adresi seçin')
      return false
    }
    if (!isMinimumMet) {
      alert(`${t.cart?.minimumOrder || 'Minimum sipariş tutarı'}: ₺${minimumOrderAmount}`)
      return false
    }
    return true
  }

  const handleOrder = async () => {
    if (!validateOrder()) return
    if (!user) { router.push('/auth'); return }

    setLoading(true)
    const cleanVenueId = venueId?.replace('order-', '') || null
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

    const orderData: any = {
      venue_id: cleanVenueId,
      user_id: user.id,
      order_number: orderNumber,
      type: orderType,
      status: 'pending',
      payment_status: 'pending',
      payment_method: paymentMethod,
      subtotal: totalPrice,
      tax: tax,
      tip: tipAmount,
      delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
      total: total,
      notes: notes || null,
      customer_name: customerName || profile?.display_name || 'Misafir',
      customer_phone: customerPhone || null,
      estimated_time: totalEstimatedTime,
      split_count: splitCount > 1 ? splitCount : null,
      items: items.map(item => ({
        id: item.id,
        product_name: item.name,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        quantity: item.quantity,
        options: item.options || [],
        status: 'pending'
      }))
    }

    if (orderType === 'dine_in') {
      orderData.table_number = tableNumber
    } else if (orderType === 'delivery' && selectedAddress) {
      orderData.delivery_address = {
        title: selectedAddress.title,
        full_address: selectedAddress.full_address,
        district: selectedAddress.district,
        city: selectedAddress.city,
        notes: selectedAddress.notes
      }
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error('Sipariş hatası:', error)
      alert((t.cart?.orderError || 'Sipariş oluşturulamadı') + ': ' + error.message)
    } else {
      setOrderId(order.id)
      setSuccess(true)
      clearCart()
      // Clear order mode after successful order
      localStorage.removeItem('order_mode')
    }
  }

  // Başarı Ekranı
  if (success && orderId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.cart?.orderReceived || 'Sipariş Alındı!'}</h1>
          <p className="text-gray-400 mb-6">{venueName}</p>
          
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-400">{t.cart?.orderNumber || 'Sipariş Numarası'}</p>
            <p className="text-xl font-bold text-orange-500">#{orderId.slice(-6).toUpperCase()}</p>
            
            {orderType === 'dine_in' && <p className="text-sm text-gray-400 mt-2">🍽️ Masa {tableNumber}</p>}
            {orderType === 'takeaway' && <p className="text-sm text-gray-400 mt-2">📦 Paket Servis</p>}
            {orderType === 'delivery' && selectedAddress && <p className="text-sm text-gray-400 mt-2">🚴 {selectedAddress.district}</p>}
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Clock className="w-5 h-5" />
              <span className="font-medium">~{totalEstimatedTime} dk</span>
            </div>
            <p className="text-sm text-orange-400/70 mt-1">
              {orderType === 'delivery' ? 'Tahmini teslimat süresi' : 'Tahmini hazırlık süresi'}
            </p>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => router.push(`/orders/${orderId}`)} className="w-full py-4 bg-orange-500 rounded-xl font-semibold">
              {t.cart?.trackOrder || 'Siparişi Takip Et'}
            </button>
            <button type="button" onClick={() => router.push('/')} className="w-full py-4 bg-[#1a1a1a] rounded-xl font-semibold">
              {t.cart?.backToHome || 'Ana Sayfaya Dön'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Boş Sepet
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-20 h-20 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">{t.cart?.empty || 'Sepetiniz Boş'}</h2>
        <p className="text-gray-400 mb-6">{t.cart?.addItems || 'Lezzetli yemekler ekleyin'}</p>
        <button type="button" onClick={() => router.push('/')} className="px-6 py-3 bg-orange-500 rounded-xl font-semibold">
          {t.cart?.browseMenu || 'Menüye Göz At'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-48">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold">{t.cart?.title || 'Sepet'}</h1>
            <p className="text-sm text-gray-400">{venueName} • {items.length} ürün</p>
          </div>
          <div className="flex items-center gap-2 text-orange-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>~{totalEstimatedTime} dk</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Sipariş Tipi Seçimi */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4">
          <h3 className="font-semibold mb-3">{t.cart?.orderType || 'Sipariş Tipi'}</h3>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setOrderType('dine_in')} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${orderType === 'dine_in' ? 'bg-orange-500 text-white' : 'bg-[#242424] text-gray-400'}`}>
              <Store className="w-6 h-6" />
              <span className="text-xs font-medium">{t.cart?.dineIn || 'Masada'}</span>
            </button>
            <button type="button" onClick={() => setOrderType('takeaway')} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${orderType === 'takeaway' ? 'bg-purple-500 text-white' : 'bg-[#242424] text-gray-400'}`}>
              <ShoppingBag className="w-6 h-6" />
              <span className="text-xs font-medium">{t.cart?.takeaway || 'Paket Al'}</span>
            </button>
            <button type="button" onClick={() => setOrderType('delivery')} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${orderType === 'delivery' ? 'bg-green-500 text-white' : 'bg-[#242424] text-gray-400'}`}>
              <Bike className="w-6 h-6" />
              <span className="text-xs font-medium">{t.cart?.delivery || 'Teslimat'}</span>
            </button>
          </div>
        </div>

        {/* Dine-In: Masa Numarası */}
        {orderType === 'dine_in' && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <h3 className="font-semibold mb-3">{t.cart?.tableNumber || 'Masa Numarası'}</h3>
            <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Örn: 5" className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 px-4 text-white text-center text-2xl font-bold" />
          </div>
        )}

        {/* Takeaway: İletişim Bilgileri */}
        {orderType === 'takeaway' && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold mb-3">{t.cart?.contactInfo || 'İletişim Bilgileri'}</h3>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t.cart?.yourName || 'Adınız'} className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white" />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={t.cart?.yourPhone || 'Telefon Numaranız'} className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white" />
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t.cart?.pickupReady || 'Hazır olduğunda SMS ile bilgilendirileceksiniz'}
            </p>
          </div>
        )}

        {/* Delivery: Adres Seçimi */}
        {orderType === 'delivery' && (
          <div className="bg-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{t.cart?.deliveryAddress || 'Teslimat Adresi'}</h3>
              <button type="button" onClick={() => router.push('/addresses')} className="text-orange-500 text-sm">{t.cart?.manageAddresses || 'Yönet'}</button>
            </div>
            
            {addresses.length === 0 ? (
              <button type="button" onClick={() => router.push('/addresses')} className="w-full p-4 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-400">
                <Plus className="w-5 h-5" />
                {t.cart?.addAddress || 'Adres Ekle'}
              </button>
            ) : (
              <div className="space-y-2">
                {addresses.slice(0, 3).map(address => (
                  <button type="button" key={address.id} onClick={() => setSelectedAddress(address)} className={`w-full p-3 rounded-xl flex items-start gap-3 text-left transition-all ${selectedAddress?.id === address.id ? 'bg-green-500/20 border-2 border-green-500' : 'bg-[#242424] border-2 border-transparent'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAddress?.id === address.id ? 'bg-green-500' : 'bg-[#1a1a1a]'}`}>
                      {address.title === 'Ev' || address.title === 'Home' ? <Home className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{address.title}</p>
                      <p className="text-sm text-gray-400 truncate">{address.full_address}</p>
                    </div>
                    {selectedAddress?.id === address.id && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {!isMinimumMet && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{t.cart?.minimumOrder || 'Minimum sipariş'}: ₺{minimumOrderAmount}</p>
              </div>
            )}

            {selectedAddress && (
              <div className="mt-3 p-3 bg-green-500/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400">
                  <Bike className="w-5 h-5" />
                  <span className="text-sm">{t.cart?.deliveryFee || 'Teslimat Ücreti'}</span>
                </div>
                <span className="font-bold text-green-400">₺{deliveryFee}</span>
              </div>
            )}
          </div>
        )}

        {/* Ürünler */}
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="font-semibold">{t.cart?.yourOrder || 'Siparişiniz'}</h3>
          </div>
          {items.map(item => (
            <div key={item.id} className="p-4 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  {item.options && item.options.length > 0 && <p className="text-xs text-gray-500 mt-0.5">{item.options.map((o: any) => o.choice).join(', ')}</p>}
                  <p className="text-orange-500 text-sm mt-1">₺{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sipariş Notu */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4">
          <h3 className="font-semibold mb-3">{t.cart?.orderNote || 'Sipariş Notu'}</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.cart?.notePlaceholder || 'Özel isteklerinizi yazın...'} rows={2} className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 px-4 text-white resize-none" />
        </div>

        {/* Bahşiş */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t.cart?.tip || 'Bahşiş'}</h3>
            {tipAmount > 0 && <span className="text-green-500 text-sm">+₺{tipAmount}</span>}
          </div>
          <div className="flex gap-2 mb-3">
            {tipOptions.map(percent => (
              <button type="button" key={percent} onClick={() => { setTipPercent(percent); setCustomTip('') }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tipPercent === percent && !customTip ? 'bg-green-500 text-white' : 'bg-[#242424] text-gray-400'}`}>
                {percent === 0 ? (t.cart?.noTip || 'Yok') : `%${percent}`}
              </button>
            ))}
          </div>
          <input type="number" value={customTip} onChange={(e) => { setCustomTip(e.target.value); setTipPercent(0) }} placeholder={t.cart?.customTipAmount || 'Özel tutar (₺)'} className="w-full bg-[#242424] border border-white/10 rounded-xl py-2 px-4 text-white text-sm" />
        </div>

        {/* Ödeme Yöntemi */}
        <div className="bg-[#1a1a1a] rounded-2xl p-4">
          <h3 className="font-semibold mb-3">{t.cart?.paymentMethod || 'Ödeme Yöntemi'}</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', icon: Wallet, label: t.cart?.cash || 'Nakit' },
              { id: 'card', icon: CreditCard, label: t.cart?.card || 'Kart' },
              { id: 'tit_pay', icon: Wallet, label: 'TiT Pay' }
            ].map(method => (
              <button type="button" key={method.id} onClick={() => setPaymentMethod(method.id as any)} className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${paymentMethod === method.id ? 'bg-orange-500 text-white' : 'bg-[#242424] text-gray-400'}`}>
                <method.icon className="w-5 h-5" />
                <span className="text-xs">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hesap Bölme */}
        <button type="button" onClick={() => setShowSplitModal(true)} className="w-full bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">{t.cart?.splitBill || 'Hesabı Böl'}</h3>
              <p className="text-sm text-gray-400">
                {splitCount > 1 ? `${splitCount} kişi • ₺${perPerson} / kişi` : t.cart?.dontSplit || 'Bölünmemiş'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-20 left-0 right-0 bg-[#1a1a1a] border-t border-white/10 p-4 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Ara Toplam</span><span>₺{totalPrice}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">KDV (%8)</span><span>₺{tax}</span></div>
          {tipAmount > 0 && <div className="flex justify-between text-green-400"><span>Bahşiş</span><span>+₺{tipAmount}</span></div>}
          {orderType === 'delivery' && deliveryFee > 0 && <div className="flex justify-between text-green-400"><span>Teslimat</span><span>+₺{deliveryFee}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10"><span>Toplam</span><span className="text-orange-500">₺{total}</span></div>
          {splitCount > 1 && <div className="flex justify-between text-purple-400 text-sm"><span>Kişi başı</span><span>₺{perPerson}</span></div>}
        </div>

        <button type="button" onClick={handleOrder} disabled={loading || !isMinimumMet || items.length === 0} className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" />{t.cart?.placeOrder || 'Sipariş Ver'} • ₺{total}</>}
        </button>
      </div>

      {/* Split Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{t.cart?.splitBill || 'Hesabı Böl'}</h2>
              <button type="button" onClick={() => setShowSplitModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <p className="text-center text-gray-400 mb-4">{t.cart?.howManyPeople || 'Kaç kişisiniz?'}</p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <button type="button" onClick={() => setSplitCount(Math.max(1, splitCount - 1))} className="w-14 h-14 bg-[#242424] rounded-full flex items-center justify-center"><Minus className="w-6 h-6" /></button>
              <span className="text-5xl font-bold w-20 text-center">{splitCount}</span>
              <button type="button" onClick={() => setSplitCount(Math.min(20, splitCount + 1))} className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center"><Plus className="w-6 h-6" /></button>
            </div>
            {splitCount > 1 && (
              <div className="bg-purple-500/20 rounded-xl p-4 text-center mb-6">
                <p className="text-purple-400 text-sm">Kişi Başı</p>
                <p className="text-3xl font-bold text-purple-400">₺{perPerson}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setSplitCount(1); setShowSplitModal(false) }} className="py-3 bg-[#242424] rounded-xl font-medium">Bölme</button>
              <button type="button" onClick={() => setShowSplitModal(false)} className="py-3 bg-orange-500 rounded-xl font-medium">Tamam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}