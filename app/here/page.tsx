'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, MapPin, Users, Heart, X, MessageCircle, 
  Send, ChevronLeft, Sparkles, Clock,
  Instagram, Zap, CheckCircle
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

interface HereUser {
  id: string
  name: string
  age: number
  avatar: string
  bio: string
  interests: string[]
  instagram?: string
  isHere: boolean
  lastSeenMinutes: number
}

interface Match {
  id: string
  user: HereUser
  venue: { id: string; name: string }
  matchedAt: string
  lastMessage?: string
  unreadCount: number
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  isRead: boolean
}

interface Venue {
  id: string
  name: string
  type: string
  activeUsers: number
}

const currentVenue: Venue = {
  id: 'v1',
  name: "Nihal's Break Point",
  type: 'Kafe & Bar',
  activeUsers: 12
}

const demoUsersAtVenue: HereUser[] = [
  {
    id: 'u1', name: 'Elif', age: 26, avatar: '👩‍🦰',
    bio: 'Kahve tutkunu ☕ Kitap kurdu 📚',
    interests: ['Kahve', 'Kitap', 'Seyahat'],
    instagram: 'elif_travels', isHere: true, lastSeenMinutes: 2
  },
  {
    id: 'u2', name: 'Kaan', age: 28, avatar: '👨‍💼',
    bio: 'Yazılımcı 💻 Müzik sever 🎵',
    interests: ['Teknoloji', 'Müzik', 'Film'],
    instagram: 'kaan_dev', isHere: true, lastSeenMinutes: 5
  },
  {
    id: 'u3', name: 'Zeynep', age: 24, avatar: '👩‍🎨',
    bio: 'Tasarımcı 🎨 Yoga lover 🧘‍♀️',
    interests: ['Tasarım', 'Yoga', 'Doğa'],
    instagram: 'zeynep_art', isHere: true, lastSeenMinutes: 1
  },
  {
    id: 'u4', name: 'Burak', age: 30, avatar: '👨‍🍳',
    bio: 'Gurme 🍷 Yemek bloggerı',
    interests: ['Yemek', 'Şarap', 'Fotoğraf'],
    instagram: 'burak_chef', isHere: true, lastSeenMinutes: 15
  },
  {
    id: 'u5', name: 'Deniz', age: 27, avatar: '👩‍💻',
    bio: 'PM 📊 Dans etmeyi seviyorum 💃',
    interests: ['İş', 'Dans', 'Netflix'],
    instagram: 'deniz_pm', isHere: true, lastSeenMinutes: 0
  },
]

const demoMatches: Match[] = [
  {
    id: 'm1', user: demoUsersAtVenue[0], venue: currentVenue,
    matchedAt: new Date(Date.now() - 3600000).toISOString(),
    lastMessage: 'Merhaba! Nasılsın? 😊', unreadCount: 2
  },
  {
    id: 'm2', user: demoUsersAtVenue[2], venue: currentVenue,
    matchedAt: new Date(Date.now() - 86400000).toISOString(),
    lastMessage: 'Bu mekan çok güzel!', unreadCount: 0
  },
]

type TabType = 'discover' | 'matches' | 'chat'

export default function HerePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const [matches, setMatches] = useState<Match[]>(demoMatches)
  const [likedUsers, setLikedUsers] = useState<string[]>([])
  const [passedUsers, setPassedUsers] = useState<string[]>([])
  const [showMatch, setShowMatch] = useState(false)
  const [newMatchUser, setNewMatchUser] = useState<HereUser | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    setMounted(true)
    // Check-in her zaman gerekli - direkt /here'e gelince de göster
  }, [])

  const availableUsers = demoUsersAtVenue.filter(
    u => !likedUsers.includes(u.id) && !passedUsers.includes(u.id)
  )
  const currentUser = availableUsers[0]

  const handleCheckIn = () => setIsCheckedIn(true)

  const handleLike = () => {
    if (!currentUser) return
    setLikedUsers(prev => [...prev, currentUser.id])
    if (Math.random() > 0.5) {
      setNewMatchUser(currentUser)
      setShowMatch(true)
      setMatches(prev => [{
        id: `m-${Date.now()}`, user: currentUser, venue: currentVenue,
        matchedAt: new Date().toISOString(), unreadCount: 0
      }, ...prev])
    }
  }

  const handlePass = () => {
    if (!currentUser) return
    setPassedUsers(prev => [...prev, currentUser.id])
  }

  const handleSuperLike = () => {
    if (!currentUser) return
    setLikedUsers(prev => [...prev, currentUser.id])
    setNewMatchUser(currentUser)
    setShowMatch(true)
    setMatches(prev => [{
      id: `m-${Date.now()}`, user: currentUser, venue: currentVenue,
      matchedAt: new Date().toISOString(), unreadCount: 0
    }, ...prev])
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedMatch) return
    const msg: Message = {
      id: `msg-${Date.now()}`, senderId: 'me', text: newMessage,
      timestamp: new Date().toISOString(), isRead: false
    }
    setMessages(prev => [...prev, msg])
    setNewMessage('')
    setTimeout(() => {
      const replies = ['Harika! 😊', 'Hangi köşedesin?', 'Gel buluşalım! 🍹', 'Çok tatlısın 💕']
      const reply: Message = {
        id: `msg-${Date.now()}`, senderId: selectedMatch.user.id,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(), isRead: false
      }
      setMessages(prev => [...prev, reply])
    }, 2000)
  }

  const openChat = (match: Match) => {
    setSelectedMatch(match)
    setMessages([{
      id: 'msg-1', senderId: match.user.id,
      text: match.lastMessage || 'Merhaba! 👋',
      timestamp: match.matchedAt, isRead: true
    }])
    setActiveTab('chat')
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa`
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const getLastSeenText = (minutes: number) => {
    if (minutes === 0) return 'Şu an burada'
    if (minutes < 5) return `${minutes} dk önce görüldü`
    return `${minutes} dk önce`
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Check-in Screen
  if (!isCheckedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <div className="p-4">
          <button onClick={() => router.back()}><ArrowLeft className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold mb-2">HERE</h1>
          <p className="text-gray-400 mb-8 max-w-xs">
            Aynı mekandaki insanlarla tanış. Gerçek hayatta, gerçek bağlantılar.
          </p>
          <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-2xl">☕</div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold">{currentVenue.name}</h3>
                <p className="text-sm text-gray-400">{currentVenue.type}</p>
              </div>
              <div className="text-right">
                <p className="text-pink-500 font-bold">{currentVenue.activeUsers}</p>
                <p className="text-xs text-gray-500">kişi burada</p>
              </div>
            </div>
          </div>
          <button onClick={handleCheckIn} className="w-full max-w-sm py-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5" />
            Buradayım - Başla
          </button>
          <p className="text-xs text-gray-500 mt-4 max-w-xs">
            Check-in yaparak bu mekandaki diğer HERE kullanıcılarını görebilirsin
          </p>
        </div>
      </div>
    )
  }

  // Chat View
  if (activeTab === 'chat' && selectedMatch) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10 p-4 flex items-center gap-4">
          <button onClick={() => { setActiveTab('matches'); setSelectedMatch(null); }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-xl">
            {selectedMatch.user.avatar}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">{selectedMatch.user.name}</h2>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {selectedMatch.user.isHere ? 'Şu an burada' : 'Çevrimdışı'}
            </p>
          </div>
          {selectedMatch.user.instagram && (
            <a href={`https://instagram.com/${selectedMatch.user.instagram}`} target="_blank" className="p-2 bg-white/10 rounded-full">
              <Instagram className="w-5 h-5 text-pink-500" />
            </a>
          )}
        </div>
        <div className="px-4 py-2 bg-pink-500/10 border-b border-pink-500/20">
          <p className="text-xs text-pink-400 text-center flex items-center justify-center gap-2">
            <MapPin className="w-3 h-3" />
            {selectedMatch.venue.name}'da eşleştiniz
          </p>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.senderId === 'me' ? 'bg-gradient-to-r from-pink-500 to-orange-500 rounded-br-md' : 'bg-[#2a2a2a] rounded-bl-md'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.senderId === 'me' ? 'text-white/70' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 bg-[#1a1a1a]">
          <div className="flex gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Mesaj yaz..." className="flex-1 px-4 py-3 bg-[#2a2a2a] rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()}><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />HERE
            </h1>
          </div>
        </div>
        {/* Venue Info - PROMINENT */}
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-2xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-pink-400">Şu an buradasın</p>
                <h3 className="font-bold">{currentVenue.name}</h3>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-500">{currentVenue.activeUsers}</p>
                <p className="text-xs text-gray-400">kişi burada</p>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex px-4 pb-4 gap-2">
          <button onClick={() => setActiveTab('discover')}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'discover' ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'
            }`}>
            <Users className="w-4 h-4" />Burada ({availableUsers.length})
          </button>
          <button onClick={() => setActiveTab('matches')}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors relative ${
              activeTab === 'matches' ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400'
            }`}>
            <MessageCircle className="w-4 h-4" />Eşleşmeler
            {matches.filter(m => m.unreadCount > 0).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {matches.filter(m => m.unreadCount > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="p-4">
          {currentUser ? (
            <div className="relative">
              <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden">
                <div className="h-80 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center relative">
                  <span className="text-9xl">{currentUser.avatar}</span>
                  {/* SAME VENUE BADGE - MAIN FOCUS */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="px-3 py-2 bg-green-500 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      Aynı Mekanda
                    </div>
                    <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getLastSeenText(currentUser.lastSeenMinutes)}
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold">{currentUser.name}, {currentUser.age}</h2>
                    <p className="text-sm text-white/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{currentVenue.name}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-gray-300">{currentUser.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.interests.map((interest, i) => (
                      <span key={i} className="px-3 py-1 bg-[#2a2a2a] rounded-full text-sm">{interest}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex justify-center gap-6 mt-6">
                <button onClick={handlePass} className="w-16 h-16 bg-[#1a1a1a] border-2 border-red-500 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors">
                  <X className="w-8 h-8 text-red-500" />
                </button>
                <button onClick={handleLike} className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform">
                  <Heart className="w-10 h-10" />
                </button>
                <button onClick={handleSuperLike} className="w-16 h-16 bg-[#1a1a1a] border-2 border-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <Zap className="w-8 h-8 text-blue-500" />
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">⚡ Süper Beğeni = Garantili eşleşme</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Herkesi gördün!</h3>
              <p className="text-gray-400 text-center max-w-xs">{currentVenue.name}'daki herkesi gördün. Biraz bekle, yeni insanlar gelecek.</p>
            </div>
          )}
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="p-4 space-y-4">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                <Heart className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Henüz eşleşme yok</h3>
              <p className="text-gray-400 text-center">"Burada" sekmesinden beğenmeye başla!</p>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-400">Eşleşmeler ({matches.length})</h3>
              {matches.map(match => (
                <button key={match.id} onClick={() => openChat(match)}
                  className="w-full bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-[#222] transition-colors">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-2xl">
                      {match.user.avatar}
                    </div>
                    {match.user.isHere && (
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-green-500 rounded-full text-[10px] font-bold">HERE</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{match.user.name}</h3>
                      <span className="text-xs text-gray-500">{formatTime(match.matchedAt)}</span>
                    </div>
                    <p className="text-xs text-pink-400 mb-1">{match.venue.name}</p>
                    <p className="text-sm text-gray-400 truncate">{match.lastMessage || 'Yeni eşleşme! 👋'}</p>
                  </div>
                  {match.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">{match.unreadCount}</div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Match Modal */}
      {showMatch && newMatchUser && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full mb-6">
              <MapPin className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-pink-400">{currentVenue.name}</span>
            </div>
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-5xl">👤</div>
              <Heart className="w-12 h-12 text-pink-500 fill-pink-500 animate-pulse" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-5xl">{newMatchUser.avatar}</div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">Eşleşme!</h2>
            <p className="text-gray-400 mb-2">Sen ve {newMatchUser.name} birbirinizi beğendiniz!</p>
            <p className="text-sm text-pink-400 mb-8">🎉 Aynı mekandasınız - şimdi tanışın!</p>
            <div className="flex gap-4">
              <button onClick={() => { setShowMatch(false); setNewMatchUser(null); }}
                className="flex-1 py-3 border border-white/20 rounded-xl font-medium">Keşfetmeye Devam</button>
              <button onClick={() => {
                setShowMatch(false)
                const match = matches.find(m => m.user.id === newMatchUser.id)
                if (match) openChat(match)
                setNewMatchUser(null)
              }} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl font-medium">Mesaj Gönder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
