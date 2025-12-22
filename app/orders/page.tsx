'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Clock, CheckCircle, XCircle, ChefHat, Package, Bell, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Order {
  id: string
  order_number: string
  venue_id: string
  table_number: string
  type: string
  status: string
  total: number
  items: any[]
  notes: string
  created_at: string
  venue_name?: string
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, locale } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active')

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Beklemede', color: 'text-yellow-500 bg-yellow-500/10', icon: Clock },
    confirmed: { label: 'Onaylandı', color: 'text-blue-500 bg-blue-500/10', icon: CheckCircle },
    preparing: { label: 'Hazırlanıyor', color: 'text-orange-500 bg-orange-500/10', icon: ChefHat },
    ready: { label: 'Hazır', color: 'text-green-500 bg-green-500/10', icon: CheckCircle },
    served: { label: 'Teslim Edildi', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle },
    completed: { label: 'Tamamlandı', color: 'text-gray-500 bg-gray-500/10', icon: CheckCircle },
    cancelled: { label: 'İptal Edildi', color: 'text-red-500 bg-red-500/10', icon: XCircle },
  }

  const typeLabels: Record<string, string> = {
    dine_in: 'Masada',
    takeaway: 'Paket',
    delivery: 'Eve Servis'
  }

  useEffect(() => {
    // Auth yüklendikten sonra siparişleri yükle
    if (!authLoading) {
      if (user) {
        loadOrders()
        const channel = supabase
          .channel('customer-orders')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
            () => loadOrders()
          )
          .subscribe()
        return () => { supabase.removeChannel(channel) }
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  const loadOrders = async () => {
    if (!user) return
    setLoading(true)
    
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Orders fetch error:', error)
      setLoading(false)
      return
    }

    if (ordersData && ordersData.length > 0) {
      const venueIds = Array.from(new Set(ordersData.map(o => o.venue_id).filter(Boolean)))
      if (venueIds.length > 0) {
        const { data: venuesData } = await supabase.from('venues').select('id, name').in('id', venueIds)
        const venueMap: Record<string, string> = {}
        venuesData?.forEach(v => { venueMap[v.id] = v.name })
        ordersData.forEach(order => { order.venue_name = venueMap[order.venue_id] || 'Mekan' })
      }
      setOrders(ordersData)
    } else {
      setOrders([])
    }
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
  const pastOrders = orders.filter(o => ['served', 'completed', 'cancelled'].includes(o.status))
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders

  // Auth yüklenirken loading göster
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-gray-400 mb-4">Siparişlerinizi görmek için giriş yapın</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Siparişlerim</h1>
          </div>
          <button onClick={loadOrders} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-3">
        <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${activeTab === 'active' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
          >
            Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${activeTab === 'past' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
          >
            Geçmiş ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">
              {activeTab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'active' ? 'Yeni bir sipariş verin' : 'Henüz tamamlanmış sipariş yok'}
            </p>
          </div>
        ) : (
          displayOrders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = status.icon
            
            return (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full bg-[#1a1a1a] rounded-2xl p-4 text-left"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-orange-500">#{order.order_number}</p>
                    <p className="text-sm text-gray-400">{order.venue_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {typeLabels[order.type] || order.type}
                    {order.table_number && ` • Masa ${order.table_number}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(order.created_at)}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="text-sm text-gray-300 mb-3">
                  {Array.isArray(order.items) && order.items.slice(0, 3).map((item: any, i: number) => (
                    <span key={i}>
                      {item.quantity}x {item.name}
                      {i < Math.min(order.items.length, 3) - 1 && ', '}
                    </span>
                  ))}
                  {Array.isArray(order.items) && order.items.length > 3 && (
                    <span className="text-gray-500"> +{order.items.length - 3} ürün</span>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-gray-400">Toplam</span>
                  <span className="font-bold text-lg">₺{order.total}</span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
