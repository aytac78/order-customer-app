'use client'

import { useRouter } from 'next/navigation'
import { User, Settings, Heart, Calendar, MessageSquare, LogOut, ChevronRight, Globe } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { LanguageSelector } from '@/components/LanguageSelector'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 pb-24">
        <User className="w-16 h-16 text-gray-600 mb-4" />
        <h1 className="text-xl font-bold mb-2">Giriş Yapın</h1>
        <p className="text-gray-400 mb-6 text-center">Profilinizi görmek için giriş yapın</p>
        <button
          onClick={() => router.push('/auth')}
          className="px-8 py-3 bg-orange-500 rounded-xl font-semibold"
        >
          Giriş Yap
        </button>
        
        {/* Dil seçici */}
        <div className="mt-8 w-full max-w-xs">
          <LanguageSelector />
        </div>
      </div>
    )
  }

  const menuItems = [
    { icon: Heart, label: 'Favorilerim', href: '/favorites' },
    { icon: Calendar, label: 'Rezervasyonlarım', href: '/reservations' },
    { icon: MessageSquare, label: 'Mesajlar', href: '/messages' },
    { icon: Settings, label: 'Ayarlar', href: '/profile/settings' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      {/* User Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.name || 'Kullanıcı'}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Anonymous ID */}
      {profile?.anonymous_id && (
        <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Anonim ID (HERE için)</p>
          <p className="font-mono text-orange-500">{profile.anonymous_id}</p>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-2 mb-6">
        {menuItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-4"
          >
            <item.icon className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        ))}
      </div>

      {/* Language Selector */}
      <div className="mb-6">
        <LanguageSelector />
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-red-500/10 text-red-500 rounded-xl p-4 flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        <span>Çıkış Yap</span>
      </button>
    </div>
  )
}
