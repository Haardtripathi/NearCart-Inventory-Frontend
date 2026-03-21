import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type {
  Industry,
  TranslationInput,
  LocalizationContext,
  TaxRate,
  Unit,
} from '@/types/common'

export const metaKeys = {
  languages: ['meta', 'languages'] as const,
  localizationContext: (language: string, organizationId: string | null) =>
    ['meta', 'localization-context', language, organizationId] as const,
  industries: (language: string) => ['platform', 'industries', language] as const,
  units: (organizationId: string | null) => ['units', organizationId] as const,
  taxRates: (organizationId: string | null) => ['tax-rates', organizationId] as const,
  health: ['system', 'health'] as const,
}

export function useHealthQuery() {
  return useQuery({
    queryKey: metaKeys.health,
    queryFn: async () =>
      unwrapResponse<{ status: string; timestamp: string }>(api.get('/health')),
    staleTime: 120_000,
  })
}

export function useLanguagesQuery() {
  return useQuery({
    queryKey: metaKeys.languages,
    queryFn: async () =>
      unwrapResponse<{ items: string[] }>(api.get('/meta/languages')),
    staleTime: Infinity,
  })
}

export function useLocalizationContextQuery(enabled = true) {
  const language = useUiStore((state) => state.language)
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: metaKeys.localizationContext(language, activeOrganizationId),
    queryFn: async () =>
      unwrapResponse<LocalizationContext>(api.get('/meta/localization-context')),
    enabled: enabled && Boolean(token),
  })
}

export function useIndustriesQuery() {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: metaKeys.industries(language),
    queryFn: async () => unwrapResponse<Industry[]>(api.get('/platform/industries')),
    staleTime: 120_000,
  })
}

export interface CreateIndustryPayload {
  code: string
  name: string
  description?: string
  isActive?: boolean
  defaultFeatures?: Record<string, unknown>
  defaultSettings?: unknown
  customFieldDefinitions?: unknown
  translations?: TranslationInput[]
}

export function useCreateIndustryMutation() {
  const queryClient = useQueryClient()
  const language = useUiStore((state) => state.language)

  return useMutation({
    mutationFn: async (payload: CreateIndustryPayload) =>
      unwrapResponse<Industry>(api.post('/platform/industries', {
        ...payload,
        defaultFeatures: payload.defaultFeatures ?? {},
      })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: metaKeys.industries(language) })
    },
  })
}

export function useUnitsQuery() {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: metaKeys.units(activeOrganizationId),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<Unit>>(api.get('/units', { params: { page: 1, limit: 100 } })),
    enabled: Boolean(token) && Boolean(activeOrganizationId),
    staleTime: 120_000,
  })
}

export function useTaxRatesQuery() {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: metaKeys.taxRates(activeOrganizationId),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<TaxRate>>(api.get('/tax-rates', { params: { page: 1, limit: 100 } })),
    enabled: Boolean(token) && Boolean(activeOrganizationId),
    staleTime: 120_000,
  })
}
