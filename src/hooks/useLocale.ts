import i18n from '@/lib/i18n'
import { useUiStore } from '@/store/ui.store'
import { LANGUAGE_LABELS, toAppLanguage, toBackendLanguage } from '@/lib/locale'
import { useUpdateMyPreferencesMutation } from '@/features/auth/auth.api'
import { useAuth } from './useAuth'
import type { AppLanguage } from '@/types/common'

export function useLocale() {
  const language = useUiStore((state) => state.language)
  const setLanguageState = useUiStore((state) => state.setLanguage)
  const { isAuthenticated } = useAuth()
  const updatePreferencesMutation = useUpdateMyPreferencesMutation()

  const setLanguage = async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage)
    await i18n.changeLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage

    if (isAuthenticated) {
      await updatePreferencesMutation.mutateAsync({
        preferredLanguage: toBackendLanguage(nextLanguage),
      })
    }
  }

  return {
    language: toAppLanguage(language),
    setLanguage,
    languageLabel: LANGUAGE_LABELS[toAppLanguage(language)],
  }
}
