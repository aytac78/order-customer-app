'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Store, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Conversation {
  id: string
  venue_id: string
  venue?: { name: string }
  last_message: string
  last_message_at: string
  unread_customer: number
}

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, locale } = useI18n()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadConversations()
        
        // Real-time subscription
        const channel = supabase
          .channel('conversations-list')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'conversations', filter: `customer_id=eq.${user.id}` },
            () => loadConversations()
          )
          .subscribe()
        
        return () => { supabase.removeChannel(channel) }
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*, venue:venues(name)')
        .eq('customer_id', user?.id)
        .order('last_message_at', { ascending: false })
      
      if (data) setConversations(data)
    } catch (err) {
      console.error('Error:', err)
    }
    setLoading(false)
  }

  const formatTime = (date: string) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    if (hours < 24) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    if (hours < 48) return t.messages.yesterday
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_customer || 0), 0)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 pb-24">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t.auth.login}</h2>
          <p className="text-gray-400 mb-4">{t.messages.loginToSee}</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
            {t.auth.login}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t.messages.title}</h1>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-orange-500 rounded-full text-xs font-bold">{totalUnread}</span>
            )}
          </div>
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="p-4">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t.messages.noMessages}</h2>
            <p className="text-gray-400 mb-4">{t.messages.noMessagesDesc}</p>
            <button onClick={() => router.push('/discover')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
              {t.nav.discover}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => router.push(`/messages/${conv.id}`)}
                className="w-full p-4 bg-[#1a1a1a] rounded-xl flex items-center gap-3 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Store className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{conv.venue?.name || t.common.venue}</h3>
                    <span className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_customer > 0 && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold">
                    {conv.unread_customer}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
