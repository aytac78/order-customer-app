'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Plus, MapPin, Home, Briefcase, Heart, Edit2, 
  Trash2, Check, Navigation, Loader2, Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Address {
  id: string
  user_id: string
  title: string
  full_address: string
  district: string
  city: string
  latitude?: number
  longitude?: number
  is_default: boolean
  notes?: string
  created_at: string
}

const addressIcons: Record<string, any> = {
  'Ev': Home,
  'Home': Home,
  'İş': Briefcase,
  'Work': Briefcase,
  'default': MapPin
}

export default function AddressesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  useEffect(() => {
    if (user) loadAddresses()
  }, [user])

  const loadAddresses = async () => {
    if (!user) return
    setLoading(true)
    
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAddresses(data)
    }
    setLoading(false)
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)

    await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)

    loadAddresses()
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm(t.addresses?.confirmDelete || 'Bu adresi silmek istediğinize emin misiniz?')) return

    await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)

    loadAddresses()
  }

  const getIcon = (title: string) => {
    return addressIcons[title] || addressIcons['default']
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t.auth?.loginRequired || 'Giriş Yapın'}</h2>
          <p className="text-gray-400 mb-4">{t.addresses?.loginToManage || 'Adreslerinizi yönetmek için giriş yapın'}</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
            {t.auth?.login || 'Giriş Yap'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t.addresses?.title || 'Adreslerim'}</h1>
          </div>
          <button onClick={() => { setEditingAddress(null); setShowAddModal(true) }} className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t.addresses?.noAddresses || 'Kayıtlı Adres Yok'}</h2>
            <p className="text-gray-400 mb-6">{t.addresses?.addFirstAddress || 'Teslimat için ilk adresinizi ekleyin'}</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-orange-500 rounded-xl font-medium inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {t.addresses?.addAddress || 'Adres Ekle'}
            </button>
          </div>
        ) : (
          addresses.map(address => {
            const Icon = getIcon(address.title)
            return (
              <div key={address.id} className={`bg-[#1a1a1a] rounded-2xl p-4 border-2 transition-colors ${address.is_default ? 'border-orange-500' : 'border-transparent'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${address.is_default ? 'bg-orange-500' : 'bg-[#242424]'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{address.title}</h3>
                      {address.is_default && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs rounded-full">
                          {t.addresses?.default || 'Varsayılan'}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{address.full_address}</p>
                    <p className="text-gray-500 text-xs mt-1">{address.district}, {address.city}</p>
                    {address.notes && <p className="text-gray-500 text-xs mt-1 italic">📝 {address.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  {!address.is_default && (
                    <button onClick={() => handleSetDefault(address.id)} className="flex-1 py-2 bg-[#242424] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2a2a2a]">
                      <Star className="w-4 h-4" />
                      {t.addresses?.setDefault || 'Varsayılan Yap'}
                    </button>
                  )}
                  <button onClick={() => { setEditingAddress(address); setShowAddModal(true) }} className="p-2 bg-[#242424] rounded-xl hover:bg-[#2a2a2a]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(address.id)} className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showAddModal && (
        <AddressModal
          address={editingAddress}
          onClose={() => { setShowAddModal(false); setEditingAddress(null) }}
          onSave={() => { setShowAddModal(false); setEditingAddress(null); loadAddresses() }}
        />
      )}
    </div>
  )
}

function AddressModal({ address, onClose, onSave }: { address: any; onClose: () => void; onSave: () => void }) {
  const { user } = useAuth()
  const { t } = useI18n()
  
  const [title, setTitle] = useState(address?.title || '')
  const [fullAddress, setFullAddress] = useState(address?.full_address || '')
  const [district, setDistrict] = useState(address?.district || '')
  const [city, setCity] = useState(address?.city || '')
  const [notes, setNotes] = useState(address?.notes || '')
  const [isDefault, setIsDefault] = useState(address?.is_default || false)
  const [loading, setLoading] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)

  const quickTitles = [
    { id: 'home', label: t.addresses?.home || 'Ev', icon: Home },
    { id: 'work', label: t.addresses?.work || 'İş', icon: Briefcase },
    { id: 'other', label: t.addresses?.other || 'Diğer', icon: MapPin },
  ]

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { alert('Konum servisi desteklenmiyor'); return }
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=tr`)
          const data = await response.json()
          if (data.address) {
            setFullAddress(data.display_name?.split(',').slice(0, 3).join(',') || '')
            setDistrict(data.address.suburb || data.address.neighbourhood || data.address.district || '')
            setCity(data.address.city || data.address.province || data.address.state || '')
          }
        } catch (error) { console.error('Geocoding error:', error) }
        setDetectingLocation(false)
      },
      () => { setDetectingLocation(false); alert('Konum alınamadı') }
    )
  }

  const handleSave = async () => {
    if (!user || !title || !fullAddress || !district || !city) {
      alert(t.addresses?.fillRequired || 'Lütfen tüm alanları doldurun'); return
    }
    setLoading(true)
    if (isDefault) {
      await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
    }
    if (address) {
      await supabase.from('user_addresses').update({ title, full_address: fullAddress, district, city, notes: notes || null, is_default: isDefault }).eq('id', address.id)
    } else {
      await supabase.from('user_addresses').insert({ user_id: user.id, title, full_address: fullAddress, district, city, notes: notes || null, is_default: isDefault })
    }
    setLoading(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
      <div className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold">{address ? (t.addresses?.editAddress || 'Adresi Düzenle') : (t.addresses?.addAddress || 'Adres Ekle')}</h2>
          <button onClick={onClose} className="text-gray-400">{t.common?.close || 'Kapat'}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">{t.addresses?.addressType || 'Adres Tipi'}</label>
            <div className="flex gap-2">
              {quickTitles.map(item => (
                <button key={item.id} onClick={() => setTitle(item.label)} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${title === item.label ? 'bg-orange-500 text-white' : 'bg-[#242424] text-gray-400'}`}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleDetectLocation} disabled={detectingLocation} className="w-full py-3 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center gap-2">
            {detectingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
            {t.addresses?.detectLocation || 'Konumumu Kullan'}
          </button>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">{t.addresses?.fullAddress || 'Açık Adres'} *</label>
            <textarea value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder={t.addresses?.fullAddressPlaceholder || 'Sokak, bina no, daire no...'} rows={2} className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 px-4 text-white resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">{t.addresses?.district || 'İlçe'} *</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Kadıköy" className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 px-4 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">{t.addresses?.city || 'Şehir'} *</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 px-4 text-white" />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">{t.addresses?.notes || 'Adres Tarifi'}</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.addresses?.notesPlaceholder || 'Kapıda kod: 1234, 3. kat...'} className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 px-4 text-white" />
          </div>

          <button onClick={() => setIsDefault(!isDefault)} className="w-full p-4 bg-[#242424] rounded-xl flex items-center justify-between">
            <span>{t.addresses?.setAsDefault || 'Varsayılan adres olarak ayarla'}</span>
            <div className={`w-12 h-7 rounded-full relative transition-colors ${isDefault ? 'bg-orange-500' : 'bg-gray-600'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isDefault ? 'right-1' : 'left-1'}`} />
            </div>
          </button>
        </div>

        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button onClick={handleSave} disabled={loading || !title || !fullAddress || !district || !city} className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 rounded-xl font-bold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" />{t.common?.save || 'Kaydet'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
