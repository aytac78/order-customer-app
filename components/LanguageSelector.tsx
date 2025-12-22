'use client';

import { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n, Locale, locales, localeNames, localeFlags } from '@/lib/i18n';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'list' | 'compact';
  showFlags?: boolean;
  showNames?: boolean;
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showFlags = true, 
  showNames = true 
}: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-400 mb-3">{t.profile.language}</p>
        <div className="grid grid-cols-2 gap-2">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                locale === loc
                  ? 'bg-orange-500 text-white'
                  : 'bg-[#1a1a1a] text-white hover:bg-[#252525]'
              }`}
            >
              {showFlags && <span className="text-xl">{localeFlags[loc]}</span>}
              {showNames && <span className="text-sm font-medium">{localeNames[loc]}</span>}
              {locale === loc && <Check className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] transition-colors"
        >
          <span className="text-lg">{localeFlags[locale]}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-40 bg-[#1a1a1a] rounded-xl shadow-xl border border-[#333] z-50 overflow-hidden">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocale(loc);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition-colors ${
                    locale === loc ? 'bg-orange-500/20 text-orange-400' : 'text-white'
                  }`}
                >
                  <span className="text-lg">{localeFlags[loc]}</span>
                  <span className="text-sm">{localeNames[loc]}</span>
                  {locale === loc && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#252525] transition-colors"
      >
        <Globe className="w-5 h-5 text-gray-400" />
        <div className="flex-1 text-left">
          <p className="text-sm text-gray-400">{t.profile.language}</p>
          <div className="flex items-center gap-2">
            {showFlags && <span className="text-lg">{localeFlags[locale]}</span>}
            <span className="text-white font-medium">{localeNames[locale]}</span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-[#1a1a1a] rounded-xl shadow-xl border border-[#333] z-50 overflow-hidden max-h-64 overflow-y-auto">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition-colors ${
                  locale === loc ? 'bg-orange-500/20 text-orange-400' : 'text-white'
                }`}
              >
                {showFlags && <span className="text-xl">{localeFlags[loc]}</span>}
                <span className="flex-1 text-left">{localeNames[loc]}</span>
                {locale === loc && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
