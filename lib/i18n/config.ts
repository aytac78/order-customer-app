export type Locale = 'tr' | 'en' | 'ar' | 'fa' | 'it' | 'id' | 'th' | 'ms';

export const locales: Locale[] = ['tr', 'en', 'ar', 'fa', 'it', 'id', 'th', 'ms'];

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
  fa: 'فارسی',
  it: 'Italiano',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
  ms: 'Bahasa Melayu',
};

export const localeFlags: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  ar: '🇸🇦',
  fa: '🇮🇷',
  it: '🇮🇹',
  id: '🇮🇩',
  th: '🇹🇭',
  ms: '🇲🇾',
};

export const rtlLocales: Locale[] = ['ar', 'fa'];

export const defaultLocale: Locale = 'tr';

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
