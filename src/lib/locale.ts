import type { AppLanguage, LanguageCode } from '@/types/common'

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  gu: 'Gujarati',
}

export const BACKEND_LANGUAGE_MAP: Record<AppLanguage, LanguageCode> = {
  en: 'EN',
  hi: 'HI',
  gu: 'GU',
}

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'en'

export function toBackendLanguage(language: AppLanguage): LanguageCode {
  return BACKEND_LANGUAGE_MAP[language] ?? 'EN'
}

export function toAppLanguage(language?: string | null): AppLanguage {
  switch (language?.toLowerCase()) {
    case 'hi':
      return 'hi'
    case 'gu':
      return 'gu'
    default:
      return 'en'
  }
}
