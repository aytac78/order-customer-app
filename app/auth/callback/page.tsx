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
    const handleCallback = async () => {
      try {
        const redirectTo = searchParams.get('redirect') || '/'
        const errorParam = searchParams.get('error')
        
        if (errorParam) {
          setStatus('error')
          setError(searchParams.get('error_description') || errorParam)
          return
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setStatus('error')
          setError(error.message)
          return
        }

        if (data.session) {
          await supabase.from('user_profiles').upsert({
            id: data.session.user.id,
            full_name: data.session.user.user_metadata?.full_name || '',
            avatar_url: data.session.user.user_metadata?.avatar_url || '',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })

          setStatus('success')
          setTimeout(() => router.replace(redirectTo), 500)
        } else {
          setStatus('error')
          setError('Oturum oluşturulamadı')
        }
      } catch (err: any) {
        setStatus('error')
        setError(err.message || 'Bir hata oluştu')
      }
    }
    handleCallback()
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
