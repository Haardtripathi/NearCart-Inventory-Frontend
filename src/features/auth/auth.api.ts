import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { BranchType, LanguageCode } from '@/types/common'
import type { AuthUser, LoginPayload, LoginResponse, MeResponse } from '@/types/auth'

export interface RegisterOrganizationOwnerPayload {
  fullName: string
  email: string
  password: string
  preferredLanguage?: LanguageCode
  name: string
  slug?: string
  legalName?: string
  phone?: string
  organizationEmail?: string
  currencyCode?: string
  timezone?: string
  defaultLanguage?: LanguageCode
  enabledLanguages?: LanguageCode[]
  primaryIndustryId: string
  enabledFeatures?: Record<string, unknown>
  customSettings?: unknown
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

export interface ActionTokenPasswordPayload {
  token: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (payload: LoginPayload) =>
      unwrapResponse<LoginResponse>(api.post('/auth/login', payload)),
    onSuccess: (data) => {
      setSession(data)
    },
  })
}

export function useRegisterOrganizationOwnerMutation() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (payload: RegisterOrganizationOwnerPayload) =>
      unwrapResponse<LoginResponse>(api.post('/auth/register-organization-owner', payload)),
    onSuccess: (data) => {
      setSession(data)
    },
  })
}

export function useCompleteAccountSetupMutation() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (payload: ActionTokenPasswordPayload) =>
      unwrapResponse<LoginResponse>(api.post('/auth/complete-account-setup', payload)),
    onSuccess: (data) => {
      setSession(data)
    },
  })
}

export function useResetPasswordMutation() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: async (payload: ActionTokenPasswordPayload) =>
      unwrapResponse<LoginResponse>(api.post('/auth/reset-password', payload)),
    onSuccess: (data) => {
      setSession(data)
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) =>
      unwrapResponse<{ success: boolean }>(api.post('/auth/change-password', payload)),
  })
}

export function useUpdateMyPreferencesMutation() {
  const updateUser = useAuthStore((state) => state.updateUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { preferredLanguage: LanguageCode }) =>
      unwrapResponse<AuthUser>(api.patch('/auth/me/preferences', payload)),
    onSuccess: async (data) => {
      updateUser(data)
      await queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useMeQuery(enabled = true) {
  const token = useAuthStore((state) => state.token)
  const syncProfile = useAuthStore((state) => state.syncProfile)

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const data = await unwrapResponse<MeResponse>(api.get('/auth/me'))
      syncProfile(data)
      return data
    },
    enabled: enabled && Boolean(token),
    staleTime: 60_000,
  })
}
