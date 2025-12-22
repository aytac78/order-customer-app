'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Locale, defaultLocale, isRTL, locales } from './config';
import { translations } from './index';
import { TranslationKeys } from './locales/tr';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
  isRTL: boolean;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const LOCALE_STORAGE_KEY = 'order-customer-locale';

// Detect browser/device locale
function detectLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  // Check localStorage first
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  
  return defaultLocale;
}

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const detected = detectLocale();
    setLocaleState(detected);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      // Update document direction for RTL languages
      document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    }
  }, []);

  // Update document direction on mount and locale change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const t = translations[locale] || translations[defaultLocale];

  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(locale).format(num);
  }, [locale]);

  const formatCurrency = useCallback((amount: number, currency: string = 'TRY'): string => {
    // Map common currencies
    const currencyMap: Record<string, string> = {
      TRY: '₺',
      USD: '$',
      EUR: '€',
      GBP: '£',
      SAR: 'ر.س',
      IRR: '﷼',
      IDR: 'Rp',
      THB: '฿',
      MYR: 'RM',
    };

    const symbol = currencyMap[currency] || currency;
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

    // RTL languages need special handling
    if (isRTL(locale)) {
      return `${formatted} ${symbol}`;
    }
    return `${symbol}${formatted}`;
  }, [locale]);

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat(locale, options || defaultOptions).format(d);
  }, [locale]);

  const formatRelativeTime = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.time.justNow;
    if (diffMins < 60) return t.time.minutesAgo.replace('{{count}}', String(diffMins));
    if (diffHours < 24) return t.time.hoursAgo.replace('{{count}}', String(diffHours));
    if (diffDays === 1) return t.time.yesterday;
    if (diffDays < 7) return t.time.daysAgo.replace('{{count}}', String(diffDays));
    
    return formatDate(d, { month: 'short', day: 'numeric' });
  }, [locale, t, formatDate]);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    isRTL: isRTL(locale),
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLocale must be used within an I18nProvider');
  }
  return {
    locale: context.locale,
    setLocale: context.setLocale,
    isRTL: context.isRTL,
  };
}
