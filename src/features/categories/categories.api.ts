import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { getDisplayName } from '@/lib/utils'
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

// Categories come from the unpaged `/categories/tree` endpoint rather than the paged list — the
// list was requested as `{ page: 1, limit: 100 }`, so category 101+ silently vanished from every
// picker (and an edited product whose category was past it showed as "no category"). Flattened
// depth-first with an indent so the hierarchy still reads in a plain select.
export function useCategoryOptions(fallbackLabel?: string): Array<{ value: string; label: string }> {
  const { data } = useCategoryTreeQuery()

  return useMemo(() => {
    const options: Array<{ value: string; label: string }> = []
    const walk = (nodes: Category[], depth: number) => {
      for (const category of nodes) {
        options.push({
          value: category.id,
          label: `${'\u00A0\u00A0'.repeat(depth)}${depth > 0 ? '└ ' : ''}${getDisplayName(category, fallbackLabel)}`,
        })
        if (category.children?.length) {
          walk(category.children, depth + 1)
        }
      }
    }
    walk(data ?? [], 0)
    return options
  }, [data, fallbackLabel])
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
