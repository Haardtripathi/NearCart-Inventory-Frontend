import { type PropsWithChildren, useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { Toaster } from 'react-hot-toast'

import i18n from '@/lib/i18n'
import { queryClient } from '@/lib/queryClient'
import { toAppLanguage } from '@/lib/locale'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'

export function AppProviders({ children }: PropsWithChildren) {
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)
  const token = useAuthStore((state) => state.token)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const userPreferredLanguage = useAuthStore((state) => state.user?.preferredLanguage ?? null)
  const appliedAuthLanguageRef = useRef<string | null>(null)

  useEffect(() => {
    if (token && userId && userPreferredLanguage) {
      const syncKey = `${userId}:${userPreferredLanguage}`

      if (appliedAuthLanguageRef.current === syncKey) {
        return
      }

      appliedAuthLanguageRef.current = syncKey
      const preferredLanguage = toAppLanguage(userPreferredLanguage)

      if (language !== preferredLanguage) {
        setLanguage(preferredLanguage)
      }
      return
    }

    appliedAuthLanguageRef.current = null
    const detectedLanguage = toAppLanguage(i18n.resolvedLanguage)

    if (language !== detectedLanguage) {
      setLanguage(detectedLanguage)
    }
  }, [language, setLanguage, token, userId, userPreferredLanguage])

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
    document.documentElement.lang = language
  }, [language])

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              border: '1px solid var(--border)',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--foreground)',
              boxShadow: '0 18px 38px rgba(15, 23, 42, 0.12)',
            },
          }}
        />
      </QueryClientProvider>
    </I18nextProvider>
  )
}
