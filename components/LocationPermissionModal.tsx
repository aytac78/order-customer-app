'use client';

import { MapPin, X } from 'lucide-react';
import { useLocation } from '@/lib/LocationContext';

export default function LocationPermissionModal() {
  const { permission, setPermission } = useLocation();

  // İzin zaten ayarlanmışsa gösterme
  if (permission !== 'not_set') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Konum İzni</h2>
          <p className="text-white/80 text-sm mt-1">Yakınındaki mekanları gösterebilmemiz için</p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          <button type="button"
            onClick={() => setPermission('always')}
            className="w-full p-4 bg-[#242424] hover:bg-[#2a2a2a] rounded-xl text-left transition-colors"
          >
            <p className="font-semibold text-white">Her Zaman İzin Ver</p>
            <p className="text-sm text-gray-400 mt-1">Uygulama her açıldığında konumunuz kullanılır</p>
          </button>

          <button type="button"
            onClick={() => setPermission('while_using')}
            className="w-full p-4 bg-[#242424] hover:bg-[#2a2a2a] rounded-xl text-left transition-colors"
          >
            <p className="font-semibold text-white">Uygulamayı Kullanırken</p>
            <p className="text-sm text-gray-400 mt-1">Sadece uygulama açıkken konumunuz kullanılır</p>
          </button>

          <button type="button"
            onClick={() => setPermission('never')}
            className="w-full p-4 bg-[#242424] hover:bg-[#2a2a2a] rounded-xl text-left transition-colors"
          >
            <p className="font-semibold text-white">Asla</p>
            <p className="text-sm text-gray-400 mt-1">Konum kullanılmaz, varsayılan bölge gösterilir</p>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Bu ayarı daha sonra Profil → Ayarlar'dan değiştirebilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
}