'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, ChefHat, Check, Bell, MapPin, Phone, MessageCircle, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  status: 'pending' | 'preparing' | 'ready' | 'served'
}

interface Order {
  id: string
  order_number: string
  venue_id: string
  table_number: string
  type: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid'
  payment_method: string
  subtotal: number
  tax: number
  total: number
  notes?: string
  items: OrderItem[]
  created_at: string
  venue_name?: string
}

const statusSteps = [
  { key: 'pending', label: 'Alındı', icon: Bell, color: 'text-yellow-500' },
  { key: 'confirmed', label: 'Onaylandı', icon: Check, color: 'text-blue-500' },
  { key: 'preparing', label: 'Hazırlanıyor', icon: ChefHat, color: 'text-orange-500' },
  { key: 'ready', label: 'Hazır', icon: Check, color: 'text-green-500' },
  { key: 'served', label: 'Servis Edildi', icon: Check, color: 'text-green-500' },
]

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrder()
      
      // Realtime subscription
      const channel = supabase
        .channel(`order-${orderId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [orderId])

  const loadOrder = async () => {
    try {
      // Önce siparişi al
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error || !orderData) {
        console.error('Order fetch error:', error)
        setLoading(false)
        return
      }

      // Venue adını ayrı sorgula
      if (orderData.venue_id) {
        const { data: venueData } = await supabase
          .from('venues')
          .select('name')
          .eq('id', orderData.venue_id)
          .single()
        
        orderData.venue_name = venueData?.name || 'Mekan'
      }

      setOrder(orderData)
    } catch (err) {
      console.error('Load order error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!order) return 0
    const index = statusSteps.findIndex(s => s.key === order.status)
    return index >= 0 ? index : 0
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      case 'preparing': return 'bg-orange-500/20 text-orange-500'
      case 'ready': return 'bg-green-500/20 text-green-500'
      case 'served': return 'bg-gray-500/20 text-gray-500'
      default: return 'bg-gray-500/20 text-gray-500'
    }
  }

  const getItemStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor'
      case 'preparing': return 'Hazırlanıyor'
      case 'ready': return 'Hazır'
      case 'served': return 'Servis Edildi'
      default: return status
    }
  }

  const typeLabels: Record<string, string> = {
    dine_in: 'Masada',
    takeaway: 'Paket',
    delivery: 'Eve Servis'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Sipariş Bulunamadı</h2>
          <button onClick={() => router.push('/')} className="text-orange-500">
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  const currentStep = getCurrentStepIndex()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Sipariş Takip</h1>
            <p className="text-sm text-gray-400">#{order.order_number}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Venue & Order Info */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{order.venue_name || 'Mekan'}</h3>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                <Package className="w-4 h-4" />
                {typeLabels[order.type] || order.type}
                {order.table_number && ` • Masa ${order.table_number}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Sipariş Saati</p>
              <p className="font-medium">{formatTime(order.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Status Progress */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-4">Sipariş Durumu</h3>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#242424]" />
            <div 
              className="absolute left-5 top-0 w-0.5 bg-orange-500 transition-all duration-500"
              style={{ height: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
            />
            
            {/* Steps */}
            <div className="space-y-6">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStep
                const isCurrent = index === currentStep
                const Icon = step.icon
                
                return (
                  <div key={step.key} className="flex items-center gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      isCompleted 
                        ? 'bg-orange-500' 
                        : 'bg-[#242424]'
                    }`}>
                      <Icon className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                        {step.label}
                      </p>
                      {isCurrent && order.status !== 'completed' && (
                        <p className="text-sm text-orange-500 animate-pulse">Şu an burada</p>
                      )}
                    </div>
                    {isCompleted && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden">
          <h3 className="p-4 border-b border-white/5 font-semibold">
            Sipariş Detayı
          </h3>
          <div className="divide-y divide-white/5">
            {Array.isArray(order.items) && order.items.map((item, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500 font-bold">
                    {item.quantity}
                  </span>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-400">₺{item.price * item.quantity}</p>
                  </div>
                </div>
                {item.status && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                    {getItemStatusText(item.status)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-400">Sipariş Notu</p>
            <p className="mt-1">{order.notes}</p>
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold mb-3">Ödeme</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ara Toplam</span>
              <span>₺{order.subtotal || order.total}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">KDV</span>
                <span>₺{order.tax}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
              <span>Toplam</span>
              <span className="text-orange-500">₺{order.total}</span>
            </div>
          </div>
          {order.payment_method && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-400">Ödeme Yöntemi</span>
              <span className={order.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}>
                {order.payment_method === 'cash' ? '💵 Nakit' : 
                 order.payment_method === 'card' ? '💳 Kart' : '📱 TiT Pay'}
                {order.payment_status === 'paid' ? ' (Ödendi)' : ' (Bekliyor)'}
              </span>
            </div>
          )}
        </div>

        {/* Back to Orders Button */}
        <button
          onClick={() => router.push('/orders')}
          className="w-full py-4 bg-[#1a1a1a] border border-white/10 rounded-xl font-medium"
        >
          Siparişlerime Dön
        </button>
      </div>
    </div>
  )
}
