'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
})

export const useAuth = () => useContext(AuthContext)

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return
    
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (mounted && currentSession?.user) {
          setSession(currentSession)
          setUser(formatUser(currentSession.user))
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession)
          setUser(formatUser(newSession.user))
        } 
        else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
        }
        else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [initialized])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}
