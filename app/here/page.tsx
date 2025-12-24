'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, MapPin, Users, Heart, X, MessageCircle, 
  Send, ChevronLeft, Sparkles, Clock, Navigation,
  Zap, CheckCircle, Building2, Settings,
  Eye, EyeOff, LogOut, Shield, Ban, ExternalLink,
  ChevronRight, User, Calendar, Filter, AlertTriangle,
  Camera, Loader2, Trash2
} from 'lucide-react'
import { useHereProfile, useHereUsers } from '@/hooks/useHereProfile'
import { useI18n } from '@/lib/i18n'

// Types
interface HereUser {
  id: string
  nickname: string
  age: number
  avatar_url?: string
  bio: string
  interests: string[]
  gender: string
  orientation: string
  isHere: boolean
  lastSeenMinutes: number
  distance?: number
  venue?: string
  avatar_blur: boolean
}

interface Match {
  id: string
  user: HereUser
  venue: { id: string; name: string }
  matchedAt: string
  lastMessage?: string
  unreadCount: number
  chatApproved: boolean
  movedToTitChat: boolean
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
}

interface Venue {
  id: string
  name: string
  type: string
  activeUsers: number
}

// Demo Data
const currentVenue: Venue = {
  id: 'v1',
  name: "Nihal's Break Point",
  type: 'Kafe & Bar',
  activeUsers: 5
}

const demoUsersAtVenue: HereUser[] = [
  { id: 'u1', nickname: 'KahveSever', age: 26, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', bio: 'Kahve tutkunu ☕ Kitap kurdu 📚', interests: ['Kahve', 'Kitap', 'Seyahat'], gender: 'female', orientation: 'hetero', isHere: true, lastSeenMinutes: 2, venue: "Nihal's Break Point", avatar_blur: false },
  { id: 'u2', nickname: 'TechGuy', age: 28, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', bio: 'Yazılımcı 💻 Müzik sever 🎵', interests: ['Teknoloji', 'Müzik', 'Film'], gender: 'male', orientation: 'hetero', isHere: true, lastSeenMinutes: 5, venue: "Nihal's Break Point", avatar_blur: true },
  { id: 'u3', nickname: 'ArtLover', age: 24, avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', bio: 'Tasarımcı 🎨 Yoga lover 🧘‍♀️', interests: ['Tasarım', 'Yoga', 'Doğa'], gender: 'female', orientation: 'bisexual', isHere: true, lastSeenMinutes: 0, venue: "Nihal's Break Point", avatar_blur: false },
]

const nearbyUsers: HereUser[] = [
  { id: 'u4', nickname: 'FoodieChef', age: 30, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', bio: 'Gurme 🍷 Yemek bloggerı', interests: ['Yemek', 'Şarap', 'Fotoğraf'], gender: 'male', orientation: 'gay', isHere: false, lastSeenMinutes: 10, distance: 150, venue: 'Cafe Nero', avatar_blur: false },
  { id: 'u5', nickname: 'DancerPM', age: 27, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', bio: 'PM 📊 Dans etmeyi seviyorum 💃', interests: ['İş', 'Dans', 'Netflix'], gender: 'female', orientation: 'hetero', isHere: false, lastSeenMinutes: 3, distance: 320, venue: 'Starbucks', avatar_blur: true },
]

type TabType = 'venue' | 'nearby' | 'messages' | 'chat' | 'profile' | 'setup'

export default function HerePage() {
  const router = useRouter()
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('venue')
  
  // Use Supabase hook
  const { 
    profile, 
    checkin,
    loading, 
    isLoggedIn,
    hasProfile, 
    isCheckedIn,
    createProfile, 
    updateProfile,
    deleteProfile,
    checkIn, 
    checkOut,
    setInvisibleMode,
    uploadAvatar 
  } = useHereProfile()

  // Get users at current venue (real-time)
  const { users: venueUsers } = useHereUsers(isCheckedIn ? currentVenue.id : null)
  
  // Profile Setup State
  const [setupStep, setSetupStep] = useState(1)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarBlur, setAvatarBlur] = useState(true)
  const [gender, setGender] = useState('')
  const [orientation, setOrientation] = useState('prefer_not_say')
  const [lookingFor, setLookingFor] = useState('everyone')
  const [ageRangeMin, setAgeRangeMin] = useState(18)
  const [ageRangeMax, setAgeRangeMax] = useState(99)
  const [birthYear, setBirthYear] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Matching State
  const [matches, setMatches] = useState<Match[]>([])
  const [likedUsers, setLikedUsers] = useState<string[]>([])
  const [passedUsers, setPassedUsers] = useState<string[]>([])
  const [showMatch, setShowMatch] = useState(false)
  const [newMatchUser, setNewMatchUser] = useState<HereUser | null>(null)
  
  // Chat State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showTitChatModal, setShowTitChatModal] = useState(false)
  
  // Filter State
  const [showFilters, setShowFilters] = useState(false)
  const [filterGender, setFilterGender] = useState<string[]>([])
  const [filterAgeRange, setFilterAgeRange] = useState<{min: number, max: number} | null>(null)

  // Dynamic options with translations
  const orientationOptions = [
    { id: 'hetero', label: t('here.orientationHetero') },
    { id: 'gay', label: t('here.orientationGay') },
    { id: 'lesbian', label: t('here.orientationLesbian') },
    { id: 'bisexual', label: t('here.orientationBisexual') },
    { id: 'other', label: t('here.orientationOther') },
    { id: 'prefer_not_say', label: t('here.orientationPreferNotSay') },
  ]

  const lookingForOptions = [
    { id: 'men', label: t('here.lookingForMen') },
    { id: 'women', label: t('here.lookingForWomen') },
    { id: 'everyone', label: t('here.lookingForEveryone') },
  ]

  const genderOptions = [
    { id: 'male', label: t('here.genderMale') },
    { id: 'female', label: t('here.genderFemale') },
    { id: 'non_binary', label: t('here.genderNonBinary') },
    { id: 'other', label: t('here.genderOther') },
  ]

  const ageRanges = [
    { min: 18, max: 25, label: '18-25' },
    { min: 25, max: 35, label: '25-35' },
    { min: 35, max: 45, label: '35-45' },
    { min: 45, max: 99, label: '45+' },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || null)
      setAvatarBlur(profile.avatar_blur ?? true)
      setGender(profile.gender || '')
      setOrientation(profile.orientation || 'prefer_not_say')
      setLookingFor(profile.looking_for || 'everyone')
      setAgeRangeMin(profile.age_range_min || 18)
      setAgeRangeMax(profile.age_range_max || 99)
    }
  }, [profile])

  // Merge real users with demo users
  const usersAtVenue: HereUser[] = venueUsers.length > 0 
    ? venueUsers.map((u: any) => ({
        id: u.id,
        nickname: u.nickname,
        age: u.birth_date ? new Date().getFullYear() - new Date(u.birth_date).getFullYear() : 25,
        avatar_url: u.avatar_url,
        bio: u.bio || '',
        interests: [],
        gender: u.gender,
        orientation: u.orientation,
        isHere: true,
        lastSeenMinutes: Math.floor((Date.now() - new Date(u.last_active_at || u.checked_in_at).getTime()) / 60000),
        venue: currentVenue.name,
        avatar_blur: u.avatar_blur
      }))
    : demoUsersAtVenue

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(t('here.photoLimit'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t('here.photoLimit'))
      return
    }

    setUploading(true)

    try {
      const url = await uploadAvatar(file)
      if (url) {
        setAvatarUrl(url)
      } else {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAvatarUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error('Upload error:', error)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = () => {
    setAvatarUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const saveProfile = async () => {
    const profileData = {
      nickname,
      bio,
      avatar_url: avatarUrl || undefined,
      avatar_blur: avatarBlur,
      orientation,
      looking_for: lookingFor,
      age_range_min: ageRangeMin,
      age_range_max: ageRangeMax,
      gender,
      birth_date: birthYear ? `${birthYear}-01-01` : undefined,
    }

    let success: boolean
    if (hasProfile) {
      success = await updateProfile(profileData)
    } else {
      success = await createProfile(profileData)
    }

    if (success) {
      setActiveTab('venue')
    }
  }

  const handleCheckIn = async () => {
    await checkIn(currentVenue.id, currentVenue.name)
  }

  const handleCheckOut = async () => {
    await checkOut()
  }

  const handleDeleteProfile = async () => {
    if (confirm(t('here.deleteProfileConfirm'))) {
      const success = await deleteProfile()
      if (success) {
        setActiveTab('venue')
      }
    }
  }

  const handleToggleInvisible = async () => {
    if (profile) {
      await setInvisibleMode(!profile.invisible_mode)
    }
  }

  // Filter users based on preferences
  const filterUsers = (users: HereUser[]) => {
    return users.filter(user => {
      if (filterGender.length > 0 && !filterGender.includes(user.gender)) return false
      if (filterAgeRange && (user.age < filterAgeRange.min || user.age > filterAgeRange.max)) return false
      if (profile) {
        if (profile.looking_for === 'men' && user.gender !== 'male') return false
        if (profile.looking_for === 'women' && user.gender !== 'female') return false
      }
      return true
    })
  }

  const availableVenueUsers = filterUsers(usersAtVenue.filter(u => !likedUsers.includes(u.id) && !passedUsers.includes(u.id)))
  const currentVenueUser = availableVenueUsers[0]

  const availableNearbyUsers = filterUsers(nearbyUsers.filter(u => !likedUsers.includes(u.id) && !passedUsers.includes(u.id)))
  const currentNearbyUser = availableNearbyUsers[0]

  const handleLike = (user: HereUser) => {
    setLikedUsers(prev => [...prev, user.id])
    if (Math.random() > 0.5) {
      setNewMatchUser(user)
      setShowMatch(true)
      setMatches(prev => [{
        id: `m-${Date.now()}`, user, venue: currentVenue,
        matchedAt: new Date().toISOString(), unreadCount: 0,
        chatApproved: false, movedToTitChat: false
      }, ...prev])
    }
  }

  const handlePass = (userId: string) => {
    setPassedUsers(prev => [...prev, userId])
  }

  const handleSuperLike = (user: HereUser) => {
    setLikedUsers(prev => [...prev, user.id])
    setNewMatchUser(user)
    setShowMatch(true)
    setMatches(prev => [{
      id: `m-${Date.now()}`, user, venue: currentVenue,
      matchedAt: new Date().toISOString(), unreadCount: 0,
      chatApproved: false, movedToTitChat: false
    }, ...prev])
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedMatch) return
    const msg: Message = { id: `msg-${Date.now()}`, senderId: 'me', text: newMessage, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, msg])
    setNewMessage('')
    
    if (messages.length >= 2) {
      setTimeout(() => setShowTitChatModal(true), 1000)
    } else {
      setTimeout(() => {
        const replies = ['Merhaba! 😊', 'Hangi köşedesin?', 'Tanıştığıma memnun oldum!', 'Çok tatlısın 💕']
        const reply: Message = { id: `msg-${Date.now()}`, senderId: selectedMatch.user.id, text: replies[Math.floor(Math.random() * replies.length)], timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, reply])
      }, 2000)
    }
  }

  const openChat = (match: Match) => {
    setSelectedMatch(match)
    setMessages([{ id: 'msg-1', senderId: match.user.id, text: match.lastMessage || 'Merhaba! 👋', timestamp: match.matchedAt }])
    setActiveTab('chat')
  }

  const moveToTitChat = () => {
    alert(t('here.openingTitChat'))
    setShowTitChatModal(false)
    if (selectedMatch) {
      setMatches(prev => prev.map(m => m.id === selectedMatch.id ? { ...m, movedToTitChat: true } : m))
    }
  }

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa`
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const getLastSeenText = (minutes: number) => {
    if (minutes === 0) return t('here.justNow')
    return t('here.minutesAgo', { count: minutes })
  }
  
  const formatDistance = (meters: number) => meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`

  const calculateAge = (birthYear: string) => {
    if (!birthYear) return null
    return new Date().getFullYear() - parseInt(birthYear)
  }

  // Avatar Component
  const AvatarImage = ({ src, blur, size = 'md', className = '' }: { src?: string, blur?: boolean, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) => {
    const sizeClasses = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-24 h-24', xl: 'w-32 h-32' }
    
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center ${className}`}>
        {src ? (
          <img src={src} alt="Avatar" className={`w-full h-full object-cover ${blur ? 'blur-lg scale-110' : ''}`} />
        ) : (
          <User className={`${size === 'xl' ? 'w-16 h-16' : size === 'lg' ? 'w-12 h-12' : 'w-6 h-6'} text-white/70`} />
        )}
      </div>
    )
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('here.title')}</h1>
        <p className="text-gray-400 text-center mb-8">{t('here.subtitle')}</p>
        <button 
          onClick={() => router.push('/auth')}
          className="w-full max-w-sm py-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl font-bold"
        >
          {t('here.login')}
        </button>
      </div>
    )
  }

  // PROFILE SETUP SCREEN
  if (!hasProfile || activeTab === 'setup') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <button onClick={() => hasProfile ? setActiveTab('venue') : router.back()}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{hasProfile ? t('here.editProfile') : t('here.createProfile')}</h1>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 flex gap-2">
          {[1, 2, 3].map(step => (
            <div key={step} className={`flex-1 h-1 rounded-full ${setupStep >= step ? 'bg-pink-500' : 'bg-white/20'}`} />
          ))}
        </div>

        <div className="p-4">
          {/* Step 1: Basic Info */}
          {setupStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('here.step1Title')}</h2>
                <p className="text-gray-400">{t('here.step1Subtitle')}</p>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <AvatarImage src={avatarUrl || undefined} blur={false} size="xl" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                  {avatarUrl && !uploading && (
                    <button onClick={removePhoto} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />

                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500 rounded-xl font-medium disabled:opacity-50">
                    <Camera className="w-4 h-4" />
                    {avatarUrl ? t('here.changePhoto') : t('here.addPhoto')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('here.photoLimit')}</p>
              </div>

              {/* Avatar Blur Toggle */}
              <button onClick={() => setAvatarBlur(!avatarBlur)}
                className={`w-full flex items-center justify-between p-4 rounded-xl ${avatarBlur ? 'bg-pink-500/20 border border-pink-500' : 'bg-[#1a1a1a]'}`}>
                <div className="flex items-center gap-3">
                  {avatarBlur ? <EyeOff className="w-5 h-5 text-pink-500" /> : <Eye className="w-5 h-5" />}
                  <div className="text-left">
                    <p className="font-medium">{t('here.blurPhoto')}</p>
                    <p className="text-xs text-gray-400">{t('here.blurPhotoDesc')}</p>
                  </div>
                </div>
                {avatarBlur && <CheckCircle className="w-5 h-5 text-pink-500" />}
              </button>

              {avatarUrl && avatarBlur && (
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-3 text-center">{t('here.othersWillSee')}</p>
                  <div className="flex justify-center">
                    <AvatarImage src={avatarUrl} blur={true} size="lg" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.nickname')} *</label>
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20}
                  placeholder={t('here.nicknamePlaceholder')}
                  className="w-full px-4 py-3 bg-[#1a1a1a] rounded-xl outline-none focus:ring-2 focus:ring-pink-500" />
                <p className="text-xs text-gray-500 mt-1">{t('here.nicknameLimit', { count: nickname.length })}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.about')}</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150}
                  placeholder={t('here.aboutPlaceholder')}
                  className="w-full px-4 py-3 bg-[#1a1a1a] rounded-xl outline-none focus:ring-2 focus:ring-pink-500 h-24 resize-none" />
                <p className="text-xs text-gray-500 mt-1">{t('here.aboutLimit', { count: bio.length })}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.birthYear')} *</label>
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] rounded-xl outline-none focus:ring-2 focus:ring-pink-500">
                  <option value="">{t('here.select')}</option>
                  {Array.from({ length: 50 }, (_, i) => 2006 - i).map(year => (
                    <option key={year} value={year}>{year} ({2024 - year} {t('here.yearsOld')})</option>
                  ))}
                </select>
              </div>

              <button onClick={() => setSetupStep(2)} disabled={!nickname || !birthYear || calculateAge(birthYear)! < 18}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl font-bold disabled:opacity-50">
                {t('here.continue')}
              </button>

              {birthYear && calculateAge(birthYear)! < 18 && (
                <p className="text-red-500 text-sm text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('here.ageRestriction')}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Gender & Orientation */}
          {setupStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('here.step2Title')}</h2>
                <p className="text-gray-400">{t('here.step2Subtitle')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.genderTitle')} *</label>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map(opt => (
                    <button key={opt.id} onClick={() => setGender(opt.id)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium ${gender === opt.id ? 'bg-pink-500 text-white' : 'bg-[#1a1a1a] text-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.orientationTitle')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {orientationOptions.map(opt => (
                    <button key={opt.id} onClick={() => setOrientation(opt.id)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium ${orientation === opt.id ? 'bg-pink-500 text-white' : 'bg-[#1a1a1a] text-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSetupStep(1)} className="flex-1 py-4 border border-white/20 rounded-xl font-medium">{t('here.back')}</button>
                <button onClick={() => setSetupStep(3)} disabled={!gender}
                  className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl font-bold disabled:opacity-50">{t('here.continue')}</button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {setupStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{t('here.step3Title')}</h2>
                <p className="text-gray-400">{t('here.step3Subtitle')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.lookingForTitle')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {lookingForOptions.map(opt => (
                    <button key={opt.id} onClick={() => setLookingFor(opt.id)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium ${lookingFor === opt.id ? 'bg-pink-500 text-white' : 'bg-[#1a1a1a] text-gray-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.ageRangeTitle')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ageRanges.map(range => (
                    <button key={range.label} onClick={() => { setAgeRangeMin(range.min); setAgeRangeMax(range.max); }}
                      className={`py-3 px-4 rounded-xl text-sm font-medium ${ageRangeMin === range.min && ageRangeMax === range.max ? 'bg-pink-500 text-white' : 'bg-[#1a1a1a] text-gray-300'}`}>
                      {range.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setAgeRangeMin(18); setAgeRangeMax(99); }}
                  className={`w-full mt-2 py-3 rounded-xl text-sm font-medium ${ageRangeMin === 18 && ageRangeMax === 99 ? 'bg-pink-500 text-white' : 'bg-[#1a1a1a] text-gray-300'}`}>
                  {t('here.allAges')}
                </button>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t('here.privacyInfo')}
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSetupStep(2)} className="flex-1 py-4 border border-white/20 rounded-xl font-medium">{t('here.back')}</button>
                <button onClick={saveProfile} className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl font-bold">
                  {hasProfile ? t('here.save') : t('here.createProfile')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // CHAT VIEW
  if (activeTab === 'chat' && selectedMatch) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10 p-4 flex items-center gap-4">
          <button onClick={() => { setActiveTab('messages'); setSelectedMatch(null); }}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <AvatarImage src={selectedMatch.user.avatar_url} blur={selectedMatch.user.avatar_blur} size="sm" />
          <div className="flex-1">
            <h2 className="font-semibold">{selectedMatch.user.nickname}</h2>
            <p className="text-xs text-gray-400">{t('here.chatWithNickname')}</p>
          </div>
          <button onClick={() => setShowTitChatModal(true)} className="p-2 bg-green-500/20 rounded-full">
            <ExternalLink className="w-5 h-5 text-green-500" />
          </button>
        </div>

        <div className="px-4 py-2 bg-pink-500/10 border-b border-pink-500/20">
          <p className="text-xs text-pink-400 text-center">{t('here.namesHiddenNote')}</p>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto pb-24">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.senderId === 'me' ? 'bg-gradient-to-r from-pink-500 to-orange-500 rounded-br-md' : 'bg-[#2a2a2a] rounded-bl-md'}`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.senderId === 'me' ? 'text-white/70' : 'text-gray-500'}`}>{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#1a1a1a]">
          <div className="flex gap-2">
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t('here.typeMessage')} className="flex-1 px-4 py-3 bg-[#2a2a2a] rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500" />
            <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showTitChatModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t('here.moveToTitChat')}</h2>
                <p className="text-gray-400 text-sm">{t('here.moveToTitChatDesc')}</p>
              </div>
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3 mb-6">
                <p className="text-xs text-yellow-400 text-center">{t('here.bothMustApprove')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTitChatModal(false)} className="flex-1 py-3 border border-white/20 rounded-xl font-medium">{t('here.stayHere')}</button>
                <button onClick={moveToTitChat} className="flex-1 py-3 bg-green-500 rounded-xl font-medium">{t('here.approve')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // PROFILE VIEW
  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <button onClick={() => setActiveTab('venue')}><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('here.profileSettings')}</h1>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-4">
              <AvatarImage src={profile?.avatar_url} blur={profile?.avatar_blur} size="lg" />
            </div>
            <h2 className="text-xl font-bold">{profile?.nickname}</h2>
            <p className="text-gray-400 text-sm mt-1">{profile?.bio}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">
                {genderOptions.find(g => g.id === profile?.gender)?.label}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                {orientationOptions.find(o => o.id === profile?.orientation)?.label}
              </span>
            </div>
          </div>

          <button onClick={() => { setSetupStep(1); setActiveTab('setup'); }}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span>{t('here.editProfile')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={handleToggleInvisible} className="w-full bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <p>{t('here.invisibleMode')}</p>
                <p className="text-xs text-gray-500">{t('here.invisibleModeDesc')}</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full ${profile?.invisible_mode ? 'bg-pink-500' : 'bg-gray-600'} relative`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${profile?.invisible_mode ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </button>

          <button className="w-full bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ban className="w-5 h-5 text-gray-400" />
              <span>{t('here.blockedUsers')}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={handleDeleteProfile}
            className="w-full bg-red-500/20 text-red-400 rounded-xl p-4 flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />
            {t('here.deleteProfile')}
          </button>
        </div>
      </div>
    )
  }

  // User Card Component
  const UserCard = ({ user, showVenueBadge = false, showDistance = false }: { user: HereUser, showVenueBadge?: boolean, showDistance?: boolean }) => (
    <div className="relative">
      <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden">
        <div className="h-96 relative">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.nickname} className={`w-full h-full object-cover ${user.avatar_blur ? 'blur-xl scale-110' : ''}`} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center">
              <User className="w-24 h-24 text-white/50" />
            </div>
          )}
          
          {user.avatar_blur && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-black/60 px-4 py-2 rounded-full">
                <p className="text-sm">{t('here.visibleAfterMatch')}</p>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {showVenueBadge && (
              <div className="px-3 py-2 bg-green-500 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                <CheckCircle className="w-4 h-4" />{t('here.sameVenue')}
              </div>
            )}
            {showDistance && user.distance && (
              <div className="px-3 py-2 bg-blue-500 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                <Navigation className="w-4 h-4" />{formatDistance(user.distance)}
              </div>
            )}
            <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />{getLastSeenText(user.lastSeenMinutes)}
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-2xl font-bold">{user.nickname}, {user.age}</h2>
            <p className="text-sm text-white/80 flex items-center gap-1">
              {showDistance && user.venue ? (
                <><Building2 className="w-3 h-3" />{user.venue}</>
              ) : (
                <><MapPin className="w-3 h-3" />{currentVenue.name}</>
              )}
            </p>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-gray-300">{user.bio}</p>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest, i) => (
              <span key={i} className="px-3 py-1 bg-[#2a2a2a] rounded-full text-sm">{interest}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">
              {genderOptions.find(g => g.id === user.gender)?.label}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mt-6">
        <button onClick={() => handlePass(user.id)} className="w-16 h-16 bg-[#1a1a1a] border-2 border-red-500 rounded-full flex items-center justify-center hover:bg-red-500/20">
          <X className="w-8 h-8 text-red-500" />
        </button>
        <button onClick={() => handleLike(user)} className="w-20 h-20 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105">
          <Heart className="w-10 h-10" />
        </button>
        <button onClick={() => handleSuperLike(user)} className="w-16 h-16 bg-[#1a1a1a] border-2 border-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500/20">
          <Zap className="w-8 h-8 text-blue-500" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-4">{t('here.superLikeNote')}</p>
    </div>
  )

  const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
        <Icon className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-xs">{subtitle}</p>
    </div>
  )

  // MAIN VIEW
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()}><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />{t('here.title')}
            </h1>
          </div>
          <button onClick={() => setShowFilters(true)} className="p-2 hover:bg-white/10 rounded-full">
            <Filter className="w-5 h-5 text-gray-400" />
          </button>
          <button onClick={() => setActiveTab('profile')} className="p-2 hover:bg-white/10 rounded-full">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex px-4 pb-4 gap-2">
          <button onClick={() => setActiveTab('venue')}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${activeTab === 'venue' ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
            <Building2 className="w-4 h-4" />{t('here.tabVenue')}
          </button>
          <button onClick={() => setActiveTab('nearby')}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${activeTab === 'nearby' ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
            <Navigation className="w-4 h-4" />{t('here.tabNearby')}
          </button>
          <button onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 relative ${activeTab === 'messages' ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-[#1a1a1a] text-gray-400'}`}>
            <MessageCircle className="w-4 h-4" />{t('here.tabMessages')}
            {matches.filter(m => m.unreadCount > 0).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {matches.filter(m => m.unreadCount > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MEKANDA Tab */}
      {activeTab === 'venue' && (
        <>
          {!isCheckedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-8">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                <Building2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('here.checkInTitle')}</h2>
              <p className="text-gray-400 mb-8 max-w-xs">{t('here.checkInSubtitle')}</p>
              <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-2xl">☕</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{currentVenue.name}</h3>
                    <p className="text-sm text-gray-400">{currentVenue.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-pink-500 font-bold">{currentVenue.activeUsers}</p>
                    <p className="text-xs text-gray-500">{t('here.person')}</p>
                  </div>
                </div>
              </div>
              <button onClick={handleCheckIn} className="w-full max-w-sm py-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />{t('here.checkIn')}
              </button>
              <p className="text-xs text-gray-500 mt-4 max-w-xs">{t('here.autoCheckoutNote')}</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-2xl p-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-pink-400">{t('here.checkedIn')}</p>
                    <h3 className="font-bold">{checkin?.venue_name || currentVenue.name}</h3>
                  </div>
                  <button onClick={handleCheckOut} className="p-2 hover:bg-white/10 rounded-full">
                    <LogOut className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {currentVenueUser ? (
                <UserCard user={currentVenueUser} showVenueBadge={true} />
              ) : (
                <EmptyState icon={Users} title={t('here.seenEveryone')} subtitle={t('here.waitForMore')} />
              )}
            </div>
          )}
        </>
      )}

      {/* YAKINDA Tab */}
      {activeTab === 'nearby' && (
        <div className="p-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-400">{t('here.nearbyTitle')}</p>
                <h3 className="font-bold">{t('here.nearbyRadius')}</h3>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-500">{availableNearbyUsers.length}</p>
                <p className="text-xs text-gray-400">{t('here.person')}</p>
              </div>
            </div>
          </div>

          {currentNearbyUser ? (
            <UserCard user={currentNearbyUser} showDistance={true} />
          ) : (
            <EmptyState icon={Navigation} title={t('here.noOneNearby')} subtitle={t('here.noOneNearbyDesc')} />
          )}
        </div>
      )}

      {/* MESAJLAR Tab */}
      {activeTab === 'messages' && (
        <div className="p-4 space-y-4">
          {matches.length === 0 ? (
            <EmptyState icon={Heart} title={t('here.noMatches')} subtitle={t('here.startLiking')} />
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-400">{t('here.matchesTitle')} ({matches.length})</h3>
              {matches.map(match => (
                <button key={match.id} onClick={() => openChat(match)}
                  className="w-full bg-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-[#222]">
                  <div className="relative">
                    <AvatarImage src={match.user.avatar_url} blur={match.user.avatar_blur} size="md" />
                    {match.user.isHere && (
                      <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-green-500 rounded-full text-[10px] font-bold">HERE</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{match.user.nickname}</h3>
                      <span className="text-xs text-gray-500">{formatTime(match.matchedAt)}</span>
                    </div>
                    <p className="text-xs text-pink-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{match.venue.name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{match.lastMessage || t('here.newMatch')}</p>
                  </div>
                  {match.movedToTitChat && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">{t('here.titChat')}</span>
                  )}
                  {match.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs font-bold">{match.unreadCount}</div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/80 z-50">
          <div className="absolute inset-x-0 bottom-0 bg-[#1a1a1a] rounded-t-3xl p-4" style={{ maxHeight: '60vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('here.filtersTitle')}</h2>
              <button onClick={() => setShowFilters(false)}><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.genderTitle')}</label>
                <div className="flex flex-wrap gap-2">
                  {genderOptions.map(opt => (
                    <button key={opt.id} onClick={() => setFilterGender(prev => prev.includes(opt.id) ? prev.filter(g => g !== opt.id) : [...prev, opt.id])}
                      className={`px-4 py-2 rounded-xl text-sm ${filterGender.includes(opt.id) ? 'bg-pink-500' : 'bg-[#242424]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">{t('here.ageRangeTitle')}</label>
                <div className="flex flex-wrap gap-2">
                  {ageRanges.map(range => (
                    <button key={range.label} onClick={() => setFilterAgeRange(filterAgeRange?.min === range.min ? null : range)}
                      className={`px-4 py-2 rounded-xl text-sm ${filterAgeRange?.min === range.min ? 'bg-pink-500' : 'bg-[#242424]'}`}>
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => { setFilterGender([]); setFilterAgeRange(null); setShowFilters(false); }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl font-medium">
                {t('here.apply')}
              </button>
            </div>
          </div>
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
              <AvatarImage src={profile?.avatar_url} blur={false} size="lg" />
              <Heart className="w-12 h-12 text-pink-500 fill-pink-500 animate-pulse" />
              <AvatarImage src={newMatchUser.avatar_url} blur={false} size="lg" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">{t('here.itsAMatch')}</h2>
            <p className="text-gray-400 mb-2">{t('here.youBothLiked', { name: newMatchUser.nickname })}</p>
            <p className="text-sm text-gray-500 mb-8">{t('here.namesStillHidden')}</p>
            <div className="flex gap-4">
              <button onClick={() => { setShowMatch(false); setNewMatchUser(null); }} className="flex-1 py-3 border border-white/20 rounded-xl font-medium">{t('here.keepSwiping')}</button>
              <button onClick={() => {
                setShowMatch(false)
                const match = matches.find(m => m.user.id === newMatchUser.id)
                if (match) openChat(match)
                setNewMatchUser(null)
              }} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl font-medium">{t('here.sendMessage')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
