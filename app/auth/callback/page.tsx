'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const handleCallback = async () => {
      try {
        const redirectTo = searchParams.get('redirect') || '/'
        const errorParam = searchParams.get('error')
        
        if (errorParam) {
          if (isMounted) {
            setStatus('error')
            setError(searchParams.get('error_description') || errorParam)
          }
          return
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) {
          if (isMounted) {
            setStatus('error')
            setError(error.message)
          }
          return
        }

        if (data.session) {
          // Profil var mı kontrol et, yoksa oluştur
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single()
          
          if (!existingProfile) {
            await supabase.from('user_profiles').insert({
              id: data.session.user.id,
              full_name: data.session.user.user_metadata?.full_name || '',
              avatar_url: data.session.user.user_metadata?.avatar_url || ''
            })
          }

          if (isMounted) {
            setStatus('success')
            setTimeout(() => router.replace(redirectTo), 500)
          }
        } else {
          if (isMounted) {
            setStatus('error')
            setError('Oturum oluşturulamadı')
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error')
          setError(err.message || 'Bir hata oluştu')
        }
      }
    }
    
    handleCallback()
    
    return () => { isMounted = false }
  }, [router, searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Giriş yapılıyor...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-white">Giriş başarılı!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-white mb-2">Giriş başarısız</p>
        <p className="text-red-400 text-sm mb-6">{error}</p>
        <button onClick={() => router.push('/login')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium text-white">
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-12 h-12 text-orange-500 animate-spin" /></div>}>
      <CallbackContent />
    </Suspense>
  )
}
