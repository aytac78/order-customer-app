'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Bell, Globe, Moon, Sun, Volume2, VolumeX,
  Shield, HelpCircle, FileText, Mail, ChevronRight,
  Smartphone, Trash2, Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('tr')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Ayarlar</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Bildirimler */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">BİLDİRİMLER</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-500" />
                <span>Push Bildirimleri</span>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-7 rounded-full transition-colors ${notifications ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                {sound ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
                <span>Bildirim Sesi</span>
              </div>
              <button
                onClick={() => setSound(!sound)}
                className={`w-12 h-7 rounded-full transition-colors ${sound ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${sound ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Görünüm */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">GÖRÜNÜM</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-purple-500" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                <span>Karanlık Mod</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-5 h-5 text-cyan-500" />
                <span>Dil</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3 rounded-xl text-left flex items-center gap-2 ${
                      language === lang.code 
                        ? 'bg-orange-500/20 border border-orange-500' 
                        : 'bg-[#2a2a2a]'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Destek */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">DESTEK</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <span>Yardım Merkezi</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-500" />
                <span>Bize Ulaşın</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Yasal */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">YASAL</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <span>Kullanım Şartları</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span>Gizlilik Politikası</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Hesap */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">HESAP</h2>
          <button className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <span>Hesabı Sil</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm">ORDER Customer App</p>
          <p className="text-gray-600 text-xs">Versiyon 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
