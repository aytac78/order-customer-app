'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Users, Minus, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

function NewReservationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venue');
  const venueName = searchParams.get('name') || 'Mekan';
  
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [venue, setVenue] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    partySize: 2,
    name: '',
    phone: '',
    notes: ''
  });

  // Kullanıcı bilgilerini otomatik doldur
  useEffect(() => {
    if (profile && user) {
      setFormData(prev => ({
        ...prev,
        name: profile.display_name || '',
        phone: (user as any).phone || profile?.phone || ''
      }));
    }
  }, [profile, user]);

  // Venue bilgisi al
  useEffect(() => {
    if (venueId) {
      loadVenue();
    }
  }, [venueId]);

  const loadVenue = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();
    
    if (data) setVenue(data);
  };

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const handleSubmit = async () => {
    if (!formData.date || !formData.time || !formData.name || !formData.phone) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('reservations').insert({
      venue_id: venueId,
      user_id: user?.id,
      customer_name: formData.name,
      customer_phone: formData.phone,
      reservation_date: formData.date,
      reservation_time: formData.time,
      party_size: formData.partySize,
      notes: formData.notes,
      status: 'pending'
    });

    setLoading(false);

    if (error) {
      alert('Rezervasyon oluşturulamadı');
    } else {
      router.push('/reservations?success=1');
    }
  };

  // Minimum tarih: bugün
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Rezervasyon Yap</h1>
            <p className="text-gray-400 text-sm">{venueName}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Tarih Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Tarih Seçin *
          </label>
          <input
            type="date"
            min={today}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Saat Seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Saat Seçin *
          </label>
          <div className="grid grid-cols-5 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setFormData({ ...formData, time })}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.time === time
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#1a1a1a] border border-white/10 text-gray-400 hover:border-orange-500'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Kişi Sayısı */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Kişi Sayısı
          </label>
          <div className="flex items-center justify-center gap-6 bg-[#1a1a1a] border border-white/10 rounded-xl py-4">
            <button
              onClick={() => setFormData({ ...formData, partySize: Math.max(1, formData.partySize - 1) })}
              className="w-12 h-12 rounded-full bg-[#242424] flex items-center justify-center"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-3xl font-bold w-12 text-center">{formData.partySize}</span>
            <button
              onClick={() => setFormData({ ...formData, partySize: Math.min(20, formData.partySize + 1) })}
              className="w-12 h-12 rounded-full bg-[#242424] flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* İsim */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            İsim Soyisim *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Adınız Soyadınız"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          {profile && (
            <p className="text-xs text-gray-500 mt-1">
              💡 İşletme sadece anonim ID'nizi görecek: {profile.anonymous_id}
            </p>
          )}
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Telefon *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="05XX XXX XX XX"
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            🔒 Telefon numaranız işletmeyle paylaşılmaz
          </p>
        </div>

        {/* Notlar */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Özel İstekler (opsiyonel)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Doğum günü, pencere kenarı, bebek sandalyesi vs."
            rows={3}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>

        {/* Gizlilik Notu */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 text-sm">
            🛡️ <strong>Gizlilik Güvencesi:</strong> Kişisel bilgileriniz (isim, telefon) işletmeyle paylaşılmaz. 
            İşletme sadece anonim ID'nizi ({profile?.anonymous_id}) ve özel isteklerinizi görür. 
            Tüm iletişim uygulama üzerinden yapılır.
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.date || !formData.time || !formData.name || !formData.phone}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              Rezervasyon Yap
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <NewReservationContent />
    </Suspense>
  );
}
