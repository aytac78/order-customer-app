'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Receipt, 
  Clock, 
  MapPin, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Bell,
  CreditCard,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  status: 'pending' | 'preparing' | 'ready' | 'served'
  notes?: string
}

interface ActiveBill {
  id: string
  order_number: string
  venue_id: string
  venue_name: string
  venue_logo?: string
  table_number: string
  status: string
  items: OrderItem[]
  subtotal: number
  tax: number
  service_charge: number
  discount: number
  total: number
  spending_limit?: number
  created_at: string
  updated_at: string
}

export default function BillPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [bill, setBill] = useState<ActiveBill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadActiveBill()
      
      // Real-time subscription
      const channel = supabase
        .channel('active-bill')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Order updated:', payload)
            loadActiveBill() // Yeniden yükle
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_items',
          },
          (payload) => {
            console.log('Order item updated:', payload)
            loadActiveBill()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const loadActiveBill = async () => {
    if (!user) return
    
    try {
      // Aktif siparişi bul (pending, confirmed, preparing, ready, served - completed veya cancelled değil)
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          venues (
            id,
            name,
            logo_url,
            spending_limit
          ),
          order_items (*)
        `)
        .eq('customer_id', user.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (orderError && orderError.code !== 'PGRST116') {
        console.error('Order fetch error:', orderError)
      }

      if (orders) {
        setBill({
          id: orders.id,
          order_number: orders.order_number,
          venue_id: orders.venue_id,
          venue_name: orders.venues?.name || 'Mekan',
          venue_logo: orders.venues?.logo_url,
          table_number: orders.table_number || '-',
          status: orders.status,
          items: orders.order_items || [],
          subtotal: orders.subtotal || 0,
          tax: orders.tax || 0,
          service_charge: orders.service_charge || 0,
          discount: orders.discount || 0,
          total: orders.total || 0,
          spending_limit: orders.venues?.spending_limit,
          created_at: orders.created_at,
          updated_at: orders.updated_at
        })
      } else {
        setBill(null)
      }
    } catch (err) {
      console.error('Load bill error:', err)
      setError('Hesap bilgisi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Onay Bekliyor', color: 'text-yellow-500', bg: 'bg-yellow-500/20' }
      case 'confirmed':
        return { label: 'Onaylandı', color: 'text-blue-500', bg: 'bg-blue-500/20' }
      case 'preparing':
        return { label: 'Hazırlanıyor', color: 'text-purple-500', bg: 'bg-purple-500/20' }
      case 'ready':
        return { label: 'Hazır', color: 'text-green-500', bg: 'bg-green-500/20' }
      case 'served':
        return { label: 'Servis Edildi', color: 'text-emerald-500', bg: 'bg-emerald-500/20' }
      default:
        return { label: status, color: 'text-gray-500', bg: 'bg-gray-500/20' }
    }
  }

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'preparing':
        return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
      case 'ready':
        return <Bell className="w-4 h-4 text-green-500" />
      case 'served':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Hesap yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Giriş Yapın</h2>
          <p className="text-gray-400 mb-6">Hesabınızı takip etmek için giriş yapın</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-3 bg-orange-500 rounded-xl font-semibold"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-4 p-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Açık Hesabım</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 mt-20">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Receipt className="w-12 h-12 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Açık Hesap Yok</h2>
          <p className="text-gray-400 text-center mb-6">
            Şu anda aktif bir hesabınız bulunmuyor.<br/>
            Bir mekanda QR kod okutarak sipariş verin.
          </p>
          <button
            onClick={() => router.push('/scan')}
            className="px-6 py-3 bg-orange-500 rounded-xl font-semibold"
          >
            QR Kod Tara
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(bill.status)
  const limitUsagePercent = bill.spending_limit 
    ? Math.min((bill.total / bill.spending_limit) * 100, 100) 
    : 0
  const isNearLimit = bill.spending_limit && bill.total >= bill.spending_limit * 0.8
  const isOverLimit = bill.spending_limit && bill.total >= bill.spending_limit

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Açık Hesabım</h1>
              <p className="text-sm text-gray-400">Canlı Takip</p>
            </div>
          </div>
          <button 
            onClick={loadActiveBill}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Venue & Table Info */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{bill.venue_name}</h2>
                <p className="text-sm text-gray-400">Masa {bill.table_number}</p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full ${statusInfo.bg}`}>
              <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Başlangıç: {formatTime(bill.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Süre: {calculateDuration(bill.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Limit Warning */}
      {bill.spending_limit && (
        <div className="px-4 mb-4">
          <div className={`rounded-2xl p-4 ${isOverLimit ? 'bg-red-500/20 border border-red-500/50' : isNearLimit ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-[#1a1a1a]'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isOverLimit ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : isNearLimit ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <CreditCard className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium">Harcama Limiti</span>
              </div>
              <span className={`font-bold ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : ''}`}>
                ₺{bill.total.toLocaleString()} / ₺{bill.spending_limit.toLocaleString()}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${limitUsagePercent}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-400">Kullanılan: %{Math.round(limitUsagePercent)}</span>
              <span className={isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-green-400'}>
                Kalan: ₺{Math.max(0, bill.spending_limit - bill.total).toLocaleString()}
              </span>
            </div>
            
            {isOverLimit && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Limit aşıldı! Lütfen hesabı kapatın.
              </p>
            )}
            {isNearLimit && !isOverLimit && (
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ Limite yaklaşıyorsunuz
              </p>
            )}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Siparişler ({bill.items.length})</h3>
          <span className="text-sm text-gray-400">#{bill.order_number}</span>
        </div>
        
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden divide-y divide-white/5">
          {bill.items.map((item) => (
            <div key={item.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#252525] rounded-lg flex items-center justify-center">
                {getItemStatusIcon(item.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.product_name}</span>
                  <span className="text-sm text-gray-500">x{item.quantity}</span>
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                )}
              </div>
              <span className="font-semibold">₺{item.total_price.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Summary */}
      <div className="px-4 mt-6">
        <div className="bg-[#1a1a1a] rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-gray-400">
            <span>Ara Toplam</span>
            <span>₺{bill.subtotal.toLocaleString()}</span>
          </div>
          {bill.service_charge > 0 && (
            <div className="flex justify-between text-gray-400">
              <span>Servis Ücreti</span>
              <span>₺{bill.service_charge.toLocaleString()}</span>
            </div>
          )}
          {bill.tax > 0 && (
            <div className="flex justify-between text-gray-400">
              <span>KDV</span>
              <span>₺{bill.tax.toLocaleString()}</span>
            </div>
          )}
          {bill.discount > 0 && (
            <div className="flex justify-between text-green-500">
              <span>İndirim</span>
              <span>-₺{bill.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-3 flex justify-between">
            <span className="font-bold text-lg">Toplam</span>
            <span className="font-bold text-2xl text-orange-500">₺{bill.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-6 space-y-3">
        <button
          onClick={() => router.push(`/venue/${bill.venue_id}`)}
          className="w-full py-4 bg-orange-500 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Receipt className="w-5 h-5" />
          Sipariş Ekle
        </button>
        
        <button
          onClick={() => {/* Garson çağır */}}
          className="w-full py-4 bg-[#1a1a1a] border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <Bell className="w-5 h-5" />
          Garson Çağır
        </button>
      </div>

      {/* Real-time indicator */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Canlı Takip Aktif</span>
        </div>
      </div>
    </div>
  )
}
