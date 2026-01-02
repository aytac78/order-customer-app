'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X, Check, Smartphone } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface NotificationPromptProps {
  onClose?: () => void
  showAsModal?: boolean
}

export function NotificationPrompt({ onClose, showAsModal = false }: NotificationPromptProps) {
  const { permission, isSupported, requestPermission, isEnabled } = usePushNotifications()
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed or enabled
    const hasDismissed = localStorage.getItem('notification_prompt_dismissed')
    if (hasDismissed || isEnabled || permission === 'denied') {
      setDismissed(true)
      return
    }

    // Show prompt after a delay
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isEnabled, permission])

  const handleEnable = async () => {
    setLoading(true)
    const success = await requestPermission()
    setLoading(false)

    if (success) {
      setShowPrompt(false)
      onClose?.()
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true')
    setDismissed(true)
    setShowPrompt(false)
    onClose?.()
  }

  const handleLater = () => {
    setShowPrompt(false)
    onClose?.()
  }

  if (!isSupported || dismissed || !showPrompt) {
    return null
  }

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden animate-slide-up">
          <div className="p-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
            
            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
              Bildirimleri Aç
            </h2>
            
            <p className="text-gray-500 text-center text-sm mb-6">
              Siparişleriniz, rezervasyonlarınız ve özel teklifler hakkında anında haberdar olun.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span>Sipariş durumu güncellemeleri</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span>Rezervasyon hatırlatmaları</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span>HERE eşleşme bildirimleri</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button"
                onClick={handleLater}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Daha Sonra
              </button>
              <button type="button"
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Bildirimleri Aç
                  </>
                )}
              </button>
            </div>
          </div>

          <button type="button"
            onClick={handleDismiss}
            className="w-full py-3 border-t border-gray-100 text-sm text-gray-400 hover:text-gray-600"
          >
            Bir daha gösterme
          </button>
        </div>
      </div>
    )
  }

  // Inline banner version
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl mx-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Bildirimleri Aç</h3>
          <p className="text-sm text-white/80 mb-3">
            Siparişleriniz ve kampanyalar hakkında bildirim alın.
          </p>
          
          <div className="flex gap-2">
            <button type="button"
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium text-sm hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? 'Yükleniyor...' : 'Bildirimleri Aç'}
            </button>
            <button type="button"
              onClick={handleLater}
              className="px-4 py-2 bg-white/20 rounded-lg font-medium text-sm hover:bg-white/30"
            >
              Sonra
            </button>
          </div>
        </div>

        <button type="button" onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded-full">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Notification Settings Component
export function NotificationSettings() {
  const { preferences, updatePreferences, isEnabled, requestPermission, permission } = usePushNotifications()
  const [loading, setLoading] = useState(false)

  const handleToggle = async (key: keyof typeof preferences) => {
    await updatePreferences({ [key]: !preferences[key] })
  }

  const handleEnableNotifications = async () => {
    setLoading(true)
    await requestPermission()
    setLoading(false)
  }

  const settings = [
    { key: 'orders', label: 'Sipariş Bildirimleri', description: 'Sipariş durumu değişikliklerinde bildirim al' },
    { key: 'reservations', label: 'Rezervasyon Bildirimleri', description: 'Rezervasyon onayları ve hatırlatmalar' },
    { key: 'messages', label: 'Mesaj Bildirimleri', description: 'Yeni mesajlar için bildirim al' },
    { key: 'waiter_calls', label: 'Garson Çağrısı', description: 'Garson çağrısı yanıtları' },
    { key: 'here_matches', label: 'HERE Eşleşmeleri', description: 'Yeni eşleşme bildirimleri' },
    { key: 'promotions', label: 'Kampanyalar', description: 'Özel teklifler ve indirimler' },
  ] as const

  return (
    <div className="space-y-4">
      {/* Enable/Disable All */}
      {!isEnabled && permission !== 'denied' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BellOff className="w-6 h-6 text-orange-500" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">Bildirimler Kapalı</p>
              <p className="text-sm text-orange-600">Bildirimleri açarak önemli güncellemeleri kaçırmayın.</p>
            </div>
            <button type="button"
              onClick={handleEnableNotifications}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {loading ? '...' : 'Aç'}
            </button>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <BellOff className="w-6 h-6 text-red-500" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Bildirimler Engellendi</p>
              <p className="text-sm text-red-600">Tarayıcı ayarlarından bildirim iznini açmanız gerekiyor.</p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Settings */}
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {settings.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between p-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button type="button"
              onClick={() => handleToggle(key)}
              disabled={!isEnabled}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences[key] && isEnabled ? 'bg-orange-500' : 'bg-gray-200'
              } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  preferences[key] ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}