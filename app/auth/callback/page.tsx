'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL hash'ten session al
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=callback_failed')
          return
        }

        if (data.session) {
          // Başarılı giriş - ana sayfaya yönlendir
          router.push('/')
        } else {
          // Session yok - tekrar dene
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            router.push('/auth?error=no_session')
          } else {
            router.push('/')
          }
        }
      } catch (err) {
        console.error('Callback error:', err)
        router.push('/auth?error=unknown')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
      <p className="text-gray-400">Giriş yapılıyor...</p>
    </div>
  )
}
