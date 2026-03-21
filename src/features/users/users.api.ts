import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api, unwrapResponse } from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import type {
  BranchAccessState,
  DirectoryUser,
  LanguageCode,
  MembershipStatus,
  OrganizationUser,
  UserAccessLink,
  UserRole,
} from '@/types/common'

export interface CreateOrganizationUserPayload {
  fullName: string
  email: string
  role: UserRole
  preferredLanguage?: LanguageCode
  branchAccess?: BranchAccessState
}

export interface UpdateOrganizationUserPayload {
  fullName?: string
  role?: UserRole
  preferredLanguage?: LanguageCode
  status?: MembershipStatus
  branchAccess?: BranchAccessState
}

export const usersKeys = {
  organization: (organizationId: string | null) => ['users', organizationId] as const,
  directory: (search: string) => ['users', 'directory', search] as const,
}

export function useOrganizationUsersQuery() {
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useQuery({
    queryKey: usersKeys.organization(activeOrganizationId),
    queryFn: async () => unwrapResponse<OrganizationUser[]>(api.get('/users')),
    enabled: Boolean(activeOrganizationId),
  })
}

export function useUserDirectoryQuery(search: string, enabled = true) {
  return useQuery({
    queryKey: usersKeys.directory(search),
    queryFn: async () =>
      unwrapResponse<DirectoryUser[]>(api.get('/users/directory', {
        params: {
          search: search || undefined,
        },
      })),
    enabled,
    staleTime: 60_000,
  })
}

export function useCreateOrganizationUserMutation() {
  const queryClient = useQueryClient()
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useMutation({
    mutationFn: async (payload: CreateOrganizationUserPayload) =>
      unwrapResponse<{ user: OrganizationUser; accessLink: UserAccessLink | null }>(api.post('/users', payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.organization(activeOrganizationId) })
    },
  })
}

export function useUpdateOrganizationUserMutation() {
  const queryClient = useQueryClient()
  const activeOrganizationId = useAuthStore((state) => state.activeOrganizationId)

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateOrganizationUserPayload }) =>
      unwrapResponse<OrganizationUser>(api.patch(`/users/${id}`, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.organization(activeOrganizationId) })
    },
  })
}

export function useGenerateUserAccessLinkMutation() {
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrapResponse<UserAccessLink>(api.post(`/users/${userId}/access-link`)),
  })
}
