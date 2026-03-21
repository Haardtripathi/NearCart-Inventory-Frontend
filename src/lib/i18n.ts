import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { en } from '@/i18n/locales/en'
import { gu } from '@/i18n/locales/gu'
import { hi } from '@/i18n/locales/hi'

export const resources = {
  en,
  hi,
  gu,
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu'],
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'navigation',
      'dashboard',
      'organizations',
      'products',
      'inventory',
      'orders',
      'purchases',
      'brands',
      'suppliers',
      'customers',
      'branches',
      'units',
      'masterCatalog',
      'settings',
      'validation',
    ],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nearcart-language',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
