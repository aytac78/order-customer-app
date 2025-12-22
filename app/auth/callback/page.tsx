'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Giriş yapılıyor...')
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleAuth = async () => {
      try {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session error:', error)
            setStatus('Giriş başarısız')
            setTimeout(() => router.replace('/auth'), 1500)
            return
          }

          if (data?.session) {
            setStatus('Başarılı! Yönlendiriliyorsunuz...')
            const redirectTo = localStorage.getItem('auth_redirect') || '/'
            localStorage.removeItem('auth_redirect')
            
            // Force navigation
            setTimeout(() => {
              router.replace(redirectTo)
            }, 300)
            return
          }
        }

        // Fallback: check existing session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus('Başarılı! Yönlendiriliyorsunuz...')
          const redirectTo = localStorage.getItem('auth_redirect') || '/'
          localStorage.removeItem('auth_redirect')
          setTimeout(() => router.replace(redirectTo), 300)
        } else {
          setStatus('Giriş başarısız')
          setTimeout(() => router.replace('/auth'), 1500)
        }
      } catch (err) {
        console.error('Auth error:', err)
        setStatus('Hata oluştu')
        setTimeout(() => router.replace('/auth'), 1500)
      }
    }

    // Small delay to ensure hash is available
    setTimeout(handleAuth, 100)
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{status}</p>
      </div>
    </div>
  )
}
