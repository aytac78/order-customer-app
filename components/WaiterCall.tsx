'use client'

import { useState, useEffect } from 'react'
import { Bell, Coffee, Receipt, HelpCircle, X, Check, Loader2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WaiterCallProps {
  venueId: string
  venueName: string
  tableNumber: string
  orderId?: string
  onClose?: () => void
}

interface ActiveCall {
  id: string
  call_type: string
  status: string
  created_at: string
}

const callTypes = [
  { id: 'general', label: 'Garson Çağır', icon: Bell, color: 'bg-orange-500', description: 'Genel yardım' },
  { id: 'order', label: 'Sipariş Vermek', icon: Coffee, color: 'bg-blue-500', description: 'Yeni sipariş vermek istiyorum' },
  { id: 'bill', label: 'Hesap İste', icon: Receipt, color: 'bg-green-500', description: 'Hesabı getir' },
  { id: 'help', label: 'Yardım', icon: HelpCircle, color: 'bg-purple-500', description: 'Diğer konular' },
]

export default function WaiterCall({ venueId, venueName, tableNumber, orderId, onClose }: WaiterCallProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    checkActiveCall()
  }, [])

  useEffect(() => {
    if (currentUser && venueId) {
      subscribeToCallUpdates()
    }
  }, [currentUser, venueId])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const checkActiveCall = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('waiter_calls')
      .select('*')
      .eq('user_id', user.id)
      .eq('venue_id', venueId)
      .eq('table_number', tableNumber)
      .in('status', ['pending', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setActiveCall(data)
    }
  }

  const subscribeToCallUpdates = () => {
    if (!currentUser) return

    const channel = supabase
      .channel('waiter-call-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waiter_calls',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          if (payload.new.status === 'completed') {
            setActiveCall(null)
          } else if (payload.new.status === 'acknowledged') {
            setActiveCall(payload.new as ActiveCall)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleCall = async (callType: string) => {
    if (!currentUser) {
      alert('Lütfen giriş yapın')
      return
    }

    setLoading(true)
    setSelectedType(callType)

    const { data, error } = await supabase
      .from('waiter_calls')
      .insert({
        user_id: currentUser.id,
        venue_id: venueId,
        venue_name: venueName,
        table_number: tableNumber,
        order_id: orderId || null,
        call_type: callType,
        note: note || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Waiter call error:', error)
      alert('Bir hata oluştu, lütfen tekrar deneyin')
    } else {
      setActiveCall(data)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setIsOpen(false)
        setNote('')
        setSelectedType(null)
      }, 2000)
    }

    setLoading(false)
  }

  const cancelCall = async () => {
    if (!activeCall) return

    await supabase
      .from('waiter_calls')
      .update({ status: 'cancelled' })
      .eq('id', activeCall.id)

    setActiveCall(null)
  }

  const formatWaitTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Şimdi'
    return `${minutes} dk`
  }

  // Eğer aktif çağrı varsa, status göster
  if (activeCall) {
    const callTypeInfo = callTypes.find(t => t.id === activeCall.call_type) || callTypes[0]
    const CallIcon = callTypeInfo.icon

    return (
      <>
        {/* Floating Button - Active Call */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-40"
        >
          <div className={`relative p-4 ${activeCall.status === 'acknowledged' ? 'bg-green-500' : 'bg-orange-500'} rounded-full shadow-lg animate-pulse`}>
            <CallIcon className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Clock className="w-3 h-3 text-orange-500" />
            </span>
          </div>
        </button>

        {/* Status Modal */}
        {isOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
            <div className="bg-[#1a1a1a] rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Garson Çağrısı</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="text-center py-8">
                <div className={`w-20 h-20 ${activeCall.status === 'acknowledged' ? 'bg-green-500' : 'bg-orange-500'} rounded-full flex items-center justify-center mx-auto mb-4 ${activeCall.status === 'pending' ? 'animate-pulse' : ''}`}>
                  {activeCall.status === 'acknowledged' ? (
                    <Check className="w-10 h-10 text-white" />
                  ) : (
                    <CallIcon className="w-10 h-10 text-white" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {activeCall.status === 'acknowledged' ? 'Garson Geliyor!' : 'Çağrı Gönderildi'}
                </h3>
                <p className="text-gray-400 mb-2">{callTypeInfo.label}</p>
                <p className="text-sm text-gray-500">
                  Bekleme süresi: {formatWaitTime(activeCall.created_at)}
                </p>
              </div>

              <button
                onClick={cancelCall}
                className="w-full py-4 border border-red-500 text-red-500 rounded-xl font-medium hover:bg-red-500/10"
              >
                Çağrıyı İptal Et
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 p-4 bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
      >
        <Bell className="w-6 h-6 text-white" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-[#1a1a1a] rounded-t-3xl w-full max-w-lg p-6 animate-slide-up">
            {success ? (
              // Success State
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Garson Çağrıldı!</h3>
                <p className="text-gray-400">En kısa sürede masanıza gelecek.</p>
              </div>
            ) : (
              // Selection State
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Garson Çağır</h2>
                    <p className="text-sm text-gray-400">Masa {tableNumber}</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                {/* Call Types */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {callTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => !loading && handleCall(type.id)}
                      disabled={loading}
                      className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                        loading && selectedType === type.id
                          ? `${type.color} text-white`
                          : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                      } disabled:opacity-50`}
                    >
                      {loading && selectedType === type.id ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <type.icon className="w-8 h-8" />
                      )}
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-gray-400">{type.description}</span>
                    </button>
                  ))}
                </div>

                {/* Optional Note */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Not ekle (opsiyonel)"
                    className="w-full px-4 py-3 bg-[#2a2a2a] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Seçiminize tıklayarak garsonu çağırın
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Export for use in venue/order pages
export { WaiterCall }
