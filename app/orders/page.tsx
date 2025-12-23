'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Clock, CheckCircle, XCircle, ChefHat, Package, Bell, RefreshCw, Receipt, TrendingUp, AlertTriangle } from 'lucide-react'
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

interface ActiveBill {
  id: string
  order_number: string
  venue_name: string
  table_number: string
  total: number
  spending_limit?: number
  status: string
  items_count: number
  created_at: string
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [activeBill, setActiveBill] = useState<ActiveBill | null>(null)
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
    if (!authLoading) {
      if (user) {
        loadOrders()
        loadActiveBill()
        
        // Real-time subscription
        const channel = supabase
          .channel('customer-orders')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
            () => {
              loadOrders()
              loadActiveBill()
            }
          )
          .subscribe()
        return () => { supabase.removeChannel(channel) }
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  const loadActiveBill = async () => {
    if (!user) return
    
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        venues (name, spending_limit),
        order_items (id)
      `)
      .eq('customer_id', user.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (orders) {
      setActiveBill({
        id: orders.id,
        order_number: orders.order_number,
        venue_name: orders.venues?.name || 'Mekan',
        table_number: orders.table_number || '-',
        total: orders.total || 0,
        spending_limit: orders.venues?.spending_limit,
        status: orders.status,
        items_count: orders.order_items?.length || 0,
        created_at: orders.created_at
      })
    } else {
      setActiveBill(null)
    }
  }

  const loadOrders = async () => {
    if (!user) return
    setLoading(true)
    
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
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

  const calculateDuration = (dateString: string) => {
    const start = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `${diffMins} dk`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours} sa ${mins} dk`
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(o.status))
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <ShoppingBag className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">{t.orders.noOrders}</h2>
        <p className="text-gray-400 text-center mb-6">Siparişlerinizi görmek için giriş yapın</p>
        <button 
          onClick={() => router.push('/auth')}
          className="px-6 py-3 bg-orange-500 rounded-xl font-semibold"
        >
          Giriş Yap
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">{t.orders.myOrders}</h1>
          <button onClick={loadOrders} className="p-2 hover:bg-white/10 rounded-full">
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Active Bill Banner */}
      {activeBill && (
        <div className="p-4">
          <button
            onClick={() => router.push('/bill')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-left relative overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/50 to-red-600/50 animate-pulse" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t.orders.openBill}</h3>
                    <p className="text-sm text-white/80">{activeBill.venue_name} • Masa {activeBill.table_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₺{activeBill.total.toLocaleString()}</p>
                  <p className="text-xs text-white/70">{activeBill.items_count} ürün</p>
                </div>
              </div>

              {/* Spending Limit Progress */}
              {activeBill.spending_limit && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">Harcama Limiti</span>
                    <span>₺{activeBill.spending_limit.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        activeBill.total >= activeBill.spending_limit ? 'bg-red-400' :
                        activeBill.total >= activeBill.spending_limit * 0.8 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min((activeBill.total / activeBill.spending_limit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-white/70">
                    <span>Kalan: ₺{Math.max(0, activeBill.spending_limit - activeBill.total).toLocaleString()}</span>
                    <span>{calculateDuration(activeBill.created_at)}</span>
                  </div>
                </div>
              )}

              {/* Live indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/70">Canlı</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-[#1a1a1a] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'active' ? 'bg-orange-500 text-white' : 'text-gray-400'
            }`}
          >
            {t.orders.activeOrders} ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'past' ? 'bg-orange-500 text-white' : 'text-gray-400'
            }`}
          >
            {t.orders.pastOrders} ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 space-y-3">
        {displayOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {activeTab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
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
                className="w-full bg-[#1a1a1a] rounded-xl p-4 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">#{order.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <span className="font-bold text-orange-500">₺{order.total?.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{order.venue_name}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                
                {order.table_number && (
                  <p className="text-xs text-gray-500 mt-1">
                    {typeLabels[order.type] || order.type} • Masa {order.table_number}
                  </p>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
