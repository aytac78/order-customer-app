'use client'

import { Package, Truck, Eye, X } from 'lucide-react'

type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'browse'

interface OrderTypeModalProps {
  venueName: string
  onSelect: (type: OrderType) => void
  deliveryEnabled?: boolean
}

export default function OrderTypeModal({ venueName, onSelect, deliveryEnabled = false }: OrderTypeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-1">Nasıl sipariş vermek istersiniz?</h2>
          <p className="text-gray-400 text-sm">{venueName}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Paket Al */}
          <button
            onClick={() => onSelect('takeaway')}
            className="w-full p-4 bg-[#242424] hover:bg-[#2a2a2a] rounded-2xl flex items-center gap-4 transition-all group"
          >
            <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
              <Package className="w-7 h-7 text-orange-500" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-white text-lg">Paket Al</h3>
              <p className="text-gray-400 text-sm">Gel-Al siparişi ver, sıra beklemeden teslim al</p>
            </div>
          </button>

          {/* Eve Servis */}
          <button
            onClick={() => deliveryEnabled ? onSelect('delivery') : null}
            disabled={!deliveryEnabled}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
              deliveryEnabled 
                ? 'bg-[#242424] hover:bg-[#2a2a2a] group' 
                : 'bg-[#1a1a1a] border border-white/10 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              deliveryEnabled ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-gray-800'
            }`}>
              <Truck className={`w-7 h-7 ${deliveryEnabled ? 'text-green-500' : 'text-gray-600'}`} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-lg ${deliveryEnabled ? 'text-white' : 'text-gray-500'}`}>
                  Eve Servis
                </h3>
                {!deliveryEnabled && (
                  <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 rounded-full">Yakında</span>
                )}
              </div>
              <p className={`text-sm ${deliveryEnabled ? 'text-gray-400' : 'text-gray-600'}`}>
                Adresine teslim edilsin
              </p>
            </div>
          </button>

          {/* Sadece Bak */}
          <button
            onClick={() => onSelect('browse')}
            className="w-full p-4 bg-transparent hover:bg-[#242424] rounded-2xl flex items-center gap-4 transition-all border border-white/10 group"
          >
            <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
              <Eye className="w-7 h-7 text-gray-400" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-white text-lg">Sadece Menüye Bak</h3>
              <p className="text-gray-400 text-sm">Sipariş vermeden menüyü incele</p>
            </div>
          </button>
        </div>

        {/* Info */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Masada mısınız? QR kodu okutarak sipariş verebilirsiniz
        </p>
      </div>
    </div>
  )
}
