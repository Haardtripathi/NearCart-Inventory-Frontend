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

const SUPPORTED_BACKEND_LANGUAGES = new Set<LanguageCode>(['EN', 'HI', 'GU'])

export function toBackendLanguage(language: AppLanguage): LanguageCode {
  return BACKEND_LANGUAGE_MAP[language] ?? 'EN'
}

export function normalizeBackendLanguage(language?: string | null): LanguageCode {
  const normalized = language?.trim().toUpperCase()
  return normalized && SUPPORTED_BACKEND_LANGUAGES.has(normalized as LanguageCode)
    ? (normalized as LanguageCode)
    : 'EN'
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
