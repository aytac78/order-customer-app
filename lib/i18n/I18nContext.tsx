'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Locale, defaultLocale, isRTL, locales } from './config';
import { tr, TranslationKeys } from './locales/tr';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { fa } from './locales/fa';
import { it } from './locales/it';
import { id } from './locales/id';
import { th } from './locales/th';
import { ms } from './locales/ms';

const translations: Record<Locale, any> = {
  tr, en, ar, fa, it, id, th, ms,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
  translations: TranslationKeys;
  isRTL: boolean;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const browserLang = navigator.language.split('-')[0];
  if (locales.includes(browserLang as Locale)) return browserLang as Locale;
  return defaultLocale;
}

function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('order-locale');
  if (stored && locales.includes(stored as Locale)) return stored as Locale;
  return null;
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
    const stored = getStoredLocale();
    if (stored) setLocaleState(stored);
    else setLocaleState(detectBrowserLocale());
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
      localStorage.setItem('order-locale', locale);
    }
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const currentTranslations = translations[locale];

  const t = useCallback((key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') value = value[k];
      else return key;
    }
    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, p) => params[p]?.toString() || '');
    }
    return typeof value === 'string' ? value : key;
  }, [locale]);

  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(locale).format(num);
  }, [locale]);

  const formatCurrency = useCallback((amount: number, currency: string = 'TRY'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
    }).format(amount);
  }, [locale]);

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options || { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  }, [locale]);

  const formatRelativeTime = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return currentTranslations.time.justNow;
    if (diffMins < 60) return currentTranslations.time.minutesAgo.replace('{{count}}', diffMins.toString());
    if (diffHours < 24) return currentTranslations.time.hoursAgo.replace('{{count}}', diffHours.toString());
    if (diffDays === 1) return currentTranslations.time.yesterday;
    if (diffDays < 7) return currentTranslations.time.daysAgo.replace('{{count}}', diffDays.toString());
    return formatDate(d);
  }, [locale, currentTranslations, formatDate]);

  const value: I18nContextType = {
    locale, setLocale, t, translations: currentTranslations,
    isRTL: isRTL(locale), formatNumber, formatCurrency, formatDate, formatRelativeTime,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
