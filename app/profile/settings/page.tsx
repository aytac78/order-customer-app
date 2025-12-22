'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Phone, Shield, CheckCircle, AlertCircle, 
  Loader2, Bell, Moon, Sun, Globe, Lock, Trash2, MapPin, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from '@/lib/LocationContext';
import { useI18n, languages, type Language } from '@/lib/i18n';
import { useTheme } from '@/lib/ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { permission, setPermission, location } = useLocation();
  const { t, locale, setLocale } = useI18n();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (profile?.phone) {
      setPhone(profile.phone.replace('+90', ''));
    }
    // Load notification preference
    const notifPref = localStorage.getItem('notifications_enabled');
    if (notifPref !== null) {
      setNotificationsEnabled(notifPref === 'true');
    }
  }, [profile]);

  const handleSavePhone = async () => {
    if (!phone || phone.length < 10) {
      setError(t.settings?.invalidPhone || 'Geçerli bir telefon numarası girin');
      return;
    }

    setLoading(true);
    setError('');

    const formattedPhone = `+90${phone.replace(/^0/, '')}`;

    const { error: updateError } = await supabase
      .from('customer_profiles')
      .update({ phone: formattedPhone })
      .eq('user_id', user?.id);

    if (updateError) {
      setError(t.settings?.saveError || 'Kaydetme başarısız. Lütfen tekrar deneyin.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notifications_enabled', String(newValue));
  };

  const isPhoneVerified = !!profile?.phone;
  
  // Safe access to languages array with fallback
  const safeLanguages = languages || [];
  const currentLanguage = safeLanguages.find(l => l.code === locale) || safeLanguages[0] || { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{t.settings?.title || 'Ayarlar'}</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Telefon Kayıt */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isPhoneVerified ? 'bg-green-500/20' : 'bg-orange-500/20'
              }`}>
                {isPhoneVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Phone className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">{t.settings?.phone || 'Telefon Numarası'}</h3>
                <p className="text-sm text-gray-400">
                  {isPhoneVerified ? (t.settings?.registered || 'Kayıtlı') : (t.settings?.requiredForReservation || 'Rezervasyon için gerekli')}
                </p>
              </div>
            </div>
            {isPhoneVerified && (
              <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                ✓ {t.settings?.registered || 'Kayıtlı'}
              </span>
            )}
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-400">
              {t.settings?.phoneDesc || 'Rezervasyon ve sipariş verebilmek için telefon numaranızı kaydedin. Numaranız işletmelerle paylaşılmaz.'}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+90</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="5XX XXX XX XX"
                  maxLength={10}
                  className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 pl-14 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                onClick={handleSavePhone}
                disabled={loading || phone.length < 10}
                className="px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : (t.common?.save || 'Kaydet')}
              </button>
            </div>

            {saved && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                {t.settings?.phoneSaved || 'Telefon numarası kaydedildi!'}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Konum İzni */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">{t.settings?.location || 'Konum İzni'}</h3>
              <p className="text-sm text-gray-400">
                {location ? `${location.district}` : (t.settings?.showNearby || 'Yakındaki mekanları göster')}
              </p>
            </div>
          </div>

          <div className="p-2">
            {['always', 'while_using', 'never'].map((perm) => (
              <button
                key={perm}
                onClick={() => setPermission(perm as any)}
                className={`w-full p-3 rounded-xl text-left flex items-center justify-between transition-colors ${
                  permission === perm ? 'bg-blue-500/20' : 'hover:bg-[#242424]'
                }`}
              >
                <span className={permission === perm ? 'text-blue-400 font-medium' : 'text-gray-300'}>
                  {perm === 'always' && (t.settings?.locationAlways || 'Her Zaman İzin Ver')}
                  {perm === 'while_using' && (t.settings?.locationWhileUsing || 'Uygulamayı Kullanırken')}
                  {perm === 'never' && (t.settings?.locationNever || 'Asla')}
                </span>
                {permission === perm && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tercihler */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
          <h3 className="p-4 border-b border-white/5 font-semibold">{t.settings?.preferences || 'Tercihler'}</h3>
          
          <div className="divide-y divide-white/5">
            {/* Bildirimler */}
            <button onClick={toggleNotifications} className="w-full p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <span>{t.settings?.notifications || 'Bildirimler'}</span>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
              </div>
            </button>

            {/* Dark Mode */}
            <button onClick={toggleTheme} className="w-full p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-5 h-5 text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-500" />
                )}
                <span>{t.settings?.darkMode || 'Karanlık Tema'}</span>
              </div>
              <div className={`w-12 h-7 rounded-full relative transition-colors ${resolvedTheme === 'dark' ? 'bg-orange-500' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${resolvedTheme === 'dark' ? 'right-1' : 'left-1'}`} />
              </div>
            </button>

            {/* Dil Seçimi */}
            <button onClick={() => setShowLanguageModal(true)} className="w-full p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span>{t.settings?.language || 'Dil'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{currentLanguage.flag} {currentLanguage.name}</span>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </button>
          </div>
        </div>

        {/* Gizlilik Notu */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium text-sm">{t.settings?.privacyTitle || 'Gizlilik Güvencesi'}</p>
              <p className="text-gray-400 text-sm mt-1">
                {t.settings?.privacyDesc || `Telefon numaranız ve konumunuz sadece sistem içinde kullanılır. İşletmeler sadece anonim ID'nizi görür.`}
                {profile?.anonymous_id && ` (${profile.anonymous_id})`}
              </p>
            </div>
          </div>
        </div>

        {/* Hesap İşlemleri */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden">
          <h3 className="p-4 border-b border-white/5 font-semibold">{t.settings?.account || 'Hesap'}</h3>
          
          <div className="divide-y divide-white/5">
            <button className="w-full p-4 flex items-center gap-3 text-gray-400">
              <Lock className="w-5 h-5" />
              <span>{t.settings?.privacyPolicy || 'Gizlilik Politikası'}</span>
            </button>

            <button className="w-full p-4 flex items-center gap-3 text-red-500">
              <Trash2 className="w-5 h-5" />
              <span>{t.settings?.deleteAccount || 'Hesabı Sil'}</span>
            </button>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-gray-600 text-sm">
          ORDER v1.0.0
        </p>
      </div>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
          <div className="w-full bg-[#1a1a1a] rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.settings?.selectLanguage || 'Dil Seçin'}</h2>
              <button onClick={() => setShowLanguageModal(false)} className="text-gray-400">
                {t.common?.close || 'Kapat'}
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {safeLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code as Language);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-4 flex items-center justify-between border-b border-white/5 ${
                    locale === lang.code ? 'bg-orange-500/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-medium">{lang.name}</p>
                      <p className="text-sm text-gray-400">{lang.nativeName}</p>
                    </div>
                  </div>
                  {locale === lang.code && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
