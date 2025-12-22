'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from './supabase'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

// Kullanıcı profili (customer_profiles tablosundan)
interface UserProfile {
  id: string
  user_id: string
  display_name: string
  phone?: string
  avatar_url?: string
  anonymous_id: string
  created_at: string
}

// Context'ten dönen user objesi
interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  // Temel auth state
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  
  // Auth actions
  signIn: (userData: User) => void  // Demo login için (backward compatibility)
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  
  // Profile helpers
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signIn: () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Anonymous ID generator (kullanıcı kayıt olduğunda profile'a yazılır)
function generateAnonymousId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'ORD-'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Supabase user'ı bizim User formatına çevir
  const formatUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || 
          supabaseUser.user_metadata?.name || 
          supabaseUser.email?.split('@')[0] || 
          'Kullanıcı',
    avatar: supabaseUser.user_metadata?.avatar_url || 
            supabaseUser.user_metadata?.picture
  })

  // Profil yükle veya oluştur
  const loadOrCreateProfile = useCallback(async (userId: string, userName: string): Promise<UserProfile | null> => {
    try {
      // Önce mevcut profili ara
      const { data: existingProfile, error: fetchError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existingProfile) {
        return existingProfile
      }

      // Profil yoksa oluştur
      if (fetchError?.code === 'PGRST116') { // Not found
        const newProfile = {
          user_id: userId,
          display_name: userName,
          anonymous_id: generateAnonymousId()
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('customer_profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error('Profile create error:', createError)
          // Tablo yoksa bile devam et, sadece profile null olur
          return null
        }

        return createdProfile
      }

      return null
    } catch (err) {
      console.error('Profile load error:', err)
      return null
    }
  }, [])

  // Session değişikliklerini dinle
  useEffect(() => {
    let mounted = true

    // İlk yüklemede session kontrolü
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (mounted && currentSession?.user) {
          const formattedUser = formatUser(currentSession.user)
          setSession(currentSession)
          setUser(formattedUser)
          
          // Profil yükle
          const userProfile = await loadOrCreateProfile(currentSession.user.id, formattedUser.name)
          if (mounted) setProfile(userProfile)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event)
        
        if (!mounted) return

        if (event === 'SIGNED_IN' && newSession?.user) {
          const formattedUser = formatUser(newSession.user)
          setSession(newSession)
          setUser(formattedUser)
          
          // Profil yükle
          const userProfile = await loadOrCreateProfile(newSession.user.id, formattedUser.name)
          if (mounted) setProfile(userProfile)
        } 
        else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
        else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession)
        }

        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadOrCreateProfile])

  // Google ile giriş
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  // Çıkış yap
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
    }
    // State'ler onAuthStateChange'de temizlenecek
  }

  // Demo/manual sign in (backward compatibility)
  const signIn = (userData: User) => {
    setUser(userData)
    // Demo user için basit profile oluştur
    setProfile({
      id: 'demo-profile',
      user_id: userData.id,
      display_name: userData.name,
      anonymous_id: 'DEMO-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      created_at: new Date().toISOString()
    })
  }

  // Profili yenile
  const refreshProfile = async () => {
    if (!user) return
    const userProfile = await loadOrCreateProfile(user.id, user.name)
    setProfile(userProfile)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      loading, 
      signIn, 
      signOut, 
      signInWithGoogle,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
