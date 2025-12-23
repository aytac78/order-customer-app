'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import {
  MessageCircle, Search, Bell, User, Loader2,
  ChevronRight, Clock, Check, CheckCheck
} from 'lucide-react'

interface Message {
  id: string
  type: 'venue' | 'support' | 'promo'
  title: string
  subtitle: string
  time: string
  unread: boolean
  avatar?: string
}

// Demo messages
const demoMessages: Message[] = [
  {
    id: '1',
    type: 'support',
    title: 'ORDER Destek',
    subtitle: 'Hoş geldiniz! Size nasıl yardımcı olabiliriz?',
    time: 'Şimdi',
    unread: true
  },
  {
    id: '2',
    type: 'promo',
    title: 'ORDER Kampanyalar',
    subtitle: '🎉 İlk siparişinize %20 indirim!',
    time: '2 saat önce',
    unread: true
  }
]

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
    // Simulate loading messages
    setTimeout(() => {
      setMessages(demoMessages)
      setLoading(false)
    }, 500)
  }, [])

  const filteredMessages = messages.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unreadCount = messages.filter(m => m.unread).length

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="p-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Mesajlar</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400">{unreadCount} okunmamış mesaj</p>
            )}
          </div>
          <button className="p-2 bg-[#1a1a1a] rounded-full relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Mesajlarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="px-4 mt-4">
        {filteredMessages.length > 0 ? (
          <div className="space-y-2">
            {filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => {
                  // Mark as read
                  setMessages(prev => prev.map(m => 
                    m.id === message.id ? { ...m, unread: false } : m
                  ))
                  // Navigate to chat (placeholder)
                  // router.push(`/messages/${message.id}`)
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors ${
                  message.unread ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-[#1a1a1a]'
                }`}
              >
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  message.type === 'support' ? 'bg-blue-500' :
                  message.type === 'promo' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                  'bg-gray-700'
                }`}>
                  {message.type === 'support' ? (
                    <MessageCircle className="w-6 h-6" />
                  ) : message.type === 'promo' ? (
                    <span className="text-2xl">🎁</span>
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${message.unread ? 'text-white' : 'text-gray-300'}`}>
                      {message.title}
                    </h3>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <p className={`text-sm truncate ${message.unread ? 'text-gray-300' : 'text-gray-500'}`}>
                    {message.subtitle}
                  </p>
                </div>

                {/* Unread indicator */}
                {message.unread && (
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Mesaj Yok</h2>
            <p className="text-gray-400 text-center">
              {searchQuery ? 'Aramanızla eşleşen mesaj bulunamadı.' : 'Henüz mesajınız yok.'}
            </p>
          </div>
        )}
      </div>

      {/* Coming Soon Banner */}
      <div className="px-4 mt-8">
        <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-purple-300">Yakında: Canlı Sohbet</p>
              <p className="text-sm text-purple-400">Mekanlarla doğrudan mesajlaşın</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
