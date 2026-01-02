'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, MessageCircle, Search, MoreVertical,
  Check, CheckCheck, Clock, Store, ShoppingBag, Calendar,
  HelpCircle, Trash2, X, Plus, ChevronRight, User, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  type: 'support' | 'venue' | 'order' | 'reservation'
  user_id: string
  venue_id?: string
  venue_name?: string
  order_id?: string
  reservation_id?: string
  title?: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  is_active: boolean
  created_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'venue' | 'system'
  content: string
  message_type: 'text' | 'image' | 'order_update' | 'system'
  metadata?: any
  is_read: boolean
  read_at?: string
  created_at: string
}

type ViewType = 'list' | 'chat' | 'new'

const conversationTypes = [
  { type: 'support', label: 'Destek', icon: HelpCircle, color: 'bg-blue-500' },
  { type: 'venue', label: 'Mekan', icon: Store, color: 'bg-orange-500' },
  { type: 'order', label: 'Sipariş', icon: ShoppingBag, color: 'bg-green-500' },
  { type: 'reservation', label: 'Rezervasyon', icon: Calendar, color: 'bg-purple-500' },
]

export default function MessagesPage() {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [view, setView] = useState<ViewType>('list')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  
  // Messages
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  
  // New conversation
  const [newConvType, setNewConvType] = useState<string>('support')
  const [newConvTitle, setNewConvTitle] = useState('')

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadConversations()
      subscribeToConversations()
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      subscribeToMessages(selectedConversation.id)
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user)
    } else {
      router.push('/login')
    }
    setLoading(false)
  }

  const loadConversations = async () => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (data) {
      setConversations(data)
    }
  }

  const subscribeToConversations = () => {
    if (!currentUser) return

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new as Conversation : c)
                .sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime())
            )
          } else if (payload.eventType === 'DELETE') {
            setConversations(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          // Mark as read if it's from venue/system
          if (payload.new.sender_id !== currentUser?.id) {
            markAsRead(conversationId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!currentUser) return

    // Update messages
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUser.id)
      .eq('is_read', false)

    // Reset unread count
    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', conversationId)

    // Update local state
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    )
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        sender_type: 'customer',
        content: messageContent,
        message_type: 'text'
      })
      .select()
      .single()

    if (error) {
      console.error('Message send error:', error)
      setNewMessage(messageContent)
    }

    setSending(false)
  }

  const createConversation = async () => {
    if (!currentUser) return

    const title = newConvTitle.trim() || getDefaultTitle(newConvType)

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        type: newConvType,
        user_id: currentUser.id,
        title,
        is_active: true
      })
      .select()
      .single()

    if (data) {
      setSelectedConversation(data)
      setView('chat')
      setNewConvTitle('')
      
      // Send initial system message
      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_id: currentUser.id,
          sender_type: 'system',
          content: getWelcomeMessage(newConvType),
          message_type: 'system'
        })
    }
  }

  const deleteConversation = async (convId: string) => {
    await supabase
      .from('conversations')
      .update({ is_active: false })
      .eq('id', convId)

    setConversations(prev => prev.filter(c => c.id !== convId))
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null)
      setView('list')
    }
  }

  const getDefaultTitle = (type: string) => {
    switch (type) {
      case 'support': return 'Destek Talebi'
      case 'venue': return 'Mekan İletişimi'
      case 'order': return 'Sipariş Hakkında'
      case 'reservation': return 'Rezervasyon Hakkında'
      default: return 'Yeni Sohbet'
    }
  }

  const getWelcomeMessage = (type: string) => {
    switch (type) {
      case 'support': return 'Merhaba! Size nasıl yardımcı olabiliriz?'
      case 'venue': return 'Mekan ile iletişime geçtiniz. En kısa sürede yanıt verilecektir.'
      case 'order': return 'Siparişiniz hakkında bir sorunuz mu var?'
      case 'reservation': return 'Rezervasyonunuz hakkında size nasıl yardımcı olabiliriz?'
      default: return 'Hoş geldiniz!'
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Şimdi'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`
    if (diff < 86400000) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return date.toLocaleDateString('tr-TR', { weekday: 'short' })
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeInfo = (type: string) => {
    return conversationTypes.find(t => t.type === type) || conversationTypes[0]
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">Giriş Yapın</h2>
        <p className="text-gray-400 text-center mb-4">Mesajlarınızı görmek için giriş yapmanız gerekiyor.</p>
        <button type="button" onClick={() => router.push('/login')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium">
          Giriş Yap
        </button>
      </div>
    )
  }

  // CHAT VIEW
  if (view === 'chat' && selectedConversation) {
    const typeInfo = getTypeInfo(selectedConversation.type)
    const TypeIcon = typeInfo.icon

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10 p-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { setView('list'); setSelectedConversation(null); setMessages([]); }}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className={`w-10 h-10 ${typeInfo.color} rounded-full flex items-center justify-center`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{selectedConversation.title || selectedConversation.venue_name}</h2>
              <p className="text-xs text-gray-400">{typeInfo.label}</p>
            </div>
            <button type="button" className="p-2 hover:bg-white/10 rounded-full">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className={`w-16 h-16 ${typeInfo.color} rounded-full flex items-center justify-center mb-4`}>
                <TypeIcon className="w-8 h-8" />
              </div>
              <p className="text-gray-400">Henüz mesaj yok</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === currentUser.id && msg.sender_type === 'customer'
              const isSystem = msg.sender_type === 'system'

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-[#1a1a1a] px-4 py-2 rounded-full text-xs text-gray-400">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isMe ? 'bg-orange-500' : 'bg-[#2a2a2a]'} rounded-2xl px-4 py-2 ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                    <p className="break-words">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-orange-200' : 'text-gray-500'}`}>
                      <span className="text-xs">{formatMessageTime(msg.created_at)}</span>
                      {isMe && (
                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1a1a1a] border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
              placeholder="Mesaj yazın..."
              className="flex-1 px-4 py-3 bg-[#2a2a2a] rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="button"
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-orange-500 rounded-full disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // NEW CONVERSATION VIEW
  if (view === 'new') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10 p-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setView('list')}><ArrowLeft className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg">Yeni Sohbet</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Konu Seçin</label>
            <div className="grid grid-cols-2 gap-3">
              {conversationTypes.map(type => (
                <button type="button"
                  key={type.type}
                  onClick={() => setNewConvType(type.type)}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    newConvType === type.type
                      ? `${type.color} text-white`
                      : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#222]'
                  }`}
                >
                  <type.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Başlık (Opsiyonel)</label>
            <input
              type="text"
              value={newConvTitle}
              onChange={(e) => setNewConvTitle(e.target.value)}
              placeholder={getDefaultTitle(newConvType)}
              className="w-full px-4 py-3 bg-[#1a1a1a] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button type="button"
            onClick={createConversation}
            className="w-full py-4 bg-orange-500 rounded-xl font-bold text-lg"
          >
            Sohbeti Başlat
          </button>
        </div>
      </div>
    )
  }

  // CONVERSATION LIST VIEW
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button type="button" onClick={() => router.back()}><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Mesajlar</h1>
            {totalUnread > 0 && (
              <p className="text-xs text-orange-400">{totalUnread} okunmamış mesaj</p>
            )}
          </div>
          <button type="button"
            onClick={() => setView('new')}
            className="p-2 bg-orange-500 rounded-full"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sohbetlerde ara..."
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="p-4 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz mesaj yok</h3>
            <p className="text-gray-400 text-center mb-6">Destek almak veya mekanlarla iletişime geçmek için yeni bir sohbet başlatın.</p>
            <button type="button"
              onClick={() => setView('new')}
              className="px-6 py-3 bg-orange-500 rounded-xl font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Yeni Sohbet
            </button>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const typeInfo = getTypeInfo(conv.type)
            const TypeIcon = typeInfo.icon

            return (
              <button type="button"
                key={conv.id}
                onClick={() => { setSelectedConversation(conv); setView('chat'); }}
                className="w-full bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-[#222] transition-colors"
              >
                <div className={`w-12 h-12 ${typeInfo.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{conv.title || conv.venue_name}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">{conv.last_message || 'Yeni sohbet'}</p>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ml-2">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}