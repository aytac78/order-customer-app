'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useI18n, languages } from '@/lib/i18n'
import {
  Settings, Bell, Moon, Globe, Shield, HelpCircle,
  FileText, ChevronRight, LogOut, Loader2, Volume2,
  Fingerprint, User, ArrowLeft
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [mounted, setMounted] = useState(false)
  
  // Settings state
  const [pushEnabled, setPushEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        <h1 className="text-2xl font-bold">{t.nav?.settings || 'Settings'}</h1>
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
              <p className="text-sm text-gray-400">{t.settings?.viewProfile || 'View profile'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Notifications */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t.settings?.notifications || 'Notifications'}
        </h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <span>{t.settings?.pushNotifications || 'Push Notifications'}</span>
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
              <span>{t.settings?.notificationSound || 'Notification Sound'}</span>
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t.settings?.appearance || 'Appearance'}
        </h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-purple-500" />
              <span>{t.settings?.darkMode || 'Dark Mode'}</span>
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
              <span>{t.settings?.language || 'Language'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code)}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                    locale === lang.code 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t.settings?.security || 'Security'}
        </h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-green-500" />
              <div>
                <span>{t.settings?.biometricLogin || 'Biometric Login'}</span>
                <p className="text-xs text-gray-500">Face ID / {t.settings?.fingerprint || 'Fingerprint'}</p>
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
                <span>{t.settings?.pinCode || 'PIN Code'}</span>
                <p className="text-xs text-gray-500">{t.settings?.pinCodeDesc || '4-6 digit security code'}</p>
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
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {t.settings?.support || 'Support'}
        </h2>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-yellow-500" />
              <span>{t.settings?.helpCenter || 'Help Center'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>{t.settings?.contactUs || 'Contact Us'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>{t.settings?.termsOfService || 'Terms of Service'}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <span>{t.settings?.privacyPolicy || 'Privacy Policy'}</span>
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
            {t.auth?.logout || 'Sign Out'}
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
