'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import {
  User, Settings, CreditCard, LogOut, ChevronRight,
  Instagram, Facebook, Copy, Check, Edit2, Shield,
  Wallet, TrendingUp, MapPin, Calendar, Clock,
  Star, Heart, Package, Plus, Trash2, X, Loader2,
  Fingerprint, KeyRound, Eye, EyeOff, ChevronDown
} from 'lucide-react'

interface UserStats {
  totalSpent: number
  orderCount: number
  venueCount: number
  favoriteVenue: { name: string; visits: number } | null
  favoriteItem: { name: string; count: number } | null
}

interface SavedCard {
  id: string
  last4: string
  brand: string
  expiry: string
  isDefault: boolean
}

interface TopVenue {
  venue_id: string
  venue_name: string
  visit_count: number
  total_spent: number
}

interface TopItem {
  name: string
  count: number
  total_spent: number
}

type StatsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [topVenues, setTopVenues] = useState<TopVenue[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('monthly')
  const [copiedId, setCopiedId] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (user) {
        loadProfile()
      } else {
        // Kullanıcı yoksa loading'i kapat
        setLoading(false)
      }
    }
  }, [user, mounted])

  useEffect(() => {
    if (user && mounted && !loading) {
      loadStats()
    }
  }, [user, mounted, loading, statsPeriod])

  const loadProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      // Önce profili kontrol et
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Profil hatası:', error)
        // Hata olsa bile devam et, boş profil göster
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          tit_id: null,
          saved_cards: []
        })
        setLoading(false)
        return
      }

      if (!data) {
        // Profil yoksa oluşturmayı dene
        try {
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              phone: user.phone || '',
              country_code: 'TR'
            })
            .select()
            .single()
          
          if (insertError) {
            console.error('Profil oluşturma hatası:', insertError)
            // Hata olsa bile devam et
            setProfile({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              tit_id: null,
              saved_cards: []
            })
          } else {
            setProfile(newProfile)
          }
        } catch (insertErr) {
          console.error('Insert error:', insertErr)
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            tit_id: null,
            saved_cards: []
          })
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profil yüklenemedi:', err)
      // Hata durumunda da temel profili göster
      setProfile({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        tit_id: null,
        saved_cards: []
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      // Dönem başlangıç tarihini hesapla
      const now = new Date()
      let startDate = new Date()
      
      switch (statsPeriod) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'weekly':
          startDate.setDate(now.getDate() - 7)
          break
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'yearly':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      // Siparişleri getir
      const { data: orders, error } = await supabase
        .from('orders')
        .select('venue_id, total, items, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())

      if (error) {
        console.error('Siparişler yüklenemedi:', error)
        // Boş stats göster
        setStats({
          totalSpent: 0,
          orderCount: 0,
          venueCount: 0,
          favoriteVenue: null,
          favoriteItem: null
        })
        return
      }

      if (!orders || orders.length === 0) {
        setStats({
          totalSpent: 0,
          orderCount: 0,
          venueCount: 0,
          favoriteVenue: null,
          favoriteItem: null
        })
        setTopVenues([])
        setTopItems([])
        return
      }

      // Mekan bilgilerini getir
      const venueIds = [...new Set(orders?.map(o => o.venue_id).filter(Boolean))]
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds)

      const venueMap = new Map(venues?.map(v => [v.id, v.name]) || [])

      // İstatistikleri hesapla
      const totalSpent = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
      const orderCount = orders?.length || 0
      const uniqueVenues = new Set(orders?.map(o => o.venue_id).filter(Boolean))

      // En çok gidilen mekanlar
      const venueVisits: Record<string, { count: number; spent: number }> = {}
      orders?.forEach(order => {
        if (order.venue_id) {
          if (!venueVisits[order.venue_id]) {
            venueVisits[order.venue_id] = { count: 0, spent: 0 }
          }
          venueVisits[order.venue_id].count++
          venueVisits[order.venue_id].spent += order.total || 0
        }
      })

      const sortedVenues = Object.entries(venueVisits)
        .map(([venue_id, data]) => ({
          venue_id,
          venue_name: venueMap.get(venue_id) || 'Mekan',
          visit_count: data.count,
          total_spent: data.spent
        }))
        .sort((a, b) => b.visit_count - a.visit_count)
        .slice(0, 5)

      setTopVenues(sortedVenues)

      // En çok sipariş edilen ürünler
      const itemCounts: Record<string, { count: number; spent: number }> = {}
      orders?.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const name = item.name || item.product_name
            if (name) {
              if (!itemCounts[name]) {
                itemCounts[name] = { count: 0, spent: 0 }
              }
              itemCounts[name].count += item.quantity || 1
              itemCounts[name].spent += (item.price || 0) * (item.quantity || 1)
            }
          })
        }
      })

      const sortedItems = Object.entries(itemCounts)
        .map(([name, data]) => ({
          name,
          count: data.count,
          total_spent: data.spent
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopItems(sortedItems)

      // Stats özeti
      setStats({
        totalSpent,
        orderCount,
        venueCount: uniqueVenues.size,
        favoriteVenue: sortedVenues[0] ? { name: sortedVenues[0].venue_name, visits: sortedVenues[0].visit_count } : null,
        favoriteItem: sortedItems[0] ? { name: sortedItems[0].name, count: sortedItems[0].count } : null
      })

    } catch (err) {
      console.error('İstatistikler yüklenemedi:', err)
    }
  }

  const copyTitId = () => {
    if (profile?.tit_id) {
      navigator.clipboard.writeText(profile.tit_id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const formatTitId = (id: string) => {
    if (!id) return ''
    // TR + 14 hane formatla: TR 1234 5678 9012 34
    return `${id.slice(0, 2)} ${id.slice(2, 6)} ${id.slice(6, 10)} ${id.slice(10, 14)} ${id.slice(14)}`
  }

  const periodLabels: Record<StatsPeriod, string> = {
    daily: 'Bugün',
    weekly: 'Bu Hafta',
    monthly: 'Bu Ay',
    yearly: 'Bu Yıl'
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <User className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Giriş Yapın</h2>
        <p className="text-gray-400 text-center mb-6">Profilinizi görüntülemek için giriş yapmanız gerekiyor.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-8 py-3 bg-orange-500 rounded-xl font-bold"
        >
          Giriş Yap
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 pt-8 pb-16 px-4 relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Profilim</h1>
          <button 
            onClick={() => setShowEditModal(true)}
            className="p-2 bg-white/20 rounded-full"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name || user.email}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
            {profile?.phone && (
              <p className="text-white/60 text-sm">{profile.phone}</p>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-3 mt-4">
          {profile?.instagram_url && (
            <a 
              href={profile.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          )}
          {profile?.facebook_url && (
            <a 
              href={profile.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
          )}
        </div>
      </div>

      {/* TiT ID Card */}
      <div className="px-4 -mt-8">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-200 text-sm">TiT ID (IBAN)</span>
            <div className="flex items-center gap-1 text-xs text-purple-200">
              <Shield className="w-3 h-3" />
              Güvenli
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xl font-mono font-bold tracking-wider">
              {formatTitId(profile?.tit_id || '')}
            </span>
            <button 
              onClick={copyTitId}
              className="p-2 bg-white/20 rounded-lg"
            >
              {copiedId ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-purple-200 text-xs mt-2">Bu ID, TiT Pay ödemeleriniz için IBAN olarak kullanılacaktır.</p>
        </div>
      </div>

      {/* Stats Period Selector */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Harcama İstatistikleri</h3>
          <div className="relative">
            <select
              value={statsPeriod}
              onChange={(e) => setStatsPeriod(e.target.value as StatsPeriod)}
              className="appearance-none bg-[#1a1a1a] text-white px-4 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="daily">Bugün</option>
              <option value="weekly">Bu Hafta</option>
              <option value="monthly">Bu Ay</option>
              <option value="yearly">Bu Yıl</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
            <Wallet className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold">₺{(stats?.totalSpent || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Harcama</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
            <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.orderCount || 0}</p>
            <p className="text-xs text-gray-400">Sipariş</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
            <MapPin className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xl font-bold">{stats?.venueCount || 0}</p>
            <p className="text-xs text-gray-400">Mekan</p>
          </div>
        </div>
      </div>

      {/* Top Venues */}
      {topVenues.length > 0 && (
        <div className="px-4 mt-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            En Çok Gittiğin Mekanlar
          </h3>
          <div className="space-y-2">
            {topVenues.map((venue, index) => (
              <button
                key={venue.venue_id}
                onClick={() => router.push(`/venue/${venue.venue_id}`)}
                className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{venue.venue_name}</p>
                  <p className="text-xs text-gray-400">{venue.visit_count} ziyaret • ₺{venue.total_spent.toLocaleString()}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Items */}
      {topItems.length > 0 && (
        <div className="px-4 mt-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            En Çok Sipariş Ettiklerin
          </h3>
          <div className="space-y-2">
            {topItems.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-orange-400' : 'bg-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.count} kez • ₺{item.total_spent.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            Ödeme Yöntemlerim
          </h3>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="text-orange-500 text-sm"
          >
            Düzenle
          </button>
        </div>
        
        <div className="space-y-2">
          {/* TiT Pay */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">TiT</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">TiT Pay</p>
              <p className="text-xs text-purple-400">Aktif</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>

          {/* Saved Cards */}
          {profile?.saved_cards?.map((card: SavedCard) => (
            <div key={card.id} className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl">
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">•••• {card.last4}</p>
                <p className="text-xs text-gray-400">{card.brand} • {card.expiry}</p>
              </div>
              {card.isDefault && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs rounded-full">Varsayılan</span>
              )}
            </div>
          ))}

          {/* Add Card Button */}
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-gray-700 rounded-xl text-gray-400"
          >
            <Plus className="w-5 h-5" />
            Kart Ekle
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-6 space-y-2">
        <button 
          onClick={() => setShowSecurityModal(true)}
          className="w-full flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl"
        >
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Güvenlik Ayarları</p>
            <p className="text-xs text-gray-400">PIN, Parmak İzi, Face ID</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>

        <button 
          onClick={() => router.push('/orders')}
          className="w-full flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl"
        >
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Siparişlerim</p>
            <p className="text-xs text-gray-400">Geçmiş siparişleri görüntüle</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>

        <button 
          onClick={() => router.push('/favorites')}
          className="w-full flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl"
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Favorilerim</p>
            <p className="text-xs text-gray-400">Kayıtlı mekanlar</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>

        <button 
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl"
        >
          <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium">Ayarlar</p>
            <p className="text-xs text-gray-400">Bildirimler, Dil, Tema</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Logout */}
      <div className="px-4 mt-6">
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal 
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={async (updates) => {
            const { error } = await supabase
              .from('user_profiles')
              .update(updates)
              .eq('id', user.id)
            
            if (!error) {
              setProfile({ ...profile, ...updates })
            }
            setShowEditModal(false)
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentMethodsModal
          savedCards={profile?.saved_cards || []}
          defaultMethod={profile?.default_payment_method || 'cash'}
          onClose={() => setShowPaymentModal(false)}
          onSave={async (cards, defaultMethod) => {
            const { error } = await supabase
              .from('user_profiles')
              .update({ 
                saved_cards: cards,
                default_payment_method: defaultMethod
              })
              .eq('id', user.id)
            
            if (!error) {
              setProfile({ ...profile, saved_cards: cards, default_payment_method: defaultMethod })
            }
            setShowPaymentModal(false)
          }}
        />
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <SecurityModal
          profile={profile}
          onClose={() => setShowSecurityModal(false)}
          onSave={async (updates) => {
            const { error } = await supabase
              .from('user_profiles')
              .update(updates)
              .eq('id', user.id)
            
            if (!error) {
              setProfile({ ...profile, ...updates })
            }
            setShowSecurityModal(false)
          }}
        />
      )}
    </div>
  )
}

// Edit Profile Modal
function EditProfileModal({ profile, onClose, onSave }: any) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [instagram, setInstagram] = useState(profile?.instagram_url || '')
  const [facebook, setFacebook] = useState(profile?.facebook_url || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      full_name: fullName,
      phone,
      bio,
      instagram_url: instagram,
      facebook_url: facebook
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end">
      <div className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold">Profili Düzenle</h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 bg-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX XXX XX XX"
              className="w-full p-3 bg-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Hakkımda</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Kendinizden bahsedin..."
              className="w-full p-3 bg-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
              <Instagram className="w-4 h-4" /> Instagram
            </label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/kullaniciadi"
              className="w-full p-3 bg-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
              <Facebook className="w-4 h-4" /> Facebook
            </label>
            <input
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/kullaniciadi"
              className="w-full p-3 bg-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-orange-500 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Payment Methods Modal
function PaymentMethodsModal({ savedCards, defaultMethod, onClose, onSave }: any) {
  const [cards, setCards] = useState<SavedCard[]>(savedCards)
  const [method, setMethod] = useState(defaultMethod)
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [saving, setSaving] = useState(false)

  const addCard = () => {
    if (cardNumber.length < 16) return
    
    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      last4: cardNumber.slice(-4),
      brand: cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Kart',
      expiry: expiry,
      isDefault: cards.length === 0
    }
    
    setCards([...cards, newCard])
    setShowAddCard(false)
    setCardNumber('')
    setExpiry('')
    setCvv('')
  }

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id))
  }

  const setDefaultCard = (id: string) => {
    setCards(cards.map(c => ({ ...c, isDefault: c.id === id })))
    setMethod('card')
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(cards, method)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end">
      <div className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a1a]">
          <h2 className="text-lg font-bold">Ödeme Yöntemleri</h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Default Method */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Varsayılan Ödeme</label>
            <div className="space-y-2">
              <button
                onClick={() => setMethod('tit_pay')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border ${
                  method === 'tit_pay' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-[#2a2a2a]'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">TiT</span>
                </div>
                <span className="flex-1 text-left font-medium">TiT Pay</span>
                {method === 'tit_pay' && <Check className="w-5 h-5 text-purple-500" />}
              </button>

              <button
                onClick={() => setMethod('cash')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border ${
                  method === 'cash' ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-[#2a2a2a]'
                }`}
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                <span className="flex-1 text-left font-medium">Nakit</span>
                {method === 'cash' && <Check className="w-5 h-5 text-green-500" />}
              </button>
            </div>
          </div>

          {/* Saved Cards */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Kayıtlı Kartlar</label>
            <div className="space-y-2">
              {cards.map(card => (
                <div
                  key={card.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    card.isDefault && method === 'card' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-[#2a2a2a]'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">•••• {card.last4}</p>
                    <p className="text-xs text-gray-400">{card.brand} • {card.expiry}</p>
                  </div>
                  <button onClick={() => setDefaultCard(card.id)} className="p-2">
                    {card.isDefault ? <Check className="w-5 h-5 text-orange-500" /> : <div className="w-5 h-5 border border-gray-600 rounded-full" />}
                  </button>
                  <button onClick={() => removeCard(card.id)} className="p-2 text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {/* Add Card Form */}
              {showAddCard ? (
                <div className="p-4 bg-[#2a2a2a] rounded-xl space-y-3">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="Kart Numarası"
                    className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="AA/YY"
                      className="flex-1 p-3 bg-[#1a1a1a] rounded-lg text-white"
                    />
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="CVV"
                      className="w-24 p-3 bg-[#1a1a1a] rounded-lg text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddCard(false)} className="flex-1 py-3 bg-gray-700 rounded-lg">İptal</button>
                    <button onClick={addCard} className="flex-1 py-3 bg-orange-500 rounded-lg font-medium">Ekle</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCard(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-gray-700 rounded-xl text-gray-400"
                >
                  <Plus className="w-5 h-5" />
                  Yeni Kart Ekle
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-orange-500 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Security Modal
function SecurityModal({ profile, onClose, onSave }: any) {
  const [pinEnabled, setPinEnabled] = useState(!!profile?.pin_code)
  const [biometricEnabled, setBiometricEnabled] = useState(profile?.biometric_enabled || false)
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      pin_code: pinEnabled ? pin : null,
      biometric_enabled: biometricEnabled
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-end">
      <div className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a1a]">
          <h2 className="text-lg font-bold">Güvenlik Ayarları</h2>
          <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-400">
            Giriş yaptıktan sonra 1 hafta boyunca oturum açık kalır. Tekrar giriş için bu yöntemlerden birini kullanabilirsiniz.
          </p>

          {/* Biometric */}
          <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-xl">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-medium">Parmak İzi / Face ID</p>
                <p className="text-xs text-gray-400">Biyometrik doğrulama</p>
              </div>
            </div>
            <button
              onClick={() => setBiometricEnabled(!biometricEnabled)}
              className={`w-12 h-7 rounded-full transition-colors ${biometricEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${biometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* PIN */}
          <div className="p-4 bg-[#2a2a2a] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">PIN Kodu</p>
                  <p className="text-xs text-gray-400">4-6 haneli şifre</p>
                </div>
              </div>
              <button
                onClick={() => setPinEnabled(!pinEnabled)}
                className={`w-12 h-7 rounded-full transition-colors ${pinEnabled ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pinEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {pinEnabled && (
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="PIN kodunuzu girin"
                  className="w-full p-3 bg-[#1a1a1a] rounded-lg text-white text-center tracking-widest"
                />
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPin ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-orange-500 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
