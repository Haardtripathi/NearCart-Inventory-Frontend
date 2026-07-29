import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type { TaxRate, TranslationInput } from '@/types/common'

export interface TaxRateFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface TaxRatePayload {
  name: string
  code?: string
  rate: string | number
  isInclusive?: boolean
  isActive?: boolean
  translations?: TranslationInput[]
}

export const taxRatesKeys = {
  list: (organizationId: string | null, language: string, filters: TaxRateFilters) =>
    ['tax-rates', organizationId, language, filters] as const,
}

export function useTaxRatesQuery(filters: TaxRateFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: taxRatesKeys.list(activeOrganizationId, language, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<TaxRate>>(api.get('/tax-rates', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCreateTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TaxRatePayload) => unwrapResponse<TaxRate>(api.post('/tax-rates', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
    },
  })
}

export function useUpdateTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<TaxRatePayload> }) =>
      unwrapResponse<TaxRate>(api.patch(`/tax-rates/${id}`, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
    },
  })
}
