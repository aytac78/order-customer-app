'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import {
  Settings, Bell, Moon, Globe, Shield, HelpCircle,
  FileText, ChevronRight, LogOut, Loader2, Volume2,
  Fingerprint, User, ArrowLeft
} from 'lucide-react'

type Language = 'tr' | 'en' | 'ar' | 'fa'

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // Settings state
  const [pushEnabled, setPushEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [language, setLanguage] = useState<Language>('tr')

  useEffect(() => {
    setMounted(true)
    // Load settings from localStorage
    const savedLanguage = localStorage.getItem('order-locale') as Language
    if (savedLanguage) setLanguage(savedLanguage)
  }, [])

  const handleLanguageChange = (code: Language) => {
    setLanguage(code)
    localStorage.setItem('order-locale', code)
    // In real app, this would trigger i18n change
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="p-4 pt-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
      </div>

      {/* Profile Link */}
      {user && (
        <div className="px-4 mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-sm text-gray-400">Profili görüntüle</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Notifications */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Bildirimler</h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <span>Push Bildirimleri</span>
            </div>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-12 h-7 rounded-full transition-colors ${pushEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-blue-500" />
              <span>Bildirim Sesi</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-7 rounded-full transition-colors ${soundEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Görünüm</h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-500" />
              <span>Karanlık Mod</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {/* Language */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-green-500" />
              <span>Dil</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                    language === lang.code 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Güvenlik</h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-green-500" />
              <div>
                <span>Biyometrik Giriş</span>
                <p className="text-xs text-gray-500">Face ID / Parmak İzi</p>
              </div>
            </div>
            <button
              onClick={() => setBiometricEnabled(!biometricEnabled)}
              className={`w-12 h-7 rounded-full transition-colors ${biometricEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${biometricEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-500" />
              <div>
                <span>PIN Kodu</span>
                <p className="text-xs text-gray-500">4-6 haneli güvenlik kodu</p>
              </div>
            </div>
            <button
              onClick={() => setPinEnabled(!pinEnabled)}
              className={`w-12 h-7 rounded-full transition-colors ${pinEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${pinEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Destek</h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-yellow-500" />
              <span>Yardım Merkezi</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>Bize Ulaşın</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>Kullanım Koşulları</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>Gizlilik Politikası</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Logout */}
      {user && (
        <div className="px-4 mb-6">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Çıkış Yap
          </button>
        </div>
      )}

      {/* Version */}
      <div className="px-4 text-center">
        <p className="text-sm text-gray-600">ORDER v1.0.0</p>
        <p className="text-xs text-gray-700">TiT Ecosystem</p>
      </div>
    </div>
  )
}
