'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import {
  Receipt, Clock, MapPin, CreditCard, QrCode, 
  ChevronRight, Loader2, Plus, Minus, X, Check,
  Wallet, Phone, Bell, User
} from 'lucide-react'

interface ActiveOrder {
  id: string
  order_number: string
  venue_id: string
  venue_name: string
  venue_emoji: string
  table_number: string
  status: string
  items: any[]
  subtotal: number
  tax: number
  total: number
  created_at: string
}

export default function BillPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [callingWaiter, setCallingWaiter] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (user) {
      loadActiveOrder()
      // Real-time subscription
      const channel = supabase
        .channel('active-order')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, () => {
          loadActiveOrder()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      setLoading(false)
    }
  }, [user])

  const loadActiveOrder = async () => {
    if (!user) return
    
    try {
      // Get active orders (not completed/cancelled)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, venue_id, table_number, status, 
          items, subtotal, tax, total, created_at
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (orders && orders.length > 0) {
        const order = orders[0]
        
        // Get venue info
        const { data: venue } = await supabase
          .from('venues')
          .select('name, emoji')
          .eq('id', order.venue_id)
          .single()

        setActiveOrder({
          ...order,
          venue_name: venue?.name || 'Mekan',
          venue_emoji: venue?.emoji || '🍽️'
        })
      } else {
        setActiveOrder(null)
      }
    } catch (err) {
      console.error('Aktif sipariş yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const callWaiter = async () => {
    if (!activeOrder) return
    setCallingWaiter(true)
    
    // Simulate waiter call - in real app, this would notify the business app
    setTimeout(() => {
      setCallingWaiter(false)
      alert('Garson çağrıldı! Kısa süre içinde masanıza gelecek.')
    }, 1000)
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      pending: { text: 'Onay Bekliyor', color: 'text-yellow-500' },
      confirmed: { text: 'Onaylandı', color: 'text-blue-500' },
      preparing: { text: 'Hazırlanıyor', color: 'text-purple-500' },
      ready: { text: 'Hazır', color: 'text-green-500' },
      served: { text: 'Servis Edildi', color: 'text-green-500' }
    }
    return labels[status] || { text: status, color: 'text-gray-500' }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const getElapsedTime = (dateString: string) => {
    const start = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
    if (diff < 60) return `${diff} dk`
    return `${Math.floor(diff / 60)} saat ${diff % 60} dk`
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // No active order
  if (!activeOrder) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        <div className="p-4 pt-8">
          <h1 className="text-2xl font-bold mb-2">Canlı Hesap</h1>
          <p className="text-gray-400">Aktif siparişinizi buradan takip edin</p>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
            <Receipt className="w-12 h-12 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Aktif Hesap Yok</h2>
          <p className="text-gray-400 text-center mb-8">
            Bir mekanda sipariş verdiğinizde hesabınız burada görünecek.
          </p>
          
          <button type="button"
            onClick={() => router.push('/scan')}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl font-bold"
          >
            <QrCode className="w-6 h-6" />
            QR Kod Tara
          </button>
          
          <button type="button"
            onClick={() => router.push('/discover')}
            className="mt-4 text-orange-500"
          >
            veya mekan keşfet
          </button>
        </div>

        {/* Past Orders Link */}
        <div className="px-4">
          <button type="button"
            onClick={() => router.push('/orders')}
            className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>Geçmiş Siparişler</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    )
  }

  // Active order view
  const statusInfo = getStatusLabel(activeOrder.status)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 pt-8 pb-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-200 text-sm">Aktif Hesap</p>
            <h1 className="text-2xl font-bold">{activeOrder.order_number}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Canlı</span>
          </div>
        </div>

        {/* Venue Info */}
        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
          <span className="text-3xl">{activeOrder.venue_emoji}</span>
          <div className="flex-1">
            <p className="font-semibold">{activeOrder.venue_name}</p>
            <p className="text-sm text-green-200">Masa {activeOrder.table_number}</p>
          </div>
          <div className="text-right">
            <p className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</p>
            <p className="text-xs text-green-200">{getElapsedTime(activeOrder.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-4 -mt-4">
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Siparişler</h2>
              <span className="text-sm text-gray-400">{activeOrder.items?.length || 0} kalem</span>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {activeOrder.items?.map((item: any, index: number) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name || item.product_name}</p>
                  {item.notes && <p className="text-xs text-gray-400">{item.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold">₺{((item.price || item.unit_price) * (item.quantity || 1)).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">x{item.quantity || 1}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add More */}
          <button type="button"
            onClick={() => router.push(`/venue/${activeOrder.venue_id}/menu?table=${activeOrder.table_number}`)}
            className="w-full p-4 border-t border-white/10 flex items-center justify-center gap-2 text-orange-500"
          >
            <Plus className="w-5 h-5" />
            Sipariş Ekle
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="px-4 mt-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Ara Toplam</span>
            <span>₺{activeOrder.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">KDV</span>
            <span>₺{activeOrder.tax?.toLocaleString()}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-xl font-bold">
            <span>Toplam</span>
            <span className="text-green-500">₺{activeOrder.total?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <div className="flex gap-3">
          <button type="button"
            onClick={callWaiter}
            disabled={callingWaiter}
            className="flex-1 py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            {callingWaiter ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Bell className="w-5 h-5" />
                Garson Çağır
              </>
            )}
          </button>
          <button type="button"
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 py-4 bg-green-500 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Hesabı Öde
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          order={activeOrder}
          onClose={() => setShowPaymentModal(false)}
          onPay={async (method) => {
            // Process payment
            const { error } = await supabase
              .from('orders')
              .update({ 
                status: 'paid',
                payment_status: 'paid',
                payment_method: method 
              })
              .eq('id', activeOrder.id)

            if (!error) {
              setShowPaymentModal(false)
              setActiveOrder(null)
              router.push('/orders')
            }
          }}
        />
      )}
    </div>
  )
}

// Payment Modal
function PaymentModal({ order, onClose, onPay }: { order: ActiveOrder; onClose: () => void; onPay: (method: string) => void }) {
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [processing, setProcessing] = useState(false)

  const handlePay = async () => {
    setProcessing(true)
    await onPay(selectedMethod)
    setProcessing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-end">
      <div className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a1a]">
          <h2 className="text-lg font-bold">Ödeme Yap</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Total */}
          <div className="text-center py-4">
            <p className="text-gray-400">Ödenecek Tutar</p>
            <p className="text-4xl font-bold text-green-500">₺{order.total.toLocaleString()}</p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <button type="button"
              onClick={() => setSelectedMethod('tit_pay')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border ${
                selectedMethod === 'tit_pay' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-[#2a2a2a]'
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="font-bold">TiT</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">TiT Pay</p>
                <p className="text-xs text-gray-400">Anında ödeme</p>
              </div>
              {selectedMethod === 'tit_pay' && <Check className="w-5 h-5 text-purple-500" />}
            </button>

            <button type="button"
              onClick={() => setSelectedMethod('card')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border ${
                selectedMethod === 'card' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-[#2a2a2a]'
              }`}
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Kredi Kartı</p>
                <p className="text-xs text-gray-400">Kayıtlı kart ile öde</p>
              </div>
              {selectedMethod === 'card' && <Check className="w-5 h-5 text-orange-500" />}
            </button>

            <button type="button"
              onClick={() => setSelectedMethod('cash')}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border ${
                selectedMethod === 'cash' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-[#2a2a2a]'
              }`}
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Nakit</p>
                <p className="text-xs text-gray-400">Garsona öde</p>
              </div>
              {selectedMethod === 'cash' && <Check className="w-5 h-5 text-green-500" />}
            </button>
          </div>

          {/* Pay Button */}
          <button type="button"
            onClick={handlePay}
            disabled={processing}
            className="w-full py-4 bg-green-500 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Ödemeyi Tamamla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}