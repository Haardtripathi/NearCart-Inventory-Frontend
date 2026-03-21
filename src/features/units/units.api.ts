import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type { TranslationInput, Unit } from '@/types/common'

export interface UnitFilters {
  page?: number
  limit?: number
  search?: string
}

export const unitsKeys = {
  list: (organizationId: string | null, language: string, filters: UnitFilters) =>
    ['units', organizationId, language, filters] as const,
  detail: (id: string, language: string) => ['units', id, language] as const,
}

export function useUnitsQuery(filters: UnitFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: unitsKeys.list(activeOrganizationId, language, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Unit>>(api.get('/units', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCreateUnitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { code: string; name: string; symbol?: string; allowsDecimal?: boolean; translations?: TranslationInput[] }) =>
      unwrapResponse<Unit>(api.post('/units', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export function useUpdateUnitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<{ code: string; name: string; symbol?: string; allowsDecimal?: boolean; translations?: TranslationInput[] }>
    }) => unwrapResponse<Unit>(api.patch(`/units/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['units'] }),
        queryClient.invalidateQueries({ queryKey: ['meta'] }),
        queryClient.invalidateQueries({ queryKey: unitsKeys.detail(variables.id, 'en') }),
        queryClient.invalidateQueries({ queryKey: unitsKeys.detail(variables.id, 'hi') }),
      ])
    },
  })
}
