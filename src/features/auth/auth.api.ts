import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type { BranchType, LanguageCode } from '@/types/common'
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  MeResponse,
  RegisterOrganizationOwnerResponse,
  SendEmailOtpResponse,
  VerifyEmailOtpResponse,
} from '@/types/auth'

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
    latitude?: number
    longitude?: number
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

/** POST /auth/register-organization-owner — no longer returns a session (see
 *  RegisterOrganizationOwnerResponse). The account is created but `emailVerified: false`, so
 *  there is nothing to store in the auth store yet; the caller (RegisterOrganizationOwnerPage)
 *  routes to the login page's existing OTP-verification panel instead. */
export function useRegisterOrganizationOwnerMutation() {
  return useMutation({
    mutationFn: async (payload: RegisterOrganizationOwnerPayload) =>
      unwrapResponse<RegisterOrganizationOwnerResponse>(api.post('/auth/register-organization-owner', payload)),
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

/** POST /auth/send-otp — unauthenticated (no session yet). Surfaced from LoginPage when login
 *  returns 403 "please verify your email before logging in" for a self-registered org owner. */
export function useSendEmailOtpMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string }) =>
      unwrapResponse<SendEmailOtpResponse>(api.post('/auth/send-otp', payload)),
  })
}

/** POST /auth/verify-otp — unauthenticated; flips `emailVerified` server-side so a subsequent
 *  /auth/login call for this email stops 403'ing. Does not itself return a session/token. */
export function useVerifyEmailOtpMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string; code: string }) =>
      unwrapResponse<VerifyEmailOtpResponse>(api.post('/auth/verify-otp', payload)),
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
