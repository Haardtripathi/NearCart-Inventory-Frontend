import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type { Customer } from '@/types/common'

export interface CustomerFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export const customersKeys = {
  list: (organizationId: string | null, language: string, filters: CustomerFilters) => ['customers', organizationId, language, filters] as const,
  detail: (id: string, language: string) => ['customers', id, language] as const,
}

export function useCustomersQuery(filters: CustomerFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: customersKeys.list(activeOrganizationId, language, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Customer>>(api.get('/customers', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCustomerQuery(id?: string) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: customersKeys.detail(id ?? 'unknown', language),
    queryFn: async () => unwrapResponse<Customer>(api.get(`/customers/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Customer>) =>
      unwrapResponse<Customer>(api.post('/customers', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Customer> }) =>
      unwrapResponse<Customer>(api.patch(`/customers/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customers', variables.id] }),
      ])
    },
  })
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Customer>(api.delete(`/customers/${id}`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
        queryClient.invalidateQueries({ queryKey: ['customers', id] }),
      ])
    },
  })
}
