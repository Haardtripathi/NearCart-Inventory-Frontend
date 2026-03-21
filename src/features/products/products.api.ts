import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import type { PaginatedResponse } from '@/types/api'
import type { Product, ProductPayload, ProductQuery, ProductVariant, ProductVariantPayload } from '@/types/product'

export const productsKeys = {
  list: (organizationId: string | null, language: string, filters: ProductQuery) =>
    ['products', organizationId, language, filters] as const,
  detail: (id: string, language: string) => ['products', id, language] as const,
  variants: (id: string, language: string) => ['products', id, 'variants', language] as const,
}

export function useProductsQuery(filters: ProductQuery) {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: productsKeys.list(activeOrganizationId, language, filters),
    queryFn: async () => unwrapResponse<PaginatedResponse<Product>>(api.get('/products', { params: filters })),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useProductQuery(id?: string) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: productsKeys.detail(id ?? 'unknown', language),
    queryFn: async () => unwrapResponse<Product>(api.get(`/products/${id}`)),
    enabled: Boolean(id),
  })
}

export function useProductVariantsQuery(id?: string) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: productsKeys.variants(id ?? 'unknown', language),
    queryFn: async () => unwrapResponse<ProductVariant[]>(api.get(`/products/${id}/variants`)),
    enabled: Boolean(id),
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProductPayload) => unwrapResponse<Product>(api.post('/products', payload)),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: productsKeys.detail(data.id, 'en') }),
      ])
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ProductPayload> }) =>
      unwrapResponse<Product>(api.patch(`/products/${id}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: productsKeys.detail(variables.id, 'en') }),
      ])
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => unwrapResponse<Product>(api.delete(`/products/${id}`)),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: productsKeys.detail(id, 'en') }),
      ])
    },
  })
}

export function useCreateVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, payload }: { productId: string; payload: ProductVariantPayload }) =>
      unwrapResponse<ProductVariant>(api.post(`/products/${productId}/variants`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: productsKeys.variants(variables.productId, 'en') }),
      ])
    },
  })
}

export function useUpdateVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      payload,
    }: {
      productId: string
      variantId: string
      payload: Partial<ProductVariantPayload>
    }) =>
      unwrapResponse<ProductVariant>(api.patch(`/products/${productId}/variants/${variantId}`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: productsKeys.variants(variables.productId, 'en') }),
      ])
    },
  })
}

export function useDeleteVariantMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, variantId }: { productId: string; variantId: string }) =>
      unwrapResponse<ProductVariant>(api.delete(`/products/${productId}/variants/${variantId}`)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: productsKeys.variants(variables.productId, 'en') }),
      ])
    },
  })
}
