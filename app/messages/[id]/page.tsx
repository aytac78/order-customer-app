'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Store, Image, Paperclip } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n'

interface Message {
  id: string
  sender_type: 'customer' | 'venue' | 'system'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  venue_id: string
  venue?: { name: string }
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params.id && user) {
      loadConversation()
      loadMessages()
      markAsRead()

      const channel = supabase
        .channel(`chat-${params.id}`)
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${params.id}` },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message])
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [params.id, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*, venue:venues(name)')
      .eq('id', params.id)
      .single()
    if (data) setConversation(data)
  }

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setLoading(false)
  }

  const markAsRead = async () => {
    await supabase
      .from('conversations')
      .update({ unread_customer: 0 })
      .eq('id', params.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    setSending(true)
    const { error } = await supabase.from('messages').insert({
      conversation_id: params.id,
      sender_type: 'customer',
      sender_id: user?.id,
      venue_id: conversation.venue_id,
      customer_id: user?.id,
      content: newMessage.trim()
    })

    if (!error) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('unread_venue')
        .eq('id', params.id)
        .single()
      
      const currentUnread = convData?.unread_venue || 0
      
      await supabase
        .from('conversations')
        .update({ 
          last_message: newMessage.trim(), 
          last_message_at: new Date().toISOString(),
          unread_venue: currentUnread + 1
        })
        .eq('id', params.id)
      
      setNewMessage('')
    }
    setSending(false)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateHeader = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (d.toDateString() === today.toDateString()) return t.messages.today
    if (d.toDateString() === yesterday.toDateString()) return t.messages.yesterday
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  messages.forEach(msg => {
    const dateKey = new Date(msg.created_at).toDateString()
    const existingGroup = groupedMessages.find(g => g.date === dateKey)
    if (existingGroup) {
      existingGroup.messages.push(msg)
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] })
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/messages')} className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold">{conversation?.venue?.name || t.common.venue}</h1>
            <p className="text-xs text-gray-500">{t.messages.usuallyReplies}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {groupedMessages.map(group => (
          <div key={group.date}>
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-[#1a1a1a] rounded-full text-xs text-gray-400">
                {formatDateHeader(group.messages[0].created_at)}
              </span>
            </div>
            <div className="space-y-3">
              {group.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    msg.sender_type === 'customer' 
                      ? 'bg-orange-500 text-white rounded-br-sm' 
                      : msg.sender_type === 'system'
                      ? 'bg-gray-700 text-gray-300 text-center text-sm'
                      : 'bg-[#1a1a1a] text-white rounded-bl-sm'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'customer' ? 'text-orange-200' : 'text-gray-500'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t.messages.typeMessage}
            className="flex-1 px-4 py-3 bg-[#1a1a1a] rounded-xl border border-white/5 outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
