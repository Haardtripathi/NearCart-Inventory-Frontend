import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { PaginatedResponse } from '@/types/api'
import type { Brand } from '@/types/common'

export interface BrandFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export const brandsKeys = {
  list: (organizationId: string | null, filters: BrandFilters) => ['brands', organizationId, filters] as const,
}

export function useBrandsQuery(filters: BrandFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: brandsKeys.list(activeOrganizationId, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Brand>>(api.get('/brands', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Brand>) => unwrapResponse<Brand>(api.post('/brands', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

export function useUpdateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Brand> }) =>
      unwrapResponse<Brand>(api.patch(`/brands/${id}`, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

export function useDeleteBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Brand>(api.delete(`/brands/${id}`)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}
