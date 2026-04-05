import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { authKeys } from '@/features/auth/auth.api'
import { useUiStore } from '@/store/ui.store'
import type { Branch, BranchType, LanguageCode, OrganizationSummary, UserAccessLink } from '@/types/common'

export const organizationsKeys = {
  mine: (language: string) => ['organizations', 'my', language] as const,
  detail: (id: string, language: string) => ['organizations', id, language] as const,
}

export interface CreateOrganizationPayload {
  name: string
  slug?: string
  legalName?: string
  phone?: string
  email?: string
  currencyCode?: string
  timezone?: string
  defaultLanguage?: LanguageCode
  enabledLanguages?: LanguageCode[]
  ownerUserId?: string
  owner?: {
    fullName: string
    email: string
    preferredLanguage?: LanguageCode
  }
  primaryIndustryId: string
  firstBranch: {
    code: string
    name: string
    type: BranchType
    phone?: string
    email?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

export interface AddOrganizationIndustryPayload {
  industryId: string
  isPrimary?: boolean
}

export interface CreatedOrganization extends OrganizationSummary {
  firstBranch: Branch
  ownerUser?: {
    id: string
    fullName: string
    email: string
    preferredLanguage: LanguageCode
    requiresAccountSetup: boolean
  }
  ownerAccessLink?: Pick<UserAccessLink, 'purpose' | 'token' | 'url' | 'expiresAt'> | null
}

export function useMyOrganizationsQuery() {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: organizationsKeys.mine(language),
    queryFn: async () => unwrapResponse<OrganizationSummary[]>(api.get('/organizations/my')),
  })
}

export function useOrganizationQuery(id?: string) {
  const language = useUiStore((state) => state.language)

  return useQuery({
    queryKey: organizationsKeys.detail(id ?? 'unknown', language),
    queryFn: async () => unwrapResponse<OrganizationSummary>(api.get(`/organizations/${id}`)),
    enabled: Boolean(id),
  })
}

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateOrganizationPayload) =>
      unwrapResponse<CreatedOrganization>(api.post('/organizations', payload)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organizations'] }),
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
      ])
    },
  })
}

export function useAddOrganizationIndustryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ organizationId, payload }: { organizationId: string; payload: AddOrganizationIndustryPayload }) =>
      unwrapResponse(api.post(`/organizations/${organizationId}/industries`, payload)),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organizations'] }),
        queryClient.invalidateQueries({ queryKey: ['organizations', variables.organizationId] }),
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
      ])
    },
  })
}
