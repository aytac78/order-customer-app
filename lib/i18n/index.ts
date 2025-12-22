export * from './config';
export { useI18n, I18nProvider } from './I18nContext';

import { tr } from './locales/tr';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { fa } from './locales/fa';
import { it } from './locales/it';
import { id } from './locales/id';
import { th } from './locales/th';
import { ms } from './locales/ms';
import { Locale } from './config';

export const translations: Record<Locale, typeof tr> = {
  tr,
  en,
  ar,
  fa,
  it,
  id,
  th,
  ms,
};

// =============================================
// Language type ve languages array
// Settings sayfası için gerekli
// =============================================

export type Language = Locale;

export interface LanguageInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: LanguageInfo[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
];

export type { TranslationKeys } from './locales/tr';
