'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, ChefHat, Package, Truck, Receipt, CreditCard, Bell, RefreshCcw, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/CartContext'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  options?: any[]
}

interface Order {
  id: string
  order_number: string
  venue_id: string
  venue_name?: string
  table_number?: string
  status: string
  total: number
  items: OrderItem[]
  created_at: string
}

export default function MyOrdersPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)

  const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    pending: { label: t.orders?.statusPending || 'Onay Bekliyor', color: 'text-amber-500', bg: 'bg-amber-500/20', icon: Clock },
    confirmed: { label: t.orders?.statusConfirmed || 'Onaylandı', color: 'text-blue-500', bg: 'bg-blue-500/20', icon: CheckCircle },
    preparing: { label: t.orders?.statusPreparing || 'Hazırlanıyor', color: 'text-purple-500', bg: 'bg-purple-500/20', icon: ChefHat },
    ready: { label: t.orders?.statusReady || 'Hazır', color: 'text-green-500', bg: 'bg-green-500/20', icon: Package },
    delivered: { label: t.orders?.statusDelivered || 'Teslim Edildi', color: 'text-emerald-500', bg: 'bg-emerald-500/20', icon: Truck },
    bill_requested: { label: t.orders?.statusBillRequested || 'Hesap İstendi', color: 'text-pink-500', bg: 'bg-pink-500/20', icon: Bell },
    paid: { label: t.orders?.statusPaid || 'Ödendi', color: 'text-gray-500', bg: 'bg-gray-500/20', icon: CreditCard },
    cancelled: { label: t.orders?.statusCancelled || 'İptal Edildi', color: 'text-red-500', bg: 'bg-red-500/20', icon: Clock },
  }

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 5000)
    return () => clearInterval(interval)
  }, [user])

  const loadOrders = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      // Venue isimlerini al
      const venueIds = Array.from(new Set(data.map(o => o.venue_id).filter(Boolean)))
      let venueMap: Record<string, string> = {}
      
      if (venueIds.length > 0) {
        const { data: venues } = await supabase
          .from('venues')
          .select('id, name')
          .in('id', venueIds)
        
        venues?.forEach(v => { venueMap[v.id] = v.name })
      }

      const ordersWithVenue = data.map(o => ({
        ...o,
        venue_name: venueMap[o.venue_id] || 'Mekan'
      }))

      setOrders(ordersWithVenue)
    }
    setLoading(false)
  }

  const activeOrders = orders.filter(o => !['paid', 'cancelled', 'completed'].includes(o.status))
  const pastOrders = orders.filter(o => ['paid', 'cancelled', 'completed'].includes(o.status))
  const totalBill = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  const handleRequestBill = async () => {
    for (const order of activeOrders) {
      await supabase.from('orders').update({ status: 'bill_requested' }).eq('id', order.id)
    }
    alert(t.orders?.billRequested || 'Hesap istendi! Garson masanıza gelecek.')
    loadOrders()
  }

  const handlePayment = async (method: 'card' | 'tit_pay') => {
    for (const order of activeOrders) {
      await supabase.from('orders').update({ status: 'paid', payment_method: method }).eq('id', order.id)
    }
    setShowPayment(false)
    alert(method === 'tit_pay' 
      ? (t.orders?.titPaySuccess || 'TiT Pay ile ödeme başarılı!') 
      : (t.orders?.cardPaySuccess || 'Kredi kartı ile ödeme başarılı!'))
    loadOrders()
  }

  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) {
      alert(t.orders?.noItemsToReorder || 'Bu siparişte ürün bulunamadı')
      return
    }

    // Ürünleri sepete ekle
    order.items.forEach(item => {
      addItem({
        id: `reorder-${Date.now()}-${Math.random()}`,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity || 1,
        options: item.options || []
      }, order.venue_id, order.venue_name || 'Mekan')
    })

    router.push('/cart')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t.auth?.loginRequired || 'Giriş Yapın'}</h2>
          <p className="text-gray-400 mb-4">{t.orders?.loginToSee || 'Siparişlerinizi görmek için giriş yapın'}</p>
          <button type="button" onClick={() => router.push('/auth')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
            {t.auth?.login || 'Giriş Yap'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{t.orders?.myOrders || 'Siparişlerim'}</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Açık Hesap */}
          {activeOrders.length > 0 && (
            <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl border border-orange-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-orange-500" />
                  <span className="font-semibold">{t.orders?.openBill || 'Açık Hesap'}</span>
                </div>
                <span className="text-xl font-bold text-orange-500">₺{totalBill}</span>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  onClick={handleRequestBill}
                  className="flex-1 py-2 bg-orange-500/30 rounded-xl text-sm font-medium"
                >
                  {t.orders?.requestBill || 'Hesap İste'}
                </button>
                <button type="button"
                  onClick={() => setShowPayment(true)}
                  className="flex-1 py-2 bg-green-500/30 rounded-xl text-sm font-medium text-green-400"
                >
                  {t.orders?.payNow || 'Şimdi Öde'}
                </button>
              </div>
            </div>
          )}

          {/* Aktif Siparişler */}
          {activeOrders.length > 0 && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-3">{t.orders?.activeOrders || 'Aktif Siparişler'}</h2>
              <div className="space-y-3">
                {activeOrders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  return (
                    <div key={order.id} className="bg-[#1a1a1a] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-orange-500">#{order.order_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{order.venue_name}</p>
                      <div className="text-sm text-gray-300">
                        {Array.isArray(order.items) && order.items.slice(0, 3).map((item, i) => (
                          <span key={i}>
                            {item.quantity}x {item.name}
                            {i < Math.min(order.items.length, 3) - 1 && ', '}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <span className="text-gray-400 text-sm">{formatDate(order.created_at)}</span>
                        <span className="font-bold">₺{order.total}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Geçmiş Siparişler */}
          {pastOrders.length > 0 && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-3">{t.orders?.pastOrders || 'Geçmiş Siparişler'}</h2>
              <div className="space-y-3">
                {pastOrders.map(order => {
                  const status = statusConfig[order.status] || statusConfig.paid
                  return (
                    <div key={order.id} className="bg-[#1a1a1a] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">#{order.order_number}</span>
                        <span className={`text-xs ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-sm text-gray-400">{order.venue_name}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <span className="text-gray-400 text-sm">{formatDate(order.created_at)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">₺{order.total}</span>
                          <button type="button"
                            onClick={() => handleReorder(order)}
                            className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-lg text-sm"
                          >
                            {t.orders?.reorder || 'Tekrarla'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Boş Durum */}
          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <ShoppingBag className="w-16 h-16 text-gray-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">{t.orders?.noOrders || 'Henüz sipariş yok'}</h2>
              <p className="text-gray-400">{t.orders?.startOrdering || 'Hemen sipariş vermeye başlayın'}</p>
            </div>
          )}
        </>
      )}

      {/* Ödeme Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-[#1a1a1a] rounded-t-3xl p-6">
            <h2 className="text-xl font-bold mb-4">{t.orders?.paymentMethod || 'Ödeme Yöntemi'}</h2>
            <div className="space-y-3">
              <button type="button"
                onClick={() => handlePayment('card')}
                className="w-full p-4 bg-[#242424] rounded-xl flex items-center gap-3"
              >
                <CreditCard className="w-6 h-6 text-blue-500" />
                <span>{t.orders?.payWithCard || 'Kredi Kartı ile Öde'}</span>
              </button>
              <button type="button"
                onClick={() => handlePayment('tit_pay')}
                className="w-full p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center gap-3 border border-purple-500/30"
              >
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">T</div>
                <span>TiT Pay ile Öde</span>
              </button>
            </div>
            <button type="button"
              onClick={() => setShowPayment(false)}
              className="w-full mt-4 py-3 text-gray-400"
            >
              {t.common?.cancel || 'İptal'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}