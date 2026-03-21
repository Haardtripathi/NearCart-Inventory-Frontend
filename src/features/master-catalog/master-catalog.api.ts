import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type {
  ImportMasterCatalogPayload,
  ImportMasterCatalogResult,
  MasterCatalogCategory,
  MasterCatalogCategoryPayload,
  MasterCatalogItem,
  MasterCatalogItemPayload,
} from '@/types/masterCatalog'

export interface MasterCatalogCategoryFilters {
  industryId: string
  page?: number
  limit?: number
  search?: string
  parentId?: string
}

export interface MasterCatalogItemFilters {
  industryId: string
  page?: number
  limit?: number
  categoryId?: string
  q?: string
  hasVariants?: boolean
  isActive?: boolean
}

export const masterCatalogKeys = {
  categories: (language: string, filters: MasterCatalogCategoryFilters) =>
    ['master-catalog', 'categories', language, filters] as const,
  categoryTree: (language: string, industryId: string) =>
    ['master-catalog', 'categories', 'tree', language, industryId] as const,
  items: (organizationId: string | null, language: string, filters: MasterCatalogItemFilters) =>
    ['master-catalog', 'items', organizationId, language, filters] as const,
  detail: (organizationId: string | null, language: string, id: string) =>
    ['master-catalog', 'items', organizationId, language, id] as const,
  featured: (organizationId: string | null, language: string, industryId: string) =>
    ['master-catalog', 'featured', organizationId, language, industryId] as const,
}

export function useMasterCatalogCategoriesQuery(filters: MasterCatalogCategoryFilters) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: masterCatalogKeys.categories(language, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<MasterCatalogCategory>>(api.get('/master-catalog/categories', { params: filters })),
    enabled: Boolean(filters.industryId),
  })
}

export function useMasterCatalogCategoryTreeQuery(industryId?: string) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: masterCatalogKeys.categoryTree(language, industryId ?? 'unknown'),
    queryFn: async () =>
      unwrapResponse<MasterCatalogCategory[]>(api.get('/master-catalog/categories/tree', { params: { industryId } })),
    enabled: Boolean(industryId),
  })
}

export function useMasterCatalogItemsQuery(filters: MasterCatalogItemFilters) {
  const language = useUiStore((state) => state.language)
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: masterCatalogKeys.items(activeOrganizationId, language, filters),
    queryFn: async () =>
      unwrapResponse<PaginatedResponse<MasterCatalogItem>>(api.get('/master-catalog/items', { params: filters })),
    enabled: Boolean(filters.industryId),
  })
}

export function useMasterCatalogItemQuery(id?: string) {
  const language = useUiStore((state) => state.language)
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: masterCatalogKeys.detail(activeOrganizationId, language, id ?? 'unknown'),
    queryFn: async () =>
      unwrapResponse<MasterCatalogItem>(api.get(`/master-catalog/items/${id}`)),
    enabled: Boolean(id),
  })
}

export function useFeaturedMasterItemsQuery(industryId?: string) {
  const language = useUiStore((state) => state.language)
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: masterCatalogKeys.featured(activeOrganizationId, language, industryId ?? 'unknown'),
    queryFn: async () =>
      unwrapResponse<MasterCatalogItem[]>(
        api.get(`/master-catalog/industries/${industryId}/featured-items`, { params: { limit: 8 } }),
      ),
    enabled: Boolean(industryId),
  })
}

export function useImportMasterItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ImportMasterCatalogPayload }) =>
      unwrapResponse<ImportMasterCatalogResult>(api.post(`/master-catalog/items/${id}/import`, payload)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['master-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
  })
}

export function useCreateMasterCatalogCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MasterCatalogCategoryPayload) =>
      unwrapResponse<MasterCatalogCategory>(api.post('/master-catalog/categories', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['master-catalog'] })
    },
  })
}

export function useUpdateMasterCatalogCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<MasterCatalogCategoryPayload> }) =>
      unwrapResponse<MasterCatalogCategory>(api.patch(`/master-catalog/categories/${id}`, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['master-catalog'] })
    },
  })
}

export function useCreateMasterCatalogItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MasterCatalogItemPayload) =>
      unwrapResponse<MasterCatalogItem>(api.post('/master-catalog/items', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['master-catalog'] })
    },
  })
}

export function useUpdateMasterCatalogItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<MasterCatalogItemPayload> }) =>
      unwrapResponse<MasterCatalogItem>(api.patch(`/master-catalog/items/${id}`, payload)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['master-catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
  })
}
