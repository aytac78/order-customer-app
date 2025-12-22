'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Eye, EyeOff, MapPin, Users, Shield, 
  Radio, Coffee, Bell, ChevronRight, Info
} from 'lucide-react'
import { usePresence } from '@/lib/usePresence'
import { useAuth } from '@/lib/AuthContext'

export default function HereSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { settings, updateSettings, checkOut, currentVenueId } = usePresence()
  const [saving, setSaving] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Giriş yapmanız gerekiyor</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-2 bg-purple-500 rounded-xl"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  const handleToggle = async (key: keyof typeof settings) => {
    setSaving(true)
    await updateSettings({ [key]: !settings[key] })
    setSaving(false)
  }

  const handleCheckOut = async () => {
    if (confirm('Mekandan çıkış yapmak istediğinize emin misiniz?')) {
      await checkOut()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/5 px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">HERE Ayarları</h1>
            <p className="text-sm text-gray-400">Gizlilik ve görünürlük</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Ana Görünürlük */}
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                {settings.is_discoverable ? (
                  <Eye className="w-6 h-6 text-purple-400" />
                ) : (
                  <EyeOff className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <h2 className="font-semibold">Keşfedilebilir Ol</h2>
                <p className="text-sm text-gray-400">
                  {settings.is_discoverable ? 'Başkaları seni görebilir' : 'Kimse seni göremez'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('is_discoverable')}
              disabled={saving}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                settings.is_discoverable ? 'bg-purple-500' : 'bg-gray-600'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.is_discoverable ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="p-3 bg-black/20 rounded-xl">
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Bu özellik açıkken konumun periyodik olarak güncellenir ve yakınındaki 
                diğer kullanıcılar seni görebilir. Gizliliğin bizim için önemli!
              </p>
            </div>
          </div>
        </div>

        {/* Detaylı Ayarlar */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 px-1">GÖRÜNÜRLÜK AYARLARI</h3>
          
          {/* Mekanda Görünürlük */}
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium">Mekanda Görün</p>
                  <p className="text-sm text-gray-500">Check-in yaptığın mekanda</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('show_in_venue')}
                disabled={saving || !settings.is_discoverable}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings.show_in_venue && settings.is_discoverable ? 'bg-orange-500' : 'bg-gray-600'
                } ${!settings.is_discoverable ? 'opacity-50' : ''}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.show_in_venue && settings.is_discoverable ? 'left-5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Yakınlarda Görünürlük */}
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="font-medium">Yakınlarda Görün</p>
                  <p className="text-sm text-gray-500">Konum bazlı keşifte</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('show_nearby')}
                disabled={saving || !settings.is_discoverable}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  settings.show_nearby && settings.is_discoverable ? 'bg-pink-500' : 'bg-gray-600'
                } ${!settings.is_discoverable ? 'opacity-50' : ''}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.show_nearby && settings.is_discoverable ? 'left-5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mevcut Check-in */}
        {currentVenueId && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 px-1">MEVCUt CHECK-IN</h3>
            <div className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Şu an bir mekandaysın</p>
                    <p className="text-sm text-gray-500">Check-in aktif</p>
                  </div>
                </div>
                <button
                  onClick={handleCheckOut}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Güvenlik Bilgisi */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400 px-1">GÜVENLİK</h3>
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium mb-1">Gizliliğin Güvende</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Tam konumun hiçbir zaman paylaşılmaz</li>
                  <li>• Sadece yaklaşık mesafe gösterilir</li>
                  <li>• İstediğin zaman görünmez olabilirsin</li>
                  <li>• 15 dakika hareketsizlikte otomatik gizlenir</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
