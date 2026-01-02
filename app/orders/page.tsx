'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Clock, CheckCircle, XCircle, ChefHat, Package, RefreshCw } from 'lucide-react'

interface LocalOrder {
  id: string
  order_number: string
  venue_id: string
  venue_name: string
  table_number?: string
  type: 'dine_in' | 'takeaway'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total: number
  items: { name: string; quantity: number; price: number }[]
  created_at: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active')

  const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    pending: { label: 'Beklemede', color: 'text-yellow-500', bg: 'bg-yellow-500/20', icon: Clock },
    confirmed: { label: 'Onaylandı', color: 'text-blue-500', bg: 'bg-blue-500/20', icon: CheckCircle },
    preparing: { label: 'Hazırlanıyor', color: 'text-orange-500', bg: 'bg-orange-500/20', icon: ChefHat },
    ready: { label: 'Hazır', color: 'text-green-500', bg: 'bg-green-500/20', icon: CheckCircle },
    completed: { label: 'Tamamlandı', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: CheckCircle },
    cancelled: { label: 'İptal', color: 'text-red-500', bg: 'bg-red-500/20', icon: XCircle },
  }

  useEffect(() => {
    setMounted(true)
    loadOrders()
  }, [])

  const loadOrders = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('user_orders')
      if (stored) {
        const parsed = JSON.parse(stored) as LocalOrder[]
        setOrders(parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      }
    } catch (e) {
      console.error('Orders load error:', e)
    }
    setLoading(false)
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Siparişlerim</h1>
          <button type="button" onClick={loadOrders} className="p-2 hover:bg-white/10 rounded-full">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-4 gap-2">
          <button type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400'
            }`}
          >
            Aktif Siparişler ({activeOrders.length})
          </button>
          <button type="button"
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400'
            }`}
          >
            Geçmiş Siparişler ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400">
              {activeTab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
            </p>
          </div>
        ) : (
          displayOrders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = status.icon
            
            return (
              <div
                key={order.id}
                className="bg-[#1a1a1a] rounded-2xl p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{order.venue_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-500">₺{order.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                {/* Order Type */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {order.type === 'dine_in' ? (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Masa {order.table_number}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Paket Sipariş</span>
                    </>
                  )}
                </div>

                {/* Items Preview */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    {order.items.slice(0, 3).map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    {order.items.length > 3 && ` +${order.items.length - 3} ürün daha`}
                  </p>
                </div>

                {/* Actions for active orders */}
                {activeTab === 'active' && (
                  <div className="pt-2">
                    <button type="button"
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="w-full py-2 bg-orange-500/20 text-orange-500 rounded-xl text-sm font-medium"
                    >
                      Detayları Gör
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}