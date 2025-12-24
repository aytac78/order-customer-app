'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Globe, 
  Bell, 
  Moon, 
  Sun, 
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n, locales, localeNames, localeFlags } from '@/lib/i18n';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [showLanguages, setShowLanguages] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{t('profile.settings')}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Dil Ayarları */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">{t('profile.language')}</h2>
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowLanguages(!showLanguages)}
              className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{t('profile.language')}</p>
                <p className="text-sm text-gray-400">{localeFlags[locale]} {localeNames[locale]}</p>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showLanguages ? 'rotate-90' : ''}`} />
            </button>
            
            {showLanguages && (
              <div className="border-t border-white/10 p-2">
                <div className="grid grid-cols-2 gap-2">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocale(loc);
                        setShowLanguages(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        locale === loc
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#252525] text-white hover:bg-[#333]'
                      }`}
                    >
                      <span className="text-xl">{localeFlags[loc]}</span>
                      <span className="text-sm font-medium">{localeNames[loc]}</span>
                      {locale === loc && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Bildirim Ayarları */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">Bildirimler</h2>
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Bildirimler</p>
                <p className="text-sm text-gray-400">Sipariş ve kampanya bildirimleri</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-7 rounded-full transition-colors ${notifications ? 'bg-orange-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${notifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Görünüm Ayarları */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">Görünüm</h2>
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                {darkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">Karanlık Mod</p>
                <p className="text-sm text-gray-400">{darkMode ? 'Açık' : 'Kapalı'}</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-purple-500' : 'bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${darkMode ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Diğer */}
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-3 px-1">Diğer</h2>
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden divide-y divide-white/10">
            <button className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Gizlilik</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Yardım</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Kullanım Koşulları</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>

        {/* Çıkış Yap */}
        {user && (
          <section>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-4 bg-red-500/10 rounded-2xl hover:bg-red-500/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <p className="font-medium text-red-400">{t('profile.logout')}</p>
            </button>
          </section>
        )}

        {/* Version */}
        <div className="text-center text-gray-500 text-sm pt-4">
          <p>ORDER Customer v1.0.0</p>
          <p className="text-xs mt-1">© 2025 TiT Ecosystem</p>
        </div>
      </div>
    </div>
  );
}
