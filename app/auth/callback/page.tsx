'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the redirect URL from query params
        const redirectTo = searchParams.get('redirect') || '/'
        
        // Check for error in URL (OAuth error)
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorParam) {
          setStatus('error')
          setError(errorDescription || errorParam)
          return
        }

        // Exchange the code for a session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setError(error.message)
          return
        }

        if (data.session) {
          console.log('Session established, user:', data.session.user.email)
          
          // Create or update user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.session.user.id,
              full_name: data.session.user.user_metadata?.full_name || '',
              avatar_url: data.session.user.user_metadata?.avatar_url || '',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          if (profileError) {
            console.error('Profile upsert error:', profileError)
          }

          setStatus('success')
          
          // Redirect after a brief delay to show success
          setTimeout(() => {
            router.replace(redirectTo)
          }, 500)
        } else {
          // No session, might need to wait for hash fragment
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          
          if (accessToken) {
            // Set session from hash
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || ''
            })

            if (sessionError) {
              setStatus('error')
              setError(sessionError.message)
              return
            }

            if (sessionData.session) {
              setStatus('success')
              setTimeout(() => {
                router.replace(redirectTo)
              }, 500)
              return
            }
          }

          // Still no session, redirect to login
          setStatus('error')
          setError('Oturum oluşturulamadı. Lütfen tekrar deneyin.')
        }
      } catch (err: any) {
        console.error('Callback error:', err)
        setStatus('error')
        setError(err.message || 'Bir hata oluştu')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Giriş yapılıyor...</p>
            <p className="text-gray-400 text-sm mt-2">Lütfen bekleyin</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Giriş başarılı!</p>
            <p className="text-gray-400 text-sm mt-2">Yönlendiriliyorsunuz...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Giriş başarısız</p>
            <p className="text-red-400 text-sm mt-2">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 px-6 py-3 bg-orange-500 rounded-xl font-medium text-white"
            >
              Tekrar Dene
            </button>
          </>
        )}
      </div>
    </div>
  )
}
