'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { useI18n, languages } from '@/lib/i18n'

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === locale)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        title="Dil Seç"
      >
        <span className="text-lg">{currentLang?.flag || '🌐'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  locale === lang.code 
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="flex-1 text-left text-sm font-medium">{lang.nativeName}</span>
                {locale === lang.code && (
                  <Check className="w-4 h-4 text-orange-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
