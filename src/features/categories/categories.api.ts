import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { APP_LANGUAGES } from '@/types/common'
import type { PaginatedResponse } from '@/types/api'
import type { Category } from '@/types/common'

export interface CategoryFilters {
  page?: number
  limit?: number
  search?: string
  parentId?: string
  isActive?: boolean
}

export const categoriesKeys = {
  list: (organizationId: string | null, language: string, filters: CategoryFilters) =>
    ['categories', organizationId, language, filters] as const,
  tree: (organizationId: string | null, language: string) => ['categories', 'tree', organizationId, language] as const,
  detail: (id: string, language: string) => ['categories', id, language] as const,
}

export function useCategoriesQuery(filters: CategoryFilters) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: categoriesKeys.list(activeOrganizationId, language, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Category>>(api.get('/categories', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCategoryTreeQuery() {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: categoriesKeys.tree(activeOrganizationId, language),
    queryFn: async () => unwrapResponse<Category[]>(api.get('/categories/tree')),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useCategoryQuery(id?: string) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: categoriesKeys.detail(id ?? 'unknown', language),
    queryFn: async () => unwrapResponse<Category>(api.get(`/categories/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Category>) =>
      unwrapResponse<Category>(api.post('/categories', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Category> }) =>
      unwrapResponse<Category>(api.patch(`/categories/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        ...APP_LANGUAGES.map((language) =>
          queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(variables.id, language) }),
        ),
      ])
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Category>(api.delete(`/categories/${id}`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(id, 'en') }),
      ])
    },
  })
}
