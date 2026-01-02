'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Send, QrCode, CreditCard, Wallet, TrendingUp } from 'lucide-react'

const transactions = [
  { id: 1, type: 'payment', venue: 'Sunset Beach Club', amount: -450, date: '8 Aralık 2025', icon: '🏖️' },
  { id: 2, type: 'topup', venue: 'Bakiye Yükleme', amount: 1000, date: '7 Aralık 2025', icon: '💳' },
  { id: 3, type: 'payment', venue: 'Mojo Lounge', amount: -280, date: '6 Aralık 2025', icon: '🍸' },
  { id: 4, type: 'cashback', venue: 'Cashback Kazanımı', amount: 45, date: '6 Aralık 2025', icon: '🎁' },
  { id: 5, type: 'payment', venue: 'Lucca Cafe', amount: -120, date: '5 Aralık 2025', icon: '☕' },
]

export default function WalletPage() {
  const router = useRouter()
  const [showTopup, setShowTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')

  const quickAmounts = [100, 250, 500, 1000]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-8">
      <header className="sticky top-0 z-40 glass border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">TiT Pay Cüzdan</h1>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-3xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-6 h-6" />
              <span className="font-medium">Mevcut Bakiye</span>
            </div>
            <p className="text-4xl font-bold mb-1">₺5,000.00</p>
            <p className="text-white/70 text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Bu ay ₺1,200 harcadınız
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button type="button" onClick={() => setShowTopup(true)} className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/5">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm">Yükle</span>
          </button>
          <button type="button" onClick={() => alert('Para gönderme özelliği yakında!')} className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/5">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm">Gönder</span>
          </button>
          <button type="button" onClick={() => alert('QR ile ödeme özelliği yakında!')} className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/5">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm">QR Öde</span>
          </button>
        </div>

        {/* Cashback Info */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎁</span>
            <div>
              <p className="font-semibold">%5 Cashback Kazanın!</p>
              <p className="text-gray-400 text-sm">ORDER Partner mekanlarda ödemelerde</p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Son İşlemler</h2>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-4 border border-white/5">
                <div className="w-12 h-12 bg-[#242424] rounded-xl flex items-center justify-center text-2xl">
                  {tx.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{tx.venue}</p>
                  <p className="text-gray-500 text-sm">{tx.date}</p>
                </div>
                <p className={`font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                  {tx.amount > 0 ? '+' : ''}₺{Math.abs(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Topup Modal */}
      {showTopup && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#121212] w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Bakiye Yükle</h2>
              <button type="button" onClick={() => setShowTopup(false)} className="text-gray-400">✕</button>
            </div>

            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Yüklenecek Tutar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">₺</span>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl font-bold text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {quickAmounts.map((amount) => (
                <button type="button"
                  key={amount}
                  onClick={() => setTopupAmount(amount.toString())}
                  className={`py-3 rounded-xl font-medium ${topupAmount === amount.toString() ? 'bg-orange-500' : 'bg-[#1a1a1a]'}`}
                >
                  ₺{amount}
                </button>
              ))}
            </div>

            <button type="button" className="w-full py-4 bg-orange-500 rounded-2xl font-semibold flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />
              Kartla Yükle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}