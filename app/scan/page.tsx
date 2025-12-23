'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Minus, Plus, ShoppingCart, X, Send, Lock, QrCode, Camera, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Html5Qrcode } from 'html5-qrcode'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface Venue {
  id: string
  name: string
  slug: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

function ScanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const venueSlug = searchParams.get('venue')
  const tableFromUrl = searchParams.get('table')
  
  const [venue, setVenue] = useState<Venue | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [tableNumber] = useState(tableFromUrl || '')
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState('')
  const [ordering, setOrdering] = useState(false)
  
  // QR Scanner states
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  
  const canOrder = !!venueSlug && !!tableFromUrl

  useEffect(() => {
    if (venueSlug) {
      loadVenueAndMenu(venueSlug)
    } else {
      setLoading(false)
    }
    
    return () => {
      stopScanner()
    }
  }, [venueSlug])

  const loadVenueAndMenu = async (slug: string) => {
    const { data: venueData } = await supabase
      .from('venues')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!venueData) {
      setLoading(false)
      return
    }

    setVenue(venueData)

    const { data: categoriesData } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('venue_id', venueData.id)
      .eq('is_active', true)
      .order('display_order')

    const { data: itemsData } = await supabase
      .from('menu_items')
      .select('*')
      .eq('venue_id', venueData.id)
      .eq('is_available', true)

    const cats: MenuCategory[] = (categoriesData || []).map(cat => ({
      ...cat,
      items: (itemsData || []).filter(item => item.category_id === cat.id)
    }))

    setCategories(cats)
    if (cats.length > 0) setSelectedCategory(cats[0].id)
    setLoading(false)
  }

  const startScanner = async () => {
    setScanError(null)
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
    } catch (err) {
      setCameraPermission('denied')
      setScanError('Kamera izni gerekli. Lütfen tarayıcı ayarlarından kamera iznini verin.')
      return
    }

    setIsScanning(true)
    
    try {
      const html5Qrcode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5Qrcode
      
      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQRCodeScanned(decodedText)
        },
        () => {}
      )
    } catch (err: any) {
      console.error('Scanner error:', err)
      setScanError('Kamera başlatılamadı. Lütfen tekrar deneyin.')
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        console.error('Stop scanner error:', err)
      }
    }
    setIsScanning(false)
  }

  const handleQRCodeScanned = (decodedText: string) => {
    stopScanner()
    
    // QR içeriğini parse et
    // Beklenen format: https://order-app-customer.vercel.app/scan?venue=slug&table=5
    // veya: order://venue/slug/table/5
    try {
      let venueSlug = ''
      let tableNum = ''
      
      if (decodedText.includes('scan?')) {
        const url = new URL(decodedText)
        venueSlug = url.searchParams.get('venue') || ''
        tableNum = url.searchParams.get('table') || ''
      } else if (decodedText.includes('order://')) {
        const parts = decodedText.replace('order://', '').split('/')
        venueSlug = parts[1] || ''
        tableNum = parts[3] || ''
      } else {
        // Sadece venue slug olabilir
        venueSlug = decodedText
      }
      
      if (venueSlug) {
        const params = new URLSearchParams()
        params.set('venue', venueSlug)
        if (tableNum) params.set('table', tableNum)
        router.push(`/scan?${params.toString()}`)
      } else {
        setScanError('Geçersiz QR kod. Lütfen mekan QR kodunu okutun.')
      }
    } catch (err) {
      setScanError('QR kod okunamadı. Lütfen tekrar deneyin.')
    }
  }

  const addToCart = (item: MenuItem) => {
    if (!canOrder) return
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

  const getItemQuantity = (itemId: string) => cart.find(i => i.id === itemId)?.quantity || 0
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (!venue || cart.length === 0 || !tableNumber) return

    setOrdering(true)
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`
    const tax = Math.round(cartTotal * 0.08)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        venue_id: venue.id,
        order_number: orderNumber,
        table_number: tableNumber,
        type: 'dine_in',
        status: 'pending',
        payment_status: 'pending',
        subtotal: cartTotal,
        tax: tax,
        total: cartTotal + tax,
        customer_name: customerName || 'Misafir',
        notes: note || null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          status: 'pending'
        }))
      })
      .select()
      .single()

    if (error) {
      alert('Sipariş oluşturulamadı: ' + error.message)
      setOrdering(false)
      return
    }

    await supabase
      .from('tables')
      .update({ status: 'occupied' })
      .eq('venue_id', venue.id)
      .eq('table_number', tableNumber)

    setPlacedOrderId(order.id)
    setOrderPlaced(true)
    setCart([])
    setShowCart(false)
    setOrdering(false)
  }

  // QR Scanner UI
  if (!venueSlug) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        {/* Header with back button */}
        <header className="p-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">QR Kod Tara</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {isScanning ? (
            <div className="w-full max-w-sm">
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden mb-4" />
              <button 
                onClick={stopScanner}
                className="w-full py-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-500 font-medium"
              >
                Taramayı Durdur
              </button>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                <QrCode className="w-12 h-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">QR Kod Okutun</h2>
              <p className="text-gray-400 text-center mb-8">Sipariş vermek için masanızdaki QR kodu okutun</p>
              
              {scanError && (
                <div className="w-full max-w-sm mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{scanError}</p>
                </div>
              )}
              
              <button 
                onClick={startScanner}
                className="w-full max-w-sm py-4 bg-orange-500 rounded-xl font-semibold flex items-center justify-center gap-2 mb-4"
              >
                <Camera className="w-5 h-5" />
                Kamerayı Aç
              </button>
              
              <button 
                onClick={() => router.push('/discover')} 
                className="w-full max-w-sm py-4 bg-[#1a1a1a] border border-white/10 rounded-xl font-medium"
              >
                Mekanları Keşfet
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Mekan Bulunamadı</h2>
        <p className="text-gray-400 mb-6">QR kod geçersiz veya mekan artık aktif değil.</p>
        <button 
          onClick={() => router.push('/scan')} 
          className="px-6 py-3 bg-orange-500 rounded-xl font-medium"
        >
          Tekrar Tara
        </button>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Send className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Siparişiniz Alındı!</h1>
        <p className="text-gray-400 mb-1">{venue.name}</p>
        <p className="text-gray-400 mb-6">Masa {tableNumber}</p>
        <p className="text-orange-500 font-mono mb-8">#{placedOrderId.slice(0, 8)}</p>
        <div className="w-full max-w-sm space-y-3">
          <button onClick={() => setOrderPlaced(false)} className="w-full py-4 bg-orange-500 rounded-xl font-semibold">
            Yeni Sipariş Ver
          </button>
          <button onClick={() => router.push('/orders')} className="w-full py-4 bg-[#1a1a1a] border border-white/10 rounded-xl">
            Siparişlerimi Gör
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold">{venue.name}</h1>
              <p className="text-sm text-gray-400">{canOrder ? `Masa ${tableNumber}` : 'Sadece Menü'}</p>
            </div>
          </div>
          {canOrder && (
            <button onClick={() => setShowCart(true)} className="relative w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">{cartCount}</span>}
            </button>
          )}
        </div>
      </header>

      {!canOrder && (
        <div className="mx-4 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-500" />
          <p className="text-amber-500 text-sm">Sipariş için QR okutun</p>
        </div>
      )}

      <div className="sticky top-[73px] z-30 bg-[#0a0a0a] border-b border-white/5">
        <div className="flex overflow-x-auto py-3 px-4 gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${selectedCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {categories.filter(cat => cat.id === selectedCategory).map(cat => (
          <div key={cat.id} className="space-y-3">
            <h2 className="text-lg font-bold mb-4">{cat.name}</h2>
            {cat.items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Bu kategoride ürün yok</p>
            ) : (
              cat.items.map(item => {
                const qty = getItemQuantity(item.id)
                return (
                  <div key={item.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      {item.description && <p className="text-gray-400 text-sm mb-2 line-clamp-2">{item.description}</p>}
                      <p className="text-orange-500 font-bold">₺{item.price}</p>
                    </div>
                    {canOrder ? (
                      qty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                          <span className="w-6 text-center">{qty}</span>
                          <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} className="px-4 py-2 bg-orange-500 rounded-lg text-sm font-medium">Ekle</button>
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        ))}
      </div>

      {canOrder && cartCount > 0 && !showCart && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <button onClick={() => setShowCart(true)} className="w-full py-4 bg-orange-500 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg">
            <ShoppingCart className="w-5 h-5" />
            Sepeti Gör ({cartCount}) - ₺{cartTotal}
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full max-h-[80vh] bg-[#1a1a1a] rounded-t-3xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-xl font-bold">Sepetim</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#242424] rounded-xl p-3">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-orange-500">₺{item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, description: '', category_id: '' })} className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <input type="text" placeholder="İsminiz (opsiyonel)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 bg-[#242424] rounded-xl border border-white/5 outline-none" />
              <input type="text" placeholder="Sipariş notu (opsiyonel)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-4 py-3 bg-[#242424] rounded-xl border border-white/5 outline-none" />
            </div>
            <div className="p-4 border-t border-white/5">
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">Toplam</span>
                <span className="text-2xl font-bold">₺{cartTotal}</span>
              </div>
              <button onClick={handlePlaceOrder} disabled={ordering} className="w-full py-4 bg-orange-500 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {ordering ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-5 h-5" />Siparişi Gönder</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ScanPageContent />
    </Suspense>
  )
}
